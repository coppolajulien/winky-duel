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
  const { duels, loading: duelsLoading, refetchDuels } = useDuels();
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

  // Cancel duel handler
  const handleCancel = useCallback(
    async (duel: Duel) => {
      try {
        const hash = await contract.cancelDuel(duel.id);
        addTx(hash, "Cancel Duel");
        await publicClient.waitForTransactionReceipt({ hash });
        refetchDuels();
        wallet.refreshBalance();
      } catch (err) {
        console.error("Cancel failed:", err);
      }
    },
    [contract, addTx, refetchDuels, wallet]
  );

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
        duelsLoading={duelsLoading}
        currentAddress={(wallet.address as `0x${string}`) ?? null}
        onCancel={handleCancel}
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
