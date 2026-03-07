"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { parseUnits, formatUnits } from "viem";
import { DURATION } from "@/lib/constants";
import { publicClient } from "@/hooks/useWallet";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI, MOCK_USDM_ADDRESS, ERC20_ABI } from "@/lib/constants";
import { DuelStatus } from "@/lib/types";
import type { GamePhase, Duel, ChartPoint, GameResult } from "@/lib/types";

interface ContractActions {
  createDuel: (score: number, stakeUsdm: number) => Promise<`0x${string}`>;
  challengeDuel: (duelId: bigint, score: number, stakeRaw: bigint) => Promise<`0x${string}`>;
  ensureAllowance: (amount: bigint) => Promise<`0x${string}` | null>;
}

interface UseGameLoopOptions {
  addTx: (hash: `0x${string}`, label?: string) => number;
  initCamera: () => Promise<boolean>;
  isCameraReady: () => boolean;
  triggerFlash: () => void;
  contractActions: ContractActions;
  refetchDuels: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  walletAddress: `0x${string}` | null;
}

export function useGameLoop({
  addTx,
  initCamera,
  isCameraReady,
  triggerFlash,
  contractActions,
  refetchDuels,
  refreshBalance,
  walletAddress,
}: UseGameLoopOptions) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [stake, setStake] = useState(5);
  const [stakeFilter, setStakeFilter] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [myScore, setMyScore] = useState(0);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [countdownNum, setCountdownNum] = useState(3);
  const [challenge, setChallenge] = useState<Duel | null>(null);
  const [myBlinking, setMyBlinking] = useState(false);
  const [overtook, setOvertook] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);

  // Ref to hold resolve function for camera "Start" button
  const cameraConfirmRef = useRef<(() => void) | null>(null);

  const myScoreRef = useRef(0);
  const chartRef = useRef<ChartPoint[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const chartIvRef = useRef<ReturnType<typeof setInterval>>(null);
  const phaseRef = useRef<GamePhase>("idle");
  const timeLeftRef = useRef(DURATION);
  const challengeRef = useRef<Duel | null>(null);
  const stakeRef = useRef(5);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { challengeRef.current = challenge; }, [challenge]);
  useEffect(() => { stakeRef.current = stake; }, [stake]);

  // Chart data accumulation
  useEffect(() => {
    if (phase !== "playing") {
      if (chartIvRef.current) clearInterval(chartIvRef.current);
      return;
    }
    chartIvRef.current = setInterval(() => {
      const elapsed = DURATION - timeLeftRef.current;
      const pt: ChartPoint = { t: elapsed, you: myScoreRef.current };
      if (challenge) pt.target = challenge.score;
      chartRef.current = [...chartRef.current, pt];
      setChartData([...chartRef.current]);
    }, 400);
    return () => {
      if (chartIvRef.current) clearInterval(chartIvRef.current);
    };
  }, [phase, challenge]);

  const doBlink = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const prevScore = myScoreRef.current;
    myScoreRef.current++;
    setMyScore(myScoreRef.current);
    setMyBlinking(true);
    triggerFlash();
    setTimeout(() => setMyBlinking(false), 150);

    // Detect overtake: score goes from <= target to > target
    const target = challengeRef.current?.score;
    if (target !== undefined && prevScore <= target && myScoreRef.current > target) {
      setOvertook(true);
      setTimeout(() => setOvertook(false), 1200);
    }
  }, [triggerFlash]);

  const finish = useCallback(async () => {
    setPhase("submitting");

    const score = myScoreRef.current;
    const currentChallenge = challengeRef.current;
    const isChallenge = !!currentChallenge;

    try {
      let hash: `0x${string}`;

      if (isChallenge) {
        // Pre-check: verify duel is still open before spending gas
        try {
          const duel = await publicClient.readContract({
            address: WINKY_DUEL_ADDRESS,
            abi: WINKY_DUEL_ABI,
            functionName: "getDuel",
            args: [currentChallenge!.id],
          }) as { status: number };
          if (duel.status !== DuelStatus.Open) {
            throw new Error("DUEL_TAKEN");
          }
        } catch (e) {
          if (e instanceof Error && e.message === "DUEL_TAKEN") throw e;
          // If the read fails, proceed anyway — let the TX decide
        }

        hash = await contractActions.challengeDuel(
          currentChallenge!.id,
          score,
          currentChallenge!.stakeRaw
        );
        addTx(hash, "Challenge Duel");
      } else {
        hash = await contractActions.createDuel(score, stakeRef.current);
        addTx(hash, "Create Duel");
      }

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted");
      }

      // Determine result
      if (isChallenge) {
        const targetScore = currentChallenge!.score;
        setResult({
          my: score,
          target: targetScore,
          won: score > targetScore ? true : score < targetScore ? false : null,
          isChallenge: true,
        });
      } else {
        setResult({
          my: score,
          target: null,
          won: null,
          isChallenge: false,
        });
      }

      setPhase("result");

      // Refresh duels list and balance
      refetchDuels();
      refreshBalance();
    } catch (err: unknown) {
      console.error("Submit failed:", err);
      const raw = err instanceof Error ? err.message : String(err);

      // User-friendly error messages
      let errorMsg: string;
      if (raw === "DUEL_TAKEN" || raw.includes("DuelNotOpen")) {
        errorMsg = "This duel was already taken by another player.";
      } else if (raw.includes("InsufficientBalance") || raw.includes("transfer amount exceeds balance")) {
        errorMsg = "Insufficient USDM balance.";
      } else if (raw.includes("User rejected") || raw.includes("User denied") || raw.includes("rejected the request")) {
        errorMsg = "Transaction cancelled.";
      } else {
        const match = raw.match(/reason:\s*(.+?)(?:\n|$)/);
        errorMsg = match?.[1] ?? (raw.length > 120 ? raw.slice(0, 120) + "…" : raw);
      }

      setResult({
        my: score,
        target: currentChallenge?.score ?? null,
        won: null,
        isChallenge,
        error: errorMsg,
      });
      setPhase("result");
    }
  }, [contractActions, addTx, refetchDuels, refreshBalance]);

  const go = useCallback(() => {
    myScoreRef.current = 0;
    chartRef.current = [
      { t: 0, you: 0, ...(challenge ? { target: challenge.score } : {}) },
    ];
    setMyScore(0);
    setChartData(chartRef.current);
    setTimeLeft(DURATION);
    setPhase("playing");

    let t = DURATION;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      }
    }, 1000);
  }, [challenge, finish]);

  const launch = useCallback(
    async (duel: Duel | null = null) => {
      setChallenge(duel);
      if (duel) setStake(duel.stake);

      const stakeAmount = duel
        ? duel.stakeRaw
        : parseUnits(String(stakeRef.current), 18);

      // ── Pre-check: verify USDM balance before starting ──
      if (walletAddress) {
        try {
          const balance = await publicClient.readContract({
            address: MOCK_USDM_ADDRESS,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [walletAddress],
          });
          if (balance < stakeAmount) {
            const have = parseFloat(formatUnits(balance, 18)).toFixed(2);
            const need = parseFloat(formatUnits(stakeAmount, 18)).toFixed(2);
            alert(`Insufficient USDM balance. You have $${have} but need $${need}.`);
            setPhase("idle");
            return;
          }
        } catch (err) {
          console.warn("Balance check failed, proceeding anyway:", err);
        }
      }

      // ── Step 1: Approve USDM ──
      setPhase("approving");

      try {
        const hash = await contractActions.ensureAllowance(stakeAmount);
        if (hash) addTx(hash, "Approve USDM");
      } catch (err) {
        console.warn("Approval rejected:", err);
        setPhase("idle");
        return;
      }

      // ── Step 2: Camera (first time only — show canvas + Start button) ──
      if (!isCameraReady()) {
        setPhase("camera");

        const cameraOk = await initCamera();
        if (!cameraOk) {
          setPhase("idle");
          return;
        }

        // Camera ready — wait for user to click "Start"
        await new Promise<void>((resolve) => {
          cameraConfirmRef.current = resolve;
        });
      }

      // ── Step 3: Countdown 3-2-1 ──
      setPhase("countdown");
      let c = 3;
      setCountdownNum(3);
      const iv = setInterval(() => {
        c--;
        if (c <= 0) {
          clearInterval(iv);
          go();
        } else {
          setCountdownNum(c);
        }
      }, 1000);
    },
    [initCamera, isCameraReady, go, contractActions, addTx, walletAddress]
  );

  /** Called by the "Start" button on the camera screen */
  const confirmCamera = useCallback(() => {
    cameraConfirmRef.current?.();
    cameraConfirmRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (chartIvRef.current) clearInterval(chartIvRef.current);
    setPhase("idle");
    setMyScore(0);
    setTimeLeft(DURATION);
    setChartData([]);
    setChallenge(null);
    setResult(null);
    myScoreRef.current = 0;
    chartRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chartIvRef.current) clearInterval(chartIvRef.current);
    };
  }, []);

  return {
    phase,
    stake,
    setStake,
    stakeFilter,
    setStakeFilter,
    timeLeft,
    myScore,
    chartData,
    countdownNum,
    challenge,
    myBlinking,
    overtook,
    result,
    launch,
    reset,
    doBlink,
    confirmCamera,
  };
}
