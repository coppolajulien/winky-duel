// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title WinkyDuel
 * @notice Blink-to-win duel game with USDM escrow on MegaETH.
 *         Players blink in front of their camera for 30 seconds.
 *         Every blink is detected on-chain. The highest score wins the pot.
 *         Scores are attested by a trusted server via ECDSA signature.
 *
 * Flow:
 *   1. Creator approves USDM → plays game → server signs score
 *   2. Creator calls createDuel(score, amount, signature)
 *   3. Challenger approves USDM → joins via joinDuel(duelId) — deposits stake
 *   4. Challenger plays the game → server signs score
 *   5. Challenger calls submitScore(duelId, score, signature) — auto-settles winner
 *   6. If challenger abandons, either player calls claimAbandoned(duelId) after timeout
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract WinkyDuel {
    // ─── Types ──────────────────────────────────────────────────────
    enum Status {
        Open,       // 0 — waiting for challenger
        Settled,    // 1 — game finished
        Cancelled,  // 2 — creator cancelled
        Locked      // 3 — challenger joined, game in progress
    }

    struct Duel {
        address creator;
        address challenger;
        uint96 stake;          // in USDM smallest unit (18 decimals)
        uint32 creatorScore;
        uint32 challengerScore;
        Status status;
        uint40 joinedAt;       // timestamp when challenger joined (for abandon timeout)
    }

    // ─── State ──────────────────────────────────────────────────────
    IERC20 public immutable token; // USDM token
    address public trustedSigner;  // Server address that signs scores
    uint256 public nextDuelId;
    uint256 public rakeBalance;
    address public owner;

    mapping(address => uint256) public nonces; // Anti-replay nonce per player

    uint256 public constant RAKE_BPS = 250;          // 2.5% (250 basis points)
    uint256 public constant MIN_STAKE = 1e18;         // 1 USDM minimum
    uint256 public constant ABANDON_TIMEOUT = 900;    // 15 minutes

    mapping(uint256 => Duel) public duels;

    // Track open duel IDs for getOpenDuels()
    uint256[] private _openIds;
    mapping(uint256 => uint256) private _openIndex; // duelId → index in _openIds

    // ─── Events ─────────────────────────────────────────────────────
    event DuelCreated(
        uint256 indexed duelId,
        address indexed creator,
        uint96 stake,
        uint32 score
    );
    event DuelJoined(
        uint256 indexed duelId,
        address indexed challenger
    );
    event DuelSettled(
        uint256 indexed duelId,
        address indexed winner,
        uint256 payout
    );
    event DuelCancelled(uint256 indexed duelId);
    event DuelAbandoned(uint256 indexed duelId);
    event BlinkRecorded(uint256 indexed duelId, address indexed player);
    event RakeWithdrawn(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TrustedSignerUpdated(address indexed previousSigner, address indexed newSigner);

    // ─── Errors ─────────────────────────────────────────────────────
    error InsufficientStake();
    error StakeTooLarge();
    error DuelNotFound();
    error DuelNotOpen();
    error DuelNotLocked();
    error StakeMismatch();
    error NotCreator();
    error NotChallenger();
    error NotParticipant();
    error CannotChallengeSelf();
    error NotOwner();
    error NoRake();
    error TransferFailed();
    error InvalidToken();
    error InvalidSigner();
    error InvalidSignature();
    error InvalidOwner();
    error TooEarly();

    // ─── Modifiers ──────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────
    constructor(address _token, address _signer) {
        if (_token == address(0)) revert InvalidToken();
        if (_signer == address(0)) revert InvalidSigner();
        token = IERC20(_token);
        trustedSigner = _signer;
        owner = msg.sender;
    }

    // ─── Core Functions ─────────────────────────────────────────────

    /**
     * @notice Create a new duel by depositing USDM as stake.
     *         Caller must have approved this contract to spend `amount` USDM.
     *         Score must be signed by the trusted server (includes chainId).
     * @param score The creator's blink score (attested by server).
     * @param amount The USDM amount to stake (e.g. 5e18 for $5).
     * @param signature Server ECDSA signature over (player, score, nonce, contract, chainId).
     * @return duelId The ID of the newly created duel.
     */
    function createDuel(uint32 score, uint256 amount, bytes calldata signature) external returns (uint256 duelId) {
        // ── Checks ──
        if (amount < MIN_STAKE) revert InsufficientStake();
        if (amount > type(uint96).max) revert StakeTooLarge();

        uint256 nonce = nonces[msg.sender]++;
        if (!_verifySignature(msg.sender, score, nonce, signature)) revert InvalidSignature();

        // ── Effects ──
        duelId = nextDuelId++;

        duels[duelId] = Duel({
            creator: msg.sender,
            challenger: address(0),
            stake: uint96(amount),
            creatorScore: score,
            challengerScore: 0,
            status: Status.Open,
            joinedAt: 0
        });

        _openIndex[duelId] = _openIds.length;
        _openIds.push(duelId);

        // ── Interactions ──
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        emit DuelCreated(duelId, msg.sender, uint96(amount), score);
    }

    /**
     * @notice Join an open duel by depositing USDM (same stake as creator).
     *         This locks the duel — the challenger must then play and call submitScore().
     * @param duelId The ID of the duel to join.
     */
    function joinDuel(uint256 duelId) external {
        Duel storage d = duels[duelId];

        // ── Checks ──
        if (d.creator == address(0)) revert DuelNotFound();
        if (d.status != Status.Open) revert DuelNotOpen();
        if (msg.sender == d.creator) revert CannotChallengeSelf();

        // ── Effects ──
        d.challenger = msg.sender;
        d.status = Status.Locked;
        d.joinedAt = uint40(block.timestamp);
        _removeOpen(duelId);

        // ── Interactions ──
        bool ok = token.transferFrom(msg.sender, address(this), d.stake);
        if (!ok) revert TransferFailed();

        emit DuelJoined(duelId, msg.sender);
    }

    /**
     * @notice Submit the challenger's score and settle the duel.
     *         Only the locked-in challenger can call this.
     *         Score must be signed by the trusted server (includes chainId).
     * @param duelId The ID of the locked duel.
     * @param score The challenger's blink score (attested by server).
     * @param signature Server ECDSA signature over (player, score, nonce, contract, chainId).
     */
    function submitScore(uint256 duelId, uint32 score, bytes calldata signature) external {
        Duel storage d = duels[duelId];

        if (d.status != Status.Locked) revert DuelNotLocked();
        if (msg.sender != d.challenger) revert NotChallenger();

        // Verify server attestation
        uint256 nonce = nonces[msg.sender]++;
        if (!_verifySignature(msg.sender, score, nonce, signature)) revert InvalidSignature();

        d.challengerScore = score;
        d.status = Status.Settled;

        // ── Settlement logic ──
        uint256 totalPot = uint256(d.stake) * 2;

        if (d.creatorScore == score) {
            // Draw → both get their stake back, no rake
            _safeTransfer(d.creator, d.stake);
            _safeTransfer(d.challenger, d.stake);
            emit DuelSettled(duelId, address(0), d.stake);
        } else {
            // Winner takes pool minus rake
            uint256 rake = (totalPot * RAKE_BPS) / 10_000;
            uint256 payout = totalPot - rake;
            rakeBalance += rake;

            address winner = d.creatorScore > score ? d.creator : d.challenger;
            _safeTransfer(winner, payout);
            emit DuelSettled(duelId, winner, payout);
        }
    }

    /**
     * @notice Refund a duel where the challenger didn't submit their score.
     *         Only creator or challenger can call this, after ABANDON_TIMEOUT (15 min).
     *         Both players get their own stake back — no rake, no winner.
     * @param duelId The ID of the abandoned duel.
     */
    function claimAbandoned(uint256 duelId) external {
        Duel storage d = duels[duelId];

        if (d.status != Status.Locked) revert DuelNotLocked();
        if (msg.sender != d.creator && msg.sender != d.challenger) revert NotParticipant();
        if (block.timestamp < d.joinedAt + ABANDON_TIMEOUT) revert TooEarly();

        d.status = Status.Cancelled;

        // Refund each player their own stake
        _safeTransfer(d.creator, d.stake);
        _safeTransfer(d.challenger, d.stake);

        emit DuelAbandoned(duelId);
    }

    /**
     * @notice Cancel an open duel (creator only). Refunds the USDM stake.
     * @param duelId The ID of the duel to cancel.
     */
    function cancelDuel(uint256 duelId) external {
        Duel storage d = duels[duelId];

        if (d.status != Status.Open) revert DuelNotOpen();
        if (msg.sender != d.creator) revert NotCreator();

        d.status = Status.Cancelled;
        _removeOpen(duelId);

        _safeTransfer(d.creator, d.stake);
        emit DuelCancelled(duelId);
    }

    /**
     * @notice Record a blink during gameplay (event-only, no storage write).
     *         Used for the live feed.
     * @param duelId The duel the blink belongs to.
     */
    function recordBlink(uint256 duelId) external {
        emit BlinkRecorded(duelId, msg.sender);
    }

    // ─── View Functions ─────────────────────────────────────────────

    /**
     * @notice Get all currently open duel IDs.
     * @return Array of open duel IDs.
     */
    function getOpenDuels() external view returns (uint256[] memory) {
        return _openIds;
    }

    /**
     * @notice Get the number of currently open duels.
     */
    function openDuelCount() external view returns (uint256) {
        return _openIds.length;
    }

    /**
     * @notice Get full duel details.
     * @param duelId The duel ID.
     * @return The Duel struct.
     */
    function getDuel(uint256 duelId) external view returns (Duel memory) {
        return duels[duelId];
    }

    // ─── Owner Functions ────────────────────────────────────────────

    /**
     * @notice Withdraw accumulated USDM rake to the owner address.
     */
    function withdrawRake() external onlyOwner {
        uint256 amount = rakeBalance;
        if (amount == 0) revert NoRake();
        rakeBalance = 0;
        _safeTransfer(owner, amount);
        emit RakeWithdrawn(owner, amount);
    }

    /**
     * @notice Transfer ownership to a new address.
     * @param newOwner The new owner address (must not be zero).
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        address previous = owner;
        owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }

    /**
     * @notice Update the trusted signer address (for key rotation).
     * @param _signer The new signer address.
     */
    function setTrustedSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert InvalidSigner();
        address previous = trustedSigner;
        trustedSigner = _signer;
        emit TrustedSignerUpdated(previous, _signer);
    }

    // ─── Internal ───────────────────────────────────────────────────

    /**
     * @dev Remove a duel from the open duels array (swap-and-pop).
     */
    function _removeOpen(uint256 duelId) private {
        uint256 idx = _openIndex[duelId];
        uint256 lastIdx = _openIds.length - 1;

        if (idx != lastIdx) {
            uint256 lastId = _openIds[lastIdx];
            _openIds[idx] = lastId;
            _openIndex[lastId] = idx;
        }

        _openIds.pop();
        delete _openIndex[duelId];
    }

    /**
     * @dev Safe USDM transfer with revert on failure.
     */
    function _safeTransfer(address to, uint256 amount) private {
        bool ok = token.transfer(to, amount);
        if (!ok) revert TransferFailed();
    }

    /**
     * @dev Verify that a score was signed by the trustedSigner.
     *      Message: keccak256(player, score, nonce, contractAddress, chainId)
     *      ChainId prevents cross-chain signature replay.
     */
    function _verifySignature(
        address player,
        uint32 score,
        uint256 nonce,
        bytes calldata signature
    ) private view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(player, score, nonce, address(this), block.chainid)
        );
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (bytes32 r, bytes32 s, uint8 v) = _splitSig(signature);
        return ecrecover(ethSignedHash, v, r, s) == trustedSigner;
    }

    /**
     * @dev Split a 65-byte signature into r, s, v components.
     */
    function _splitSig(bytes calldata sig) private pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid sig length");
        r = bytes32(sig[0:32]);
        s = bytes32(sig[32:64]);
        v = uint8(sig[64]);
    }
}
