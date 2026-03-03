// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title WinkyDuel
 * @notice Blink-to-win duel game with USDM escrow on MegaETH.
 *         Players blink in front of their camera for 30 seconds.
 *         Every blink is detected on-chain. The highest score wins the pot.
 *
 * Flow:
 *   1. Player approves USDM spending → creates duel with createDuel(score, amount)
 *   2. Challenger approves USDM → challenges via challengeDuel(duelId, score)
 *   3. challengeDuel auto-settles: winner gets 95%, 5% rake to contract
 *   4. recordBlink() emits events for the live feed (no storage writes)
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract WinkyDuel {
    // ─── Types ──────────────────────────────────────────────────────
    enum Status {
        Open,
        Settled,
        Cancelled
    }

    struct Duel {
        address creator;
        address challenger;
        uint96 stake; // in USDM smallest unit (18 decimals)
        uint32 creatorScore;
        uint32 challengerScore;
        Status status;
    }

    // ─── State ──────────────────────────────────────────────────────
    IERC20 public immutable token; // USDM token
    uint256 public nextDuelId;
    uint256 public rakeBalance;
    address public owner;

    uint256 public constant RAKE_BPS = 500; // 5% (500 basis points)
    uint256 public constant MIN_STAKE = 1e18; // 1 USDM minimum

    mapping(uint256 => Duel) public duels;

    // Track open duel IDs for getOpenDuels()
    uint256[] private _openIds;
    mapping(uint256 => uint256) private _openIndex; // duelId → index in _openIds

    // ─── Events (compact for MegaETH gas model) ────────────────────
    event DuelCreated(
        uint256 indexed duelId,
        address indexed creator,
        uint96 stake,
        uint32 score
    );
    event DuelSettled(
        uint256 indexed duelId,
        address indexed winner,
        uint256 payout
    );
    event DuelCancelled(uint256 indexed duelId);
    event BlinkRecorded(uint256 indexed duelId, address indexed player);
    event RakeWithdrawn(address indexed to, uint256 amount);

    // ─── Errors ─────────────────────────────────────────────────────
    error InsufficientStake();
    error DuelNotFound();
    error DuelNotOpen();
    error StakeMismatch();
    error NotCreator();
    error CannotChallengeSelf();
    error NotOwner();
    error NoRake();
    error TransferFailed();
    error InvalidToken();

    // ─── Modifiers ──────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────
    constructor(address _token) {
        if (_token == address(0)) revert InvalidToken();
        token = IERC20(_token);
        owner = msg.sender;
    }

    // ─── Core Functions ─────────────────────────────────────────────

    /**
     * @notice Create a new duel by depositing USDM as stake.
     *         Caller must have approved this contract to spend `amount` USDM.
     * @param score The creator's blink score (played before calling).
     * @param amount The USDM amount to stake (e.g. 5e18 for $5).
     * @return duelId The ID of the newly created duel.
     */
    function createDuel(uint32 score, uint256 amount) external returns (uint256 duelId) {
        if (amount < MIN_STAKE) revert InsufficientStake();

        // Pull USDM from caller
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        duelId = nextDuelId++;

        duels[duelId] = Duel({
            creator: msg.sender,
            challenger: address(0),
            stake: uint96(amount),
            creatorScore: score,
            challengerScore: 0,
            status: Status.Open
        });

        // Track in open duels array
        _openIndex[duelId] = _openIds.length;
        _openIds.push(duelId);

        emit DuelCreated(duelId, msg.sender, uint96(amount), score);
    }

    /**
     * @notice Challenge an open duel. Must approve the exact same stake in USDM.
     *         Auto-settles: compares scores and transfers winnings.
     * @param duelId The ID of the duel to challenge.
     * @param score The challenger's blink score.
     */
    function challengeDuel(uint256 duelId, uint32 score) external {
        Duel storage d = duels[duelId];

        if (d.creator == address(0)) revert DuelNotFound();
        if (d.status != Status.Open) revert DuelNotOpen();
        if (msg.sender == d.creator) revert CannotChallengeSelf();

        // Pull USDM from challenger (same amount as creator's stake)
        bool ok = token.transferFrom(msg.sender, address(this), d.stake);
        if (!ok) revert TransferFailed();

        d.challenger = msg.sender;
        d.challengerScore = score;
        d.status = Status.Settled;

        // Remove from open duels
        _removeOpen(duelId);

        // ── Settlement logic ──
        uint256 totalPot = uint256(d.stake) * 2;

        if (d.creatorScore == score) {
            // Draw → both get their stake back, no rake
            _safeTransfer(d.creator, d.stake);
            _safeTransfer(msg.sender, d.stake);
            emit DuelSettled(duelId, address(0), d.stake);
        } else {
            // Winner takes 95%, 5% rake
            uint256 rake = (totalPot * RAKE_BPS) / 10_000;
            uint256 payout = totalPot - rake;
            rakeBalance += rake;

            address winner = d.creatorScore > score ? d.creator : msg.sender;
            _safeTransfer(winner, payout);
            emit DuelSettled(duelId, winner, payout);
        }
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
     *         Used for the live feed in Phase 5.
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
     * @param newOwner The new owner address.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
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
}
