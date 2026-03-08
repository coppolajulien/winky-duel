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
  susText?: string | null;
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
  susText,
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
              <div className="text-[32px] font-black tracking-tight text-wink-pink md:text-[48px]">
                YOU&apos;RE AHEAD!
              </div>
              <div className="text-sm font-bold text-wink-text-dim md:text-lg">Keep blinking!</div>
            </div>
          </div>
        </>
      )}

      {/* Top bar */}
      <div className="z-[3] flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex items-center gap-2 md:gap-3">
          <FaceMeshCanvas canvasRef={canvasRef} isBlinking={myBlinking} compact={isMobile} />
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-mono text-[28px] font-extrabold leading-none text-wink-text transition-all duration-100 md:text-[38px]",
                myBlinking && "scale-105 text-wink-pink"
              )}
            >
              {myScore}
            </span>
            <span className="text-[10px] text-wink-text-dim md:text-[11px]">blinks</span>
          </div>
          {susText && (
            <div className="animate-[fade-in_0.3s_ease] rounded-full bg-wink-pink/20 px-2.5 py-0.5 text-[10px] font-semibold text-wink-pink">
              {susText}
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-full bg-card px-3 py-1.5 font-mono text-[14px] font-bold md:px-4 md:py-2 md:text-[18px]",
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
            <span className="font-mono text-[22px] font-extrabold leading-none text-wink-text-dim md:text-[30px]">
              {challenge.score}
            </span>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="relative min-h-0 flex-1">
        <BlinkChart data={chartData} hasTarget={!!challenge} />

        {/* TX Toasts overlay */}
        <div className="pointer-events-none absolute bottom-4 right-4 z-[5] flex max-h-[60%] flex-col-reverse gap-1.5 overflow-hidden">
          {txToasts.map((tx) => (
            <TxToast key={tx.id} tx={tx} onDone={onRemoveTx} />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="z-[3] flex items-end justify-end px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-card px-3 py-1.5 font-mono text-[11px] text-wink-pink">
            ${stake * 2} pot
          </div>
          <div className="rounded-full bg-card px-3 py-1.5 font-mono text-[10px] text-wink-text-dim">
            {myScore > 0
              ? (myScore / Math.max(1, DURATION - timeLeft)).toFixed(1)
              : "0.0"}
            /s
          </div>
        </div>
      </div>
    </div>
  );
}
