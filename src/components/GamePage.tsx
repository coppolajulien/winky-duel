"use client";

import { useRef, useCallback } from "react";
import { useTxToasts } from "@/hooks/useTxToasts";
import { useBlinkDetector } from "@/hooks/useBlinkDetector";
import { useGameLoop } from "@/hooks/useGameLoop";
import { GridBackground } from "./GridBackground";
import { Sidebar } from "./Sidebar";
import { PhaseIdle } from "./PhaseIdle";
import { PhaseCountdown } from "./PhaseCountdown";
import { PhasePlaying } from "./PhasePlaying";
import { PhaseSubmitting } from "./PhaseSubmitting";
import { PhaseResult } from "./PhaseResult";

export default function GamePage() {
  // Ref-based callback to resolve circular dependency between hooks
  const onBlinkRef = useRef<(() => void) | null>(null);

  const { txToasts, addTx, removeTx, resetToasts } = useTxToasts();
  const { videoRef, canvasRef, initCamera, triggerFlash, cameraStatus } = useBlinkDetector({
    onBlinkRef,
  });

  const {
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
  } = useGameLoop({ addTx, initCamera, triggerFlash });

  // Wire the blink ref after both hooks are initialized
  onBlinkRef.current = doBlink;

  // Reset toasts on game reset
  const handleReset = useCallback(() => {
    reset();
    resetToasts();
  }, [reset, resetToasts]);

  return (
    <div className="flex h-screen overflow-hidden font-sans text-foreground">
      {/* Hidden video element for camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      {/* Left sidebar */}
      <Sidebar
        stake={stake}
        setStake={setStake}
        stakeFilter={stakeFilter}
        setStakeFilter={setStakeFilter}
        connected={connected}
        setConnected={setConnected}
        onLaunch={(duel) => {
          resetToasts();
          launch(duel);
        }}
      />

      {/* Right: game area */}
      <GridBackground>
        <div className="flex h-full flex-col">
          {phase === "idle" && cameraStatus === "denied" && (
            <div className="flex flex-1 animate-[fade-in_0.5s_ease] flex-col items-center justify-center">
              <div className="mb-3 text-[56px] opacity-40">🚫</div>
              <div className="text-lg font-bold text-wink-pink">
                Camera access required
              </div>
              <div className="mt-1.5 max-w-xs text-center text-xs text-wink-text-dim">
                Winky Duel uses your webcam to detect blinks. Allow camera access in your browser settings and reload the page.
              </div>
            </div>
          )}
          {phase === "idle" && cameraStatus !== "denied" && <PhaseIdle />}
          {phase === "countdown" && (
            <PhaseCountdown
              countdownNum={countdownNum}
              challenge={challenge}
              stake={stake}
            />
          )}
          {phase === "playing" && (
            <PhasePlaying
              myScore={myScore}
              timeLeft={timeLeft}
              challenge={challenge}
              myBlinking={myBlinking}
              chartData={chartData}
              txToasts={txToasts}
              stake={stake}
              canvasRef={canvasRef}
              onRemoveTx={removeTx}
            />
          )}
          {phase === "submitting" && <PhaseSubmitting />}
          {phase === "result" && result && (
            <PhaseResult
              result={result}
              stake={stake}
              onReset={handleReset}
            />
          )}
        </div>
      </GridBackground>
    </div>
  );
}
