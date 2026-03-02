"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { DURATION } from "@/lib/constants";
import type { GamePhase, Duel, ChartPoint, GameResult } from "@/lib/types";

interface UseGameLoopOptions {
  addTx: () => void;
  initCamera: () => Promise<boolean>;
  triggerFlash: () => void;
}

export function useGameLoop({ addTx, initCamera, triggerFlash }: UseGameLoopOptions) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [stake, setStake] = useState(5);
  const [stakeFilter, setStakeFilter] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [myScore, setMyScore] = useState(0);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [countdownNum, setCountdownNum] = useState(3);
  const [connected, setConnected] = useState(false);
  const [challenge, setChallenge] = useState<Duel | null>(null);
  const [myBlinking, setMyBlinking] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);

  const myScoreRef = useRef(0);
  const chartRef = useRef<ChartPoint[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const chartIvRef = useRef<ReturnType<typeof setInterval>>(null);
  const phaseRef = useRef<GamePhase>("idle");
  const timeLeftRef = useRef(DURATION);

  // Keep refs in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

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
    myScoreRef.current++;
    setMyScore(myScoreRef.current);
    setMyBlinking(true);
    triggerFlash();
    addTx();
    setTimeout(() => setMyBlinking(false), 150);
  }, [addTx, triggerFlash]);

  const finish = useCallback(() => {
    setPhase("submitting");
    setTimeout(() => {
      const s = myScoreRef.current;
      const ts = challenge?.score ?? null;
      setResult({
        my: s,
        target: ts,
        won: ts !== null ? s > ts : null,
        isChallenge: !!challenge,
      });
      setPhase("result");
    }, 1200);
  }, [challenge]);

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

      const cameraOk = await initCamera();
      if (!cameraOk) {
        setPhase("idle");
        return;
      }

      let c = 3;
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
    [initCamera, go]
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
    connected,
    setConnected,
    challenge,
    myBlinking,
    result,
    launch,
    reset,
    doBlink,
  };
}
