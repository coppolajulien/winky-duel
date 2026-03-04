"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { parseUnits } from "viem";
import { DURATION } from "@/lib/constants";
import { publicClient } from "@/hooks/useWallet";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";
import type { GamePhase, Duel, ChartPoint, GameResult } from "@/lib/types";

interface ContractActions {
  createDuel: (score: number, stakeUsdm: number) => Promise<`0x${string}`>;
  challengeDuel: (duelId: bigint, score: number, stakeRaw: bigint) => Promise<`0x${string}`>;
  ensureAllowance: (amount: bigint) => Promise<`0x${string}` | null>;
}

interface UseGameLoopOptions {
  addTx: (hash: `0x${string}`, label?: string) => number;
  initCamera: () => Promise<boolean>;
  triggerFlash: () => void;
  contractActions: ContractActions;
  refetchDuels: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export type ApprovalStatus = "idle" | "approving" | "approved" | "failed";

export function useGameLoop({
  addTx,
  initCamera,
  triggerFlash,
  contractActions,
  refetchDuels,
  refreshBalance,
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
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("idle");

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
    } catch (err) {
      console.error("Submit failed:", err);
      const errorMsg = err instanceof Error ? err.message : "Transaction failed";
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
      setPhase("countdown");
      setCountdownNum(3);
      setApprovalStatus("approving");

      // Step 1: Camera + USDM approval — wait for BOTH before countdown
      const stakeAmount = duel
        ? duel.stakeRaw
        : parseUnits(String(stakeRef.current), 18);

      let approvalOk = false;
      const [cameraOk] = await Promise.all([
        initCamera(),
        contractActions.ensureAllowance(stakeAmount).then((hash) => {
          if (hash) addTx(hash, "Approve USDM");
          setApprovalStatus("approved");
          approvalOk = true;
        }).catch((err) => {
          console.warn("Approval failed:", err);
          setApprovalStatus("failed");
        }),
      ]);

      if (!cameraOk || !approvalOk) {
        // If approval failed but camera is fine, user rejected in Privy
        if (!approvalOk) setApprovalStatus("failed");
        setPhase("idle");
        setApprovalStatus("idle");
        return;
      }

      // Step 2: Countdown 3-2-1 starts only after approval
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
    [initCamera, go, contractActions, addTx]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (chartIvRef.current) clearInterval(chartIvRef.current);
    setPhase("idle");
    setMyScore(0);
    setTimeLeft(DURATION);
    setChartData([]);
    setChallenge(null);
    setResult(null);
    setApprovalStatus("idle");
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
    approvalStatus,
    launch,
    reset,
    doBlink,
  };
}
