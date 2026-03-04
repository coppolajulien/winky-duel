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
  const { videoRef, canvasRef, initCamera, triggerFlash, cameraStatus } = useBlinkDetector({
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
  } = useGameLoop({
    addTx,
    initCamera,
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
