"use client";

import { type RefObject } from "react";
import { cn } from "@/lib/utils";
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
  chartData: ChartPoint[];
  txToasts: TxToastData[];
  stake: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onBlink: () => void;
  onRemoveTx: (id: number) => void;
}

export function PhasePlaying({
  myScore,
  timeLeft,
  challenge,
  myBlinking,
  chartData,
  txToasts,
  stake,
  canvasRef,
  onBlink,
  onRemoveTx,
}: PhasePlayingProps) {
  return (
    <div
      className="relative flex flex-1 flex-col"
      onClick={onBlink}
    >
      {/* Top bar */}
      <div className="z-[3] flex items-center justify-between px-4 py-2.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono text-[38px] font-extrabold leading-none text-wink-pink transition-all duration-100",
              myBlinking && "scale-105"
            )}
            style={{
              textShadow: myBlinking
                ? "0 0 25px rgba(255,60,144,0.5)"
                : "none",
            }}
          >
            {myScore}
          </span>
          <span className="text-[11px] text-wink-text-dim">blinks</span>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-wink-border bg-black/30 px-3.5 py-1.5 font-mono text-[13px] font-bold backdrop-blur-[10px]",
            timeLeft <= 5
              ? "text-destructive animate-[timer-warn_0.5s_ease_infinite]"
              : "text-wink-text"
          )}
        >
          0:{String(timeLeft).padStart(2, "0")}
        </div>

        {challenge && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-wink-text-dim">target</span>
            <span className="font-mono text-[30px] font-extrabold leading-none text-wink-orange opacity-60">
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
      <div className="z-[3] flex items-end justify-between px-4 pb-2.5">
        <FaceMeshCanvas canvasRef={canvasRef} isBlinking={myBlinking} />

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-wink-border bg-black/30 px-3 py-1.5 font-mono text-[11px] text-wink-pink backdrop-blur-[10px]">
            💰 ${stake * 2}
          </div>
          <div className="rounded-2xl border border-wink-border bg-black/30 px-3 py-1.5 font-mono text-[10px] text-wink-text-dim backdrop-blur-[10px]">
            ⚡{" "}
            {myScore > 0
              ? (myScore / Math.max(1, DURATION - timeLeft)).toFixed(1)
              : "0.0"}
            /s
          </div>
          <div className="text-[11px] text-wink-text-dim">
            Space / Click to blink
          </div>
        </div>
      </div>
    </div>
  );
}
