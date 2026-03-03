import { expect } from "chai";
import { ethers } from "hardhat";
import { WinkyDuel, MockUSDM } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WinkyDuel", function () {
  let duel: WinkyDuel;
  let usdm: MockUSDM;
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const STAKE = ethers.parseEther("5"); // 5 USDM
  const SMALL_STAKE = ethers.parseEther("1"); // 1 USDM (MIN_STAKE)
  const MINT_AMOUNT = ethers.parseEther("1000"); // 1000 USDM each
  const RAKE_BPS = 500n; // 5%

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy MockUSDM
    const usdmFactory = await ethers.getContractFactory("MockUSDM");
    usdm = await usdmFactory.deploy();
    await usdm.waitForDeployment();

    // Deploy WinkyDuel with USDM address
    const duelFactory = await ethers.getContractFactory("WinkyDuel");
    duel = await duelFactory.deploy(await usdm.getAddress());
    await duel.waitForDeployment();

    // Mint USDM to alice and bob
    await usdm.mint(alice.address, MINT_AMOUNT);
    await usdm.mint(bob.address, MINT_AMOUNT);

    // Approve WinkyDuel to spend USDM
    const duelAddr = await duel.getAddress();
    await usdm.connect(alice).approve(duelAddr, ethers.MaxUint256);
    await usdm.connect(bob).approve(duelAddr, ethers.MaxUint256);
  });

  // ─── Deployment ─────────────────────────────────────────────────
  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      expect(await duel.owner()).to.equal(owner.address);
    });

    it("sets the correct token address", async function () {
      expect(await duel.token()).to.equal(await usdm.getAddress());
    });

    it("starts with duel count at 0", async function () {
      expect(await duel.nextDuelId()).to.equal(0);
    });

    it("starts with no open duels", async function () {
      const open = await duel.getOpenDuels();
      expect(open.length).to.equal(0);
    });

    it("starts with zero rake balance", async function () {
      expect(await duel.rakeBalance()).to.equal(0);
    });

    it("reverts if deployed with zero address token", async function () {
      const factory = await ethers.getContractFactory("WinkyDuel");
      await expect(factory.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(duel, "InvalidToken");
    });
  });

  // ─── Create Duel ────────────────────────────────────────────────
  describe("createDuel", function () {
    it("creates a duel with correct stake and score", async function () {
      await duel.connect(alice).createDuel(42, STAKE);

      const d = await duel.getDuel(0);
      expect(d.creator).to.equal(alice.address);
      expect(d.challenger).to.equal(ethers.ZeroAddress);
      expect(d.stake).to.equal(STAKE);
      expect(d.creatorScore).to.equal(42);
      expect(d.challengerScore).to.equal(0);
      expect(d.status).to.equal(0); // Open
    });

    it("transfers USDM from creator to contract", async function () {
      const before = await usdm.balanceOf(alice.address);
      await duel.connect(alice).createDuel(42, STAKE);
      const after = await usdm.balanceOf(alice.address);

      expect(before - after).to.equal(STAKE);
      expect(await usdm.balanceOf(await duel.getAddress())).to.equal(STAKE);
    });

    it("emits DuelCreated event", async function () {
      await expect(duel.connect(alice).createDuel(42, STAKE))
        .to.emit(duel, "DuelCreated")
        .withArgs(0, alice.address, STAKE, 42);
    });

    it("increments nextDuelId", async function () {
      await duel.connect(alice).createDuel(10, STAKE);
      await duel.connect(bob).createDuel(20, STAKE);
      expect(await duel.nextDuelId()).to.equal(2);
    });

    it("adds to open duels list", async function () {
      await duel.connect(alice).createDuel(10, STAKE);
      await duel.connect(bob).createDuel(20, STAKE);

      const open = await duel.getOpenDuels();
      expect(open.length).to.equal(2);
      expect(open[0]).to.equal(0);
      expect(open[1]).to.equal(1);
    });

    it("accepts minimum stake (1 USDM)", async function () {
      await expect(duel.connect(alice).createDuel(1, SMALL_STAKE))
        .to.not.be.reverted;
    });

    it("reverts with zero stake", async function () {
      await expect(
        duel.connect(alice).createDuel(10, 0)
      ).to.be.revertedWithCustomError(duel, "InsufficientStake");
    });

    it("reverts with stake below minimum", async function () {
      await expect(
        duel.connect(alice).createDuel(10, ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(duel, "InsufficientStake");
    });

    it("reverts if caller has insufficient USDM balance", async function () {
      // Charlie has no USDM
      const [, , , charlie] = await ethers.getSigners();
      const duelAddr = await duel.getAddress();
      await usdm.connect(charlie).approve(duelAddr, ethers.MaxUint256);

      await expect(
        duel.connect(charlie).createDuel(10, STAKE)
      ).to.be.reverted; // ERC20: insufficient balance
    });
  });

  // ─── Challenge Duel (Winner) ────────────────────────────────────
  describe("challengeDuel — challenger wins", function () {
    beforeEach(async function () {
      // Alice creates with score 20
      await duel.connect(alice).createDuel(20, STAKE);
    });

    it("settles with challenger as winner when score is higher", async function () {
      const bobBefore = await usdm.balanceOf(bob.address);

      await duel.connect(bob).challengeDuel(0, 30);

      const bobAfter = await usdm.balanceOf(bob.address);
      const totalPot = STAKE * 2n;
      const rake = (totalPot * RAKE_BPS) / 10_000n;
      const payout = totalPot - rake;

      // Bob deposited STAKE, received payout → net gain = payout - STAKE
      expect(bobAfter - bobBefore).to.equal(payout - STAKE);
    });

    it("emits DuelSettled with winner = bob", async function () {
      const totalPot = STAKE * 2n;
      const rake = (totalPot * RAKE_BPS) / 10_000n;
      const payout = totalPot - rake;

      await expect(duel.connect(bob).challengeDuel(0, 30))
        .to.emit(duel, "DuelSettled")
        .withArgs(0, bob.address, payout);
    });

    it("marks duel as Settled", async function () {
      await duel.connect(bob).challengeDuel(0, 30);
      const d = await duel.getDuel(0);
      expect(d.status).to.equal(1); // Settled
      expect(d.challenger).to.equal(bob.address);
      expect(d.challengerScore).to.equal(30);
    });

    it("removes from open duels list", async function () {
      await duel.connect(bob).challengeDuel(0, 30);
      const open = await duel.getOpenDuels();
      expect(open.length).to.equal(0);
    });

    it("accumulates 5% rake in contract", async function () {
      await duel.connect(bob).challengeDuel(0, 30);
      const totalPot = STAKE * 2n;
      const expectedRake = (totalPot * RAKE_BPS) / 10_000n;
      expect(await duel.rakeBalance()).to.equal(expectedRake);
    });
  });

  // ─── Challenge Duel (Creator Wins) ──────────────────────────────
  describe("challengeDuel — creator wins", function () {
    beforeEach(async function () {
      // Alice creates with score 30
      await duel.connect(alice).createDuel(30, STAKE);
    });

    it("settles with creator as winner when creator score is higher", async function () {
      // aliceBefore is measured AFTER createDuel (USDM already deposited)
      const aliceBefore = await usdm.balanceOf(alice.address);

      await duel.connect(bob).challengeDuel(0, 20);

      const aliceAfter = await usdm.balanceOf(alice.address);
      const totalPot = STAKE * 2n;
      const rake = (totalPot * RAKE_BPS) / 10_000n;
      const payout = totalPot - rake;

      // Alice receives full payout (her stake was already deducted at createDuel)
      expect(aliceAfter - aliceBefore).to.equal(payout);
    });

    it("emits DuelSettled with winner = alice", async function () {
      const totalPot = STAKE * 2n;
      const rake = (totalPot * RAKE_BPS) / 10_000n;
      const payout = totalPot - rake;

      await expect(duel.connect(bob).challengeDuel(0, 20))
        .to.emit(duel, "DuelSettled")
        .withArgs(0, alice.address, payout);
    });
  });

  // ─── Challenge Duel (Draw) ──────────────────────────────────────
  describe("challengeDuel — draw", function () {
    beforeEach(async function () {
      await duel.connect(alice).createDuel(25, STAKE);
    });

    it("refunds both players on tie (no rake)", async function () {
      const aliceBefore = await usdm.balanceOf(alice.address);
      const bobBefore = await usdm.balanceOf(bob.address);

      await duel.connect(bob).challengeDuel(0, 25);

      const aliceAfter = await usdm.balanceOf(alice.address);
      const bobAfter = await usdm.balanceOf(bob.address);

      // Alice gets stake back (net 0 change vs after createDuel)
      expect(aliceAfter - aliceBefore).to.equal(STAKE);
      // Bob gets stake back (net 0 change)
      expect(bobAfter).to.equal(bobBefore);
    });

    it("emits DuelSettled with winner = address(0) on tie", async function () {
      await expect(duel.connect(bob).challengeDuel(0, 25))
        .to.emit(duel, "DuelSettled")
        .withArgs(0, ethers.ZeroAddress, STAKE);
    });

    it("does not accumulate rake on tie", async function () {
      await duel.connect(bob).challengeDuel(0, 25);
      expect(await duel.rakeBalance()).to.equal(0);
    });
  });

  // ─── Challenge Duel (Edge Cases) ────────────────────────────────
  describe("challengeDuel — edge cases", function () {
    beforeEach(async function () {
      await duel.connect(alice).createDuel(20, STAKE);
    });

    it("reverts if duel does not exist", async function () {
      await expect(
        duel.connect(bob).challengeDuel(999, 30)
      ).to.be.revertedWithCustomError(duel, "DuelNotFound");
    });

    it("reverts if challenger is the creator", async function () {
      await expect(
        duel.connect(alice).challengeDuel(0, 30)
      ).to.be.revertedWithCustomError(duel, "CannotChallengeSelf");
    });

    it("reverts if duel already settled", async function () {
      await duel.connect(bob).challengeDuel(0, 30);
      await expect(
        duel.connect(bob).challengeDuel(0, 30)
      ).to.be.revertedWithCustomError(duel, "DuelNotOpen");
    });

    it("reverts if challenger has insufficient USDM", async function () {
      const [, , , charlie] = await ethers.getSigners();
      const duelAddr = await duel.getAddress();
      await usdm.connect(charlie).approve(duelAddr, ethers.MaxUint256);
      // Charlie has no USDM
      await expect(
        duel.connect(charlie).challengeDuel(0, 30)
      ).to.be.reverted;
    });
  });

  // ─── Cancel Duel ────────────────────────────────────────────────
  describe("cancelDuel", function () {
    beforeEach(async function () {
      await duel.connect(alice).createDuel(20, STAKE);
    });

    it("refunds USDM to creator and marks as Cancelled", async function () {
      const aliceBefore = await usdm.balanceOf(alice.address);
      await duel.connect(alice).cancelDuel(0);
      const aliceAfter = await usdm.balanceOf(alice.address);

      expect(aliceAfter - aliceBefore).to.equal(STAKE);

      const d = await duel.getDuel(0);
      expect(d.status).to.equal(2); // Cancelled
    });

    it("emits DuelCancelled event", async function () {
      await expect(duel.connect(alice).cancelDuel(0))
        .to.emit(duel, "DuelCancelled")
        .withArgs(0);
    });

    it("removes from open duels list", async function () {
      await duel.connect(alice).cancelDuel(0);
      const open = await duel.getOpenDuels();
      expect(open.length).to.equal(0);
    });

    it("reverts if called by non-creator", async function () {
      await expect(
        duel.connect(bob).cancelDuel(0)
      ).to.be.revertedWithCustomError(duel, "NotCreator");
    });

    it("reverts if duel already settled", async function () {
      await duel.connect(bob).challengeDuel(0, 30);
      await expect(
        duel.connect(alice).cancelDuel(0)
      ).to.be.revertedWithCustomError(duel, "DuelNotOpen");
    });
  });

  // ─── Record Blink ───────────────────────────────────────────────
  describe("recordBlink", function () {
    it("emits BlinkRecorded event", async function () {
      await duel.connect(alice).createDuel(0, STAKE);

      await expect(duel.connect(alice).recordBlink(0))
        .to.emit(duel, "BlinkRecorded")
        .withArgs(0, alice.address);
    });

    it("can be called by anyone (no access control)", async function () {
      await duel.connect(alice).createDuel(0, STAKE);
      await expect(duel.connect(bob).recordBlink(0)).to.not.be.reverted;
    });
  });

  // ─── Open Duels Tracking ───────────────────────────────────────
  describe("getOpenDuels — swap-and-pop correctness", function () {
    it("handles multiple creates and removes correctly", async function () {
      // Create 3 duels: IDs 0, 1, 2
      await duel.connect(alice).createDuel(10, STAKE);
      await duel.connect(alice).createDuel(20, STAKE);
      await duel.connect(alice).createDuel(30, STAKE);

      let open = await duel.getOpenDuels();
      expect(open.length).to.equal(3);

      // Settle duel 0 (swap-and-pop removes from middle)
      await duel.connect(bob).challengeDuel(0, 40);

      open = await duel.getOpenDuels();
      expect(open.length).to.equal(2);
      expect(open).to.include(1n);
      expect(open).to.include(2n);

      // Cancel duel 1
      await duel.connect(alice).cancelDuel(1);
      open = await duel.getOpenDuels();
      expect(open.length).to.equal(1);
      expect(open[0]).to.equal(2);
    });

    it("returns correct openDuelCount", async function () {
      await duel.connect(alice).createDuel(10, STAKE);
      await duel.connect(alice).createDuel(20, STAKE);
      expect(await duel.openDuelCount()).to.equal(2);

      await duel.connect(bob).challengeDuel(0, 40);
      expect(await duel.openDuelCount()).to.equal(1);
    });
  });

  // ─── Withdraw Rake ─────────────────────────────────────────────
  describe("withdrawRake", function () {
    beforeEach(async function () {
      // Create and settle a duel to generate rake
      await duel.connect(alice).createDuel(20, STAKE);
      await duel.connect(bob).challengeDuel(0, 30);
    });

    it("transfers USDM rake to owner", async function () {
      const expectedRake = (STAKE * 2n * RAKE_BPS) / 10_000n;
      const ownerBefore = await usdm.balanceOf(owner.address);

      await duel.connect(owner).withdrawRake();

      const ownerAfter = await usdm.balanceOf(owner.address);
      expect(ownerAfter - ownerBefore).to.equal(expectedRake);
    });

    it("resets rake balance to zero", async function () {
      await duel.connect(owner).withdrawRake();
      expect(await duel.rakeBalance()).to.equal(0);
    });

    it("emits RakeWithdrawn event", async function () {
      const expectedRake = (STAKE * 2n * RAKE_BPS) / 10_000n;
      await expect(duel.connect(owner).withdrawRake())
        .to.emit(duel, "RakeWithdrawn")
        .withArgs(owner.address, expectedRake);
    });

    it("reverts if called by non-owner", async function () {
      await expect(
        duel.connect(alice).withdrawRake()
      ).to.be.revertedWithCustomError(duel, "NotOwner");
    });

    it("reverts if rake is zero", async function () {
      await duel.connect(owner).withdrawRake(); // drain it
      await expect(
        duel.connect(owner).withdrawRake()
      ).to.be.revertedWithCustomError(duel, "NoRake");
    });
  });

  // ─── Ownership ─────────────────────────────────────────────────
  describe("transferOwnership", function () {
    it("transfers ownership", async function () {
      await duel.connect(owner).transferOwnership(alice.address);
      expect(await duel.owner()).to.equal(alice.address);
    });

    it("reverts if called by non-owner", async function () {
      await expect(
        duel.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWithCustomError(duel, "NotOwner");
    });
  });

  // ─── USDM Balance Consistency ──────────────────────────────────
  describe("USDM balance consistency", function () {
    it("contract holds exact amount after multiple duels", async function () {
      // Create 2 duels
      await duel.connect(alice).createDuel(10, STAKE);
      await duel.connect(alice).createDuel(20, STAKE);

      const contractAddr = await duel.getAddress();
      expect(await usdm.balanceOf(contractAddr)).to.equal(STAKE * 2n);

      // Settle duel 0 → pot dispersed, rake kept
      await duel.connect(bob).challengeDuel(0, 30);
      const rake = (STAKE * 2n * RAKE_BPS) / 10_000n;

      // Contract should hold: duel 1 stake + rake from duel 0
      expect(await usdm.balanceOf(contractAddr)).to.equal(STAKE + rake);
    });
  });
});
