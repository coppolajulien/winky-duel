"use client";

import { useRef, useState, useCallback } from "react";
import { useTxToasts } from "@/hooks/useTxToasts";
import { useBlinkDetector } from "@/hooks/useBlinkDetector";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useWallet, publicClient } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";
import { useDuels } from "@/hooks/useDuels";
import type { Duel } from "@/lib/types";
import { GridBackground } from "./GridBackground";
import { Sidebar } from "./Sidebar";
import { PhaseIdle } from "./PhaseIdle";
import { PhaseCountdown } from "./PhaseCountdown";
import { PhasePlaying } from "./PhasePlaying";
import { PhaseSubmitting } from "./PhaseSubmitting";
import { PhaseResult } from "./PhaseResult";
import { SendModal } from "./SendModal";

export default function GamePage() {
  // Ref-based callback to resolve circular dependency between hooks
  const onBlinkRef = useRef<(() => void) | null>(null);

  const { txToasts, addTx, removeTx, resetToasts } = useTxToasts();
  const { videoRef, canvasRef, initCamera, triggerFlash, cameraStatus, cameraError, isCameraReady } = useBlinkDetector({
    onBlinkRef,
  });

  const wallet = useWallet();
  const contract = useContract();
  const { duels, history, loading: duelsLoading, refetchDuels } = useDuels(wallet.address);
  const [sendModalOpen, setSendModalOpen] = useState(false);

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
    challenge,
    myBlinking,
    overtook,
    result,
    launch,
    reset,
    doBlink,
    confirmCamera,
  } = useGameLoop({
    addTx,
    initCamera,
    isCameraReady,
    triggerFlash,
    contractActions: {
      createDuel: contract.createDuel,
      challengeDuel: contract.challengeDuel,
      ensureAllowance: contract.ensureAllowance,
    },
    refetchDuels,
    refreshBalance: wallet.refreshBalance,
  });

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
        authenticated={wallet.authenticated}
        ready={wallet.ready}
        login={wallet.login}
        logout={wallet.logout}
        shortAddress={wallet.shortAddress}
        address={wallet.address}
        usdmBalance={wallet.usdmBalance}
        balanceLoading={wallet.balanceLoading}
        duels={duels}
        history={history}
        duelsLoading={duelsLoading}
        currentAddress={(wallet.address as `0x${string}`) ?? null}
        onOpenSend={() => setSendModalOpen(true)}
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
                Blinkit uses your webcam to detect blinks. Allow camera access in your browser settings and reload the page.
              </div>
            </div>
          )}
          {phase === "idle" && cameraStatus !== "denied" && <PhaseIdle />}
          {phase === "approving" && (
            <div className="flex flex-1 animate-[fade-in_0.3s_ease] flex-col items-center justify-center gap-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wink-text-dim">
                Step 1/3 — Approve stake
              </div>
              <div className="rounded-2xl border border-wink-border bg-[var(--glass-bg)] px-6 py-3 backdrop-blur-[10px]">
                <span className="font-mono text-[32px] font-extrabold text-wink-pink">
                  ${stake}
                </span>
                <span className="ml-2 text-[13px] text-wink-text-dim">USDM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-wink-pink border-t-transparent" />
                <span className="text-sm text-wink-text-dim">Confirm in your wallet…</span>
              </div>
            </div>
          )}
          {phase === "camera" && (
            <div className="flex flex-1 animate-[fade-in_0.3s_ease] flex-col items-center justify-center gap-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wink-text-dim">
                Step 2/3 — Camera setup
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-wink-border">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={240}
                  className="block"
                  style={{ background: "var(--canvas-mesh-bg)" }}
                />
              </div>
              <div className="flex flex-col items-center gap-3">
                {cameraStatus === "loading" && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-wink-cyan border-t-transparent" />
                      <span className="text-sm text-wink-text-dim">Loading camera…</span>
                    </div>
                    <p className="max-w-xs text-center text-[11px] text-wink-text-dim">
                      We need your camera to detect blinks. Nothing is recorded or shared.
                    </p>
                  </>
                )}
                {cameraStatus === "ready" && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-wink-cyan" />
                      <span className="text-sm font-semibold text-wink-cyan">Face detected</span>
                    </div>
                    <button
                      onClick={confirmCamera}
                      className="rounded-xl bg-gradient-to-br from-wink-pink to-[var(--wink-pink-darker)] px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-wink-pink/20 transition-all hover:scale-105 hover:brightness-110 active:scale-95"
                    >
                      ▶ Duel
                    </button>
                  </>
                )}
                {cameraStatus === "denied" && (
                  <div className="flex flex-col items-center gap-3 max-w-xs text-center">
                    <span className="text-3xl mb-1">🚫</span>
                    <span className="text-sm font-semibold text-red-400">Camera access required</span>
                    <p className="text-[11px] text-wink-text-dim">
                      {cameraError || "Blinkit uses your webcam to detect blinks. Allow camera access in your browser settings and reload the page."}
                    </p>
                    <div className="rounded-lg border border-wink-border bg-card/50 p-2.5 text-[10px] text-wink-text-dim">
                      <p className="font-semibold text-wink-text mb-1">Quick fixes:</p>
                      <ul className="space-y-0.5 text-left">
                        <li>• Click the 🔒 icon in your address bar → allow camera</li>
                        <li>• Close apps using your camera (Zoom, Teams, FaceTime…)</li>
                        <li>• Mac: System Settings → Privacy → Camera → Chrome ✓</li>
                        <li>• Windows: Settings → Privacy → Camera → allow apps</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-lg border border-wink-border bg-card px-4 py-1.5 text-[11px] font-semibold text-wink-text transition-colors hover:border-wink-pink/30"
                    >
                      Reload page
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
              overtook={overtook}
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
              chartData={chartData}
              onReset={handleReset}
            />
          )}
        </div>
      </GridBackground>

      {/* Send USDM Modal */}
      <SendModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        usdmBalance={wallet.usdmBalance}
        transferUSDM={contract.transferUSDM}
        refreshBalance={wallet.refreshBalance}
      />
    </div>
  );
}
