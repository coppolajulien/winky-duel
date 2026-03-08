"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTxToasts } from "@/hooks/useTxToasts";
import { useBlinkDetector } from "@/hooks/useBlinkDetector";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useWallet, publicClient } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";
import { useDuels } from "@/hooks/useDuels";
import type { Duel } from "@/lib/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Sidebar } from "./Sidebar";
import { MobileGameHeader } from "./MobileGameHeader";
import { PhaseIdle } from "./PhaseIdle";
import { PhaseCountdown } from "./PhaseCountdown";
import { PhasePlaying } from "./PhasePlaying";
import { PhaseSubmitting } from "./PhaseSubmitting";
import { PhaseResult } from "./PhaseResult";
import { SendModal } from "./SendModal";
import { ErrorBanner } from "./ErrorBanner";

export default function GamePage() {
  // Ref-based callback to resolve circular dependency between hooks
  const onBlinkRef = useRef<(() => void) | null>(null);

  const { txToasts, addTx, removeTx, resetToasts } = useTxToasts();
  const { videoRef, canvasRef, initCamera, triggerFlash, cameraStatus, cameraError, isCameraReady } = useBlinkDetector({
    onBlinkRef,
  });

  const isMobile = useIsMobile();
  const wallet = useWallet();
  const contract = useContract();
  const { duels, history, loading: duelsLoading, refetchDuels } = useDuels(wallet.address);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const DESKTOP_SLIDES = [
    "/desktop-bg.jpg",
    "/desktop-bg-1.jpg",
    "/desktop-bg-2.jpg",
    "/desktop-bg-3.jpg",
    "/desktop-bg-4.jpg",
    "/desktop-bg-5.jpg",
  ];
  const gameBgImage = useMemo(
    () => DESKTOP_SLIDES[Math.floor(Math.random() * DESKTOP_SLIDES.length)],
    []
  );

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
    errorBanner,
    dismissError,
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
      joinDuel: contract.joinDuel,
      submitScore: contract.submitScore,
      checkAllowance: contract.checkAllowance,
      ensureAllowance: contract.ensureAllowance,
    },
    refetchDuels,
    refreshBalance: wallet.refreshBalance,
    walletAddress: (wallet.address as `0x${string}`) ?? null,
  });

  // Wire the blink ref after both hooks are initialized
  onBlinkRef.current = doBlink;

  // Reset toasts on game reset
  const handleReset = useCallback(() => {
    reset();
    resetToasts();
  }, [reset, resetToasts]);

  const handleCancelDuel = useCallback(async (duel: Duel) => {
    try {
      const hash = await contract.cancelDuel(duel.id);
      addTx(hash, "Cancel Duel");
      await publicClient.waitForTransactionReceipt({ hash });
      refetchDuels();
      wallet.refreshBalance();
    } catch (err) {
      console.error("Cancel duel failed:", err);
    }
  }, [contract, addTx, refetchDuels, wallet]);

  const isGameActive = phase !== "idle";

  const MOBILE_SLIDES = [
    "/mobile-bg.png",
    "/mobile-bg-1.png",
    "/mobile-bg-2.png",
    "/mobile-bg-3.png",
    "/mobile-bg-4.png",
    "/mobile-bg-5.png",
  ];
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(() => {
      setSlideIdx((i) => (i + 1) % MOBILE_SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="relative flex h-[100dvh] flex-col items-center justify-center gap-5 overflow-hidden font-sans">
        {/* Stacked images with crossfade + Ken Burns */}
        {MOBILE_SLIDES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out"
            style={{
              opacity: i === slideIdx ? 1 : 0,
              animation: "kenburns 8s ease-in-out infinite alternate",
              animationDelay: `${i * -1.3}s`,
            }}
          />
        ))}
        {/* Color overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span
            className="inline-block h-[84px] w-[84px]"
            style={{
              WebkitMaskImage: "url(/logo-blinkit.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/logo-blinkit.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              backgroundColor: "white",
            }}
          />
          <span className="text-2xl font-bold tracking-wide text-white">BLINKIT</span>
          <span className="text-sm text-white/70">Blink is desktop only.... for now!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden font-sans text-foreground md:h-screen md:flex-row">
      {/* Hidden video element for camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      {/* Left sidebar — hidden on mobile during gameplay */}
      <div className={cn(
        isGameActive ? "hidden md:flex" : "flex",
        "min-h-0 flex-1 md:flex-none"
      )}>
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
          onCancelDuel={handleCancelDuel}
        />
      </div>

      {/* Right: game area — full screen on mobile during gameplay */}
      <div className={cn(
        isGameActive ? "flex" : "hidden md:flex",
        "flex-1 flex-col min-h-0"
      )}>
        {/* Mobile header during gameplay */}
        {isGameActive && (
          <MobileGameHeader
            usdmBalance={wallet.usdmBalance}
            onBack={handleReset}
          />
        )}
        <div className="relative flex-1 overflow-hidden bg-wink-bg">
        {/* Error banner overlay */}
        {errorBanner && (
          <ErrorBanner error={errorBanner} onDismiss={dismissError} />
        )}
        <div className="flex h-full flex-col">
          {phase === "idle" && cameraStatus === "denied" && (
            <div className="flex flex-1 animate-[fade-in_0.5s_ease] flex-col items-center justify-center">
              <img src="/lost.svg" alt="" className="mb-4 h-16 w-16 brightness-0 invert opacity-50" />
              <div className="text-lg font-bold text-wink-text">
                Camera access required
              </div>
              <div className="mt-1.5 max-w-xs text-center text-xs text-wink-text-dim">
                Blinkit uses your webcam to detect blinks. Allow camera access to play.
              </div>
              <div className="mt-4 max-w-sm rounded-xl border border-wink-border bg-card/50 p-4 text-[11px] text-wink-text-dim">
                <p className="mb-2 font-semibold text-wink-text">How to fix it:</p>
                {typeof navigator !== "undefined" && /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent) ? (
                  <ol className="list-decimal space-y-1 pl-4 text-left">
                    <li>Click the <span className="font-semibold text-wink-text">lock icon</span> (🔒) in the address bar</li>
                    <li>Set <span className="font-semibold text-wink-text">Camera</span> to &quot;Allow&quot;</li>
                    <li>Reload the page</li>
                  </ol>
                ) : typeof navigator !== "undefined" && /Firefox/i.test(navigator.userAgent) ? (
                  <ol className="list-decimal space-y-1 pl-4 text-left">
                    <li>Click the <span className="font-semibold text-wink-text">shield icon</span> (🛡️) in the address bar</li>
                    <li>Clear the camera permission block</li>
                    <li>Reload the page</li>
                  </ol>
                ) : typeof navigator !== "undefined" && /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent) ? (
                  <ol className="list-decimal space-y-1 pl-4 text-left">
                    <li>Go to <span className="font-semibold text-wink-text">Safari → Settings → Websites → Camera</span></li>
                    <li>Set this site to &quot;Allow&quot;</li>
                    <li>Reload the page</li>
                  </ol>
                ) : typeof navigator !== "undefined" && /Edg/i.test(navigator.userAgent) ? (
                  <ol className="list-decimal space-y-1 pl-4 text-left">
                    <li>Click the <span className="font-semibold text-wink-text">lock icon</span> (🔒) in the address bar</li>
                    <li>Set <span className="font-semibold text-wink-text">Camera</span> to &quot;Allow&quot;</li>
                    <li>Reload the page</li>
                  </ol>
                ) : (
                  <ol className="list-decimal space-y-1 pl-4 text-left">
                    <li>Open your browser&apos;s site settings</li>
                    <li>Allow camera access for this site</li>
                    <li>Reload the page</li>
                  </ol>
                )}
                <p className="mt-2 text-[10px] text-wink-text-dim/60">
                  Also check: no other app is using the camera (Zoom, Teams, FaceTime...)
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-full border border-wink-pink/40 px-5 py-2 text-xs font-semibold text-wink-pink transition-all hover:bg-wink-pink/10"
              >
                Reload page
              </button>
            </div>
          )}
          {phase === "idle" && cameraStatus !== "denied" && (
            <PhaseIdle
              duels={duels.filter((d) => !wallet.address || d.creatorFull.toLowerCase() !== wallet.address.toLowerCase())}
              authenticated={wallet.authenticated}
              onLaunch={(duel) => { resetToasts(); launch(duel); }}
              onCreate={() => { resetToasts(); launch(null); }}
            />
          )}
          {phase === "approving" && (
            <div className="relative flex flex-1 animate-[fade-in_0.3s_ease] flex-col items-center justify-center gap-4">
              <img
                src={gameBgImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  Step 1/3 — Approve stake
                </div>
                <div className="rounded-2xl bg-black/40 px-6 py-3 backdrop-blur-sm">
                  <span className="font-mono text-[32px] font-extrabold text-wink-pink">
                    ${stake}
                  </span>
                  <span className="ml-2 text-[13px] text-white/60">USDM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-wink-pink border-t-transparent" />
                  <span className="text-sm text-white/60">Confirm in your wallet…</span>
                </div>
              </div>
            </div>
          )}
          {phase === "camera" && (
            <div className="relative flex flex-1 animate-[fade-in_0.3s_ease] flex-col items-center justify-center gap-5">
              <img
                src={gameBgImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Step 2/3 — Camera setup
              </div>
              <div className="relative overflow-hidden rounded-2xl">
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
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-wink-pink border-t-transparent" />
                      <span className="text-sm text-white/60">Loading camera…</span>
                    </div>
                    <p className="max-w-xs text-center text-[11px] text-white/50">
                      We need your camera to detect blinks. Nothing is recorded or shared.
                    </p>
                  </>
                )}
                {cameraStatus === "ready" && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-wink-pink" />
                      <span className="text-sm font-semibold text-wink-pink">Face detected</span>
                    </div>
                    <button
                      onClick={confirmCamera}
                      className="rounded-full bg-wink-pink px-8 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                    >
                      ▶ Duel
                    </button>
                  </>
                )}
                {cameraStatus === "denied" && (
                  <div className="flex flex-col items-center gap-3 max-w-xs text-center">
                    <span className="text-3xl mb-1">🚫</span>
                    <span className="text-sm font-semibold text-red-400">Camera access required</span>
                    <p className="text-[11px] text-white/50">
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
        </div>
      </div>

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
