"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { parseUnits, formatUnits, parseEventLogs } from "viem";
import type { RefObject } from "react";
import { DURATION } from "@/lib/constants";
import { addPrivateDuel } from "@/lib/privateDuels";
import { publicClient } from "@/hooks/useWallet";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI, MOCK_USDM_ADDRESS, ERC20_ABI } from "@/lib/constants";
import { DuelStatus } from "@/lib/types";
import type { GamePhase, Duel, ChartPoint, GameResult } from "@/lib/types";
import { playCountdown, playGo, playOvertake, playWin, playLose, startMusic, stopMusic } from "@/hooks/useSounds";

interface ContractActions {
  createDuel: (score: number, stakeUsdm: number) => Promise<`0x${string}`>;
  joinDuel: (duelId: bigint, stakeRaw: bigint) => Promise<`0x${string}`>;
  submitScore: (duelId: bigint, score: number) => Promise<`0x${string}`>;
  checkAllowance: () => Promise<bigint>;
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
  isPrivateRef: RefObject<boolean>;
}

export interface ErrorBanner {
  message: string;
  type: "error" | "warning";
}

/** Check if a duel is still open on-chain. */
async function isDuelStillOpen(duelId: bigint): Promise<boolean> {
  try {
    const duel = await publicClient.readContract({
      address: WINKY_DUEL_ADDRESS,
      abi: WINKY_DUEL_ABI,
      functionName: "getDuel",
      args: [duelId],
    }) as { status: number };
    return duel.status === DuelStatus.Open;
  } catch {
    return true;
  }
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
  isPrivateRef,
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
  const [errorBanner, setErrorBanner] = useState<ErrorBanner | null>(null);

  const cameraConfirmRef = useRef<(() => void) | null>(null);
  const myScoreRef = useRef(0);
  const chartRef = useRef<ChartPoint[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const chartIvRef = useRef<ReturnType<typeof setInterval>>(null);
  const phaseRef = useRef<GamePhase>("idle");
  const timeLeftRef = useRef(DURATION);
  const challengeRef = useRef<Duel | null>(null);
  const stakeRef = useRef(5);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { challengeRef.current = challenge; }, [challenge]);
  useEffect(() => { stakeRef.current = stake; }, [stake]);

  const showError = useCallback((message: string, type: "error" | "warning" = "error") => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorBanner({ message, type });
    errorTimerRef.current = setTimeout(() => setErrorBanner(null), 5000);
  }, []);

  const dismissError = useCallback(() => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorBanner(null);
  }, []);

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

  const lastBlinkTimeRef = useRef(0);

  const doBlink = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    // Anti-cheat: min 200ms between blinks (max 5/sec)
    const now = Date.now();
    if (now - lastBlinkTimeRef.current < 200) return;
    lastBlinkTimeRef.current = now;
    const prevScore = myScoreRef.current;
    myScoreRef.current++;
    setMyScore(myScoreRef.current);
    setMyBlinking(true);
    triggerFlash();
    setTimeout(() => setMyBlinking(false), 150);

    const target = challengeRef.current?.score;
    if (target !== undefined && prevScore <= target && myScoreRef.current > target) {
      setOvertook(true);
      playOvertake();
      setTimeout(() => setOvertook(false), 1200);
    }
  }, [triggerFlash]);

  const finish = useCallback(async () => {
    stopMusic();
    setPhase("submitting");

    // Anti-cheat: cap score at realistic max (~3.3 blinks/sec)
    const MAX_SCORE = Math.ceil(DURATION * 3.5);
    const rawScore = myScoreRef.current;
    const score = Math.min(rawScore, MAX_SCORE);
    if (rawScore > MAX_SCORE) {
      console.warn(`Score capped: ${rawScore} → ${MAX_SCORE}`);
      myScoreRef.current = score;
      setMyScore(score);
    }

    const currentChallenge = challengeRef.current;
    const isChallenge = !!currentChallenge;

    try {
      let hash: `0x${string}`;

      if (isChallenge) {
        // Challenger already deposited via joinDuel — just submit score
        hash = await contractActions.submitScore(currentChallenge!.id, score);
        addTx(hash, "Submit Score");
      } else {
        // Creator: create duel with score + deposit in one TX
        hash = await contractActions.createDuel(score, stakeRef.current);
        addTx(hash, "Create Duel");
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted");
      }

      if (isChallenge) {
        const targetScore = currentChallenge!.score;
        const won = score > targetScore ? true : score < targetScore ? false : null;
        setResult({
          my: score,
          target: targetScore,
          won,
          isChallenge: true,
        });
        if (won === true) playWin();
        else if (won === false) playLose();
      } else {
        // Parse duelId from DuelCreated event for share link
        let createdDuelId: bigint | undefined;
        try {
          const logs = parseEventLogs({
            abi: WINKY_DUEL_ABI,
            logs: receipt.logs,
            eventName: "DuelCreated",
          });
          if (logs.length > 0) {
            createdDuelId = (logs[0].args as { duelId: bigint }).duelId;
          }
        } catch {
          // Non-critical: share link won't be available
        }
        // Mark duel as private on server
        if (createdDuelId != null && isPrivateRef.current) {
          await addPrivateDuel(createdDuelId);
        }
        setResult({
          my: score,
          target: null,
          won: null,
          isChallenge: false,
          duelId: createdDuelId,
        });
      }

      setPhase("result");
      refetchDuels();
      refreshBalance();
    } catch (err: unknown) {
      console.error("Submit failed:", err);
      const raw = err instanceof Error ? err.message : String(err);

      let errorMsg: string;
      if (raw === "DUEL_TAKEN" || raw.includes("DuelNotOpen") || raw.includes("DuelNotLocked")) {
        errorMsg = "This duel is no longer available.";
      } else if (raw.includes("NotChallenger")) {
        errorMsg = "You are not the challenger for this duel.";
      } else if (raw.includes("InsufficientBalance") || raw.includes("transfer amount exceeds balance")) {
        errorMsg = "Insufficient USDM balance.";
      } else if (raw.includes("User rejected") || raw.includes("User denied") || raw.includes("rejected the request")) {
        errorMsg = "Transaction cancelled.";
      } else {
        const match = raw.match(/reason:\s*(.+?)(?:\n|$)/);
        errorMsg = match?.[1] ?? (raw.length > 120 ? raw.slice(0, 120) + "..." : raw);
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
    startMusic();

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
      dismissError();
      setChallenge(duel);
      if (duel) setStake(duel.stake);

      const stakeAmount = duel
        ? duel.stakeRaw
        : parseUnits(String(stakeRef.current), 18);

      // ── Pre-check 1: verify USDM balance ──
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
            showError(`Insufficient USDM balance. You have $${have} but need $${need}.`);
            setPhase("idle");
            return;
          }
        } catch (err) {
          console.warn("Balance check failed, proceeding anyway:", err);
        }
      }

      // ── Pre-check 2: verify duel is still open (for challenges) ──
      if (duel) {
        const stillOpen = await isDuelStillOpen(duel.id);
        if (!stillOpen) {
          showError("This duel is no longer available. It was taken or cancelled.");
          refetchDuels();
          setPhase("idle");
          return;
        }
      }

      // ── Step 1: Approve USDM (only show screen if approval is needed) ──
      try {
        const currentAllowance = await contractActions.checkAllowance();
        const needsApproval = currentAllowance < stakeAmount;

        if (needsApproval) {
          setPhase("approving");
          const hash = await contractActions.ensureAllowance(stakeAmount);
          if (hash) addTx(hash, "Approve USDM");
        }
      } catch (err) {
        console.warn("Approval rejected:", err);
        setPhase("idle");
        return;
      }

      // ── Step 2 (challenger only): joinDuel — deposit USDM BEFORE playing ──
      if (duel) {
        setPhase("approving"); // Show wallet confirmation screen for joinDuel TX
        try {
          const joinHash = await contractActions.joinDuel(duel.id, duel.stakeRaw);
          addTx(joinHash, "Join Duel");
          const receipt = await publicClient.waitForTransactionReceipt({ hash: joinHash });
          if (receipt.status === "reverted") {
            throw new Error("joinDuel reverted");
          }
          // Refresh balance after deposit
          refreshBalance();
        } catch (err) {
          console.warn("Join duel failed:", err);
          const raw = err instanceof Error ? err.message : String(err);
          if (raw.includes("User rejected") || raw.includes("User denied") || raw.includes("rejected the request")) {
            setPhase("idle");
          } else {
            showError("Failed to join duel. It may have been taken or cancelled.");
            refetchDuels();
            setPhase("idle");
          }
          return;
        }
      }

      // ── Step 3: Camera (first time only) ──
      if (!isCameraReady()) {
        setPhase("camera");

        const cameraOk = await initCamera();
        if (!cameraOk) {
          setPhase("idle");
          return;
        }

        await new Promise<void>((resolve) => {
          cameraConfirmRef.current = resolve;
        });
      }

      // ── Step 4: Countdown 3-2-1 ──
      setPhase("countdown");
      let c = 3;
      setCountdownNum(3);
      playCountdown(3);
      const iv = setInterval(() => {
        c--;
        if (c <= 0) {
          clearInterval(iv);
          playGo();
          go();
        } else {
          setCountdownNum(c);
          playCountdown(c);
        }
      }, 1000);
    },
    [initCamera, isCameraReady, go, contractActions, addTx, walletAddress, showError, dismissError, refetchDuels, refreshBalance]
  );

  const confirmCamera = useCallback(() => {
    cameraConfirmRef.current?.();
    cameraConfirmRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (chartIvRef.current) clearInterval(chartIvRef.current);
    stopMusic();
    setPhase("idle");
    setMyScore(0);
    setTimeLeft(DURATION);
    setChartData([]);
    setChallenge(null);
    setResult(null);
    myScoreRef.current = 0;
    chartRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chartIvRef.current) clearInterval(chartIvRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
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
    errorBanner,
    dismissError,
    launch,
    reset,
    doBlink,
    confirmCamera,
  };
}
