"use client";

import { type RefObject } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DURATION } from "@/lib/constants";
import type { Duel, ChartPoint, TxToastData } from "@/lib/types";
import { BlinkChart } from "./BlinkChart";
import { FaceMeshCanvas } from "./FaceMeshCanvas";
import { TxToast } from "./TxToast";

interface PhasePlayingProps {
  myScore: number;
  timeLeft: number;
  challenge: Duel | null;
  myBlinking: boolean;
  overtook: boolean;
  chartData: ChartPoint[];
  txToasts: TxToastData[];
  stake: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onRemoveTx: (id: number) => void;
}

export function PhasePlaying({
  myScore,
  timeLeft,
  challenge,
  myBlinking,
  overtook,
  chartData,
  txToasts,
  stake,
  canvasRef,
  onRemoveTx,
}: PhasePlayingProps) {
  const isMobile = useIsMobile();

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Overtake flash */}
      {overtook && (
        <>
          <div className="pointer-events-none absolute inset-0 z-[10] animate-[overtake-flash_1.2s_ease-out_forwards]" />
          <div className="pointer-events-none absolute inset-0 z-[11] flex items-center justify-center">
            <div className="animate-[overtake-text_1.2s_ease-out_forwards] text-center">
              <div className="text-[32px] font-black tracking-tight text-wink-cyan drop-shadow-[0_0_40px_rgba(0,229,255,0.6)] md:text-[48px]">
                YOU&apos;RE AHEAD!
              </div>
              <div className="text-sm font-bold text-white/50 md:text-lg">Keep blinking! 🔥</div>
            </div>
          </div>
        </>
      )}

      {/* Top bar */}
      <div className="z-[3] flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex items-center gap-2 md:gap-3">
          {!isMobile && (
            <FaceMeshCanvas canvasRef={canvasRef} isBlinking={myBlinking} />
          )}
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-mono text-[28px] font-extrabold leading-none text-wink-pink transition-all duration-100 md:text-[38px]",
                myBlinking && "scale-105"
              )}
              style={{
                textShadow: myBlinking
                  ? "0 0 25px var(--glow-pink)"
                  : "none",
              }}
            >
              {myScore}
            </span>
            <span className="text-[10px] text-wink-text-dim md:text-[11px]">blinks</span>
          </div>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-wink-border bg-[var(--glass-bg)] px-3 py-1.5 font-mono text-[14px] font-bold backdrop-blur-[10px] md:px-4 md:py-2 md:text-[18px]",
            timeLeft <= 5
              ? "text-destructive animate-[timer-warn_0.5s_ease_infinite]"
              : "text-wink-text"
          )}
        >
          0:{String(timeLeft).padStart(2, "0")}
        </div>

        {challenge && (
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-wink-text-dim md:text-[11px]">target</span>
            <span className="font-mono text-[22px] font-extrabold leading-none text-wink-orange opacity-60 md:text-[30px]">
              {challenge.score}
            </span>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="relative min-h-0 flex-1">
        <BlinkChart data={chartData} hasTarget={!!challenge} />
        {/* Mobile: face mesh as PIP overlay */}
        {isMobile && (
          <FaceMeshCanvas canvasRef={canvasRef} isBlinking={myBlinking} compact />
        )}

        {/* TX Toasts overlay */}
        <div className="pointer-events-none absolute bottom-4 right-4 z-[5] flex max-h-[60%] flex-col-reverse gap-1.5 overflow-hidden">
          {txToasts.map((tx) => (
            <TxToast key={tx.id} tx={tx} onDone={onRemoveTx} />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="z-[3] flex items-end justify-end px-4 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-wink-border bg-[var(--glass-bg)] px-3 py-1.5 font-mono text-[11px] text-wink-pink backdrop-blur-[10px]">
            💰 ${stake * 2}
          </div>
          <div className="rounded-2xl border border-wink-border bg-[var(--glass-bg)] px-3 py-1.5 font-mono text-[10px] text-wink-text-dim backdrop-blur-[10px]">
            ⚡{" "}
            {myScore > 0
              ? (myScore / Math.max(1, DURATION - timeLeft)).toFixed(1)
              : "0.0"}
            /s
          </div>
          <div className="text-[11px] text-wink-text-dim">
            👁 Blink to score
          </div>
        </div>
      </div>
    </div>
  );
}
