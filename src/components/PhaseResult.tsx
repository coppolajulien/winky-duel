"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Image, Check, Download } from "lucide-react";
import type { GameResult, ChartPoint } from "@/lib/types";
import { copyShareCard } from "@/lib/shareCard";

const APP_URL = "https://winky-duel.vercel.app";

interface PhaseResultProps {
  result: GameResult;
  stake: number;
  chartData: ChartPoint[];
  onReset: () => void;
}

export function PhaseResult({ result, stake, chartData, onReset }: PhaseResultProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied" | "downloaded">("idle");

  const shareOnX = useCallback(() => {
    let text: string;
    if (result.isChallenge && result.won) {
      text = `👁️ I just won a Winky Duel!\n\n${result.my} vs ${result.target} blinks — earned $${(stake * 2 * 0.95 - stake).toFixed(0)} USDM 💰\n\nThink you can blink faster? 👀`;
    } else if (result.isChallenge && !result.won) {
      text = `👁️ Lost a Winky Duel... ${result.my} vs ${result.target} blinks 💀\n\nI need a rematch! Can you beat ${result.target} blinks?`;
    } else {
      text = `👁️ I just scored ${result.my} blinks in a Winky Duel!\n\nStaked $${stake} USDM — who dares to challenge me? ⚔️`;
    }
    text += `\n\n${APP_URL}`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [result, stake]);

  const handleCopyImage = useCallback(async () => {
    setCopyStatus("copying");
    try {
      const status = await copyShareCard(chartData, result, stake);
      setCopyStatus(status);
      setTimeout(() => setCopyStatus("idle"), 2500);
    } catch (err) {
      console.error("Share card failed:", err);
      setCopyStatus("idle");
    }
  }, [chartData, result, stake]);
  return (
    <div className="flex flex-1 animate-[fade-in_0.4s_ease] flex-col items-center justify-center p-5">
      {/* Icon */}
      <div className="mb-2.5">
        {result.isChallenge ? (
          result.won ? (
            <img src="/victory.svg" alt="Victory" className="h-16 w-16 dark:invert" />
          ) : (
            <img src="/lost.svg" alt="Defeat" className="h-16 w-16 dark:invert" />
          )
        ) : (
          <img src="/duel.svg" alt="Duel posted" className="h-16 w-16 dark:invert" />
        )}
      </div>

      {/* Title */}
      <div
        className={cn(
          "mb-1 text-2xl font-black",
          result.isChallenge
            ? result.won
              ? "text-wink-cyan"
              : "text-destructive"
            : "text-wink-pink"
        )}
      >
        {result.isChallenge
          ? result.won
            ? "YOU WIN!"
            : "YOU LOSE"
          : "DUEL POSTED!"}
      </div>

      {/* Winnings */}
      {result.isChallenge && result.won && (
        <div className="font-mono text-lg font-bold text-wink-cyan">
          +${(stake * 2 * 0.95 - stake).toFixed(2)}
        </div>
      )}

      {/* Subtitle */}
      <div className="mb-5 text-center text-[11px] text-wink-text-dim">
        {result.isChallenge
          ? `${result.my} vs ${result.target} blinks`
          : `Score of ${result.my} posted`}
      </div>

      {/* Score comparison */}
      <div className="mb-5 flex gap-5 rounded-xl border border-wink-border bg-[var(--glass-bg)] px-8 py-4 backdrop-blur-[10px]">
        <div className="text-center">
          <div className="font-mono text-[32px] font-extrabold text-wink-pink">
            {result.my}
          </div>
          <div className="text-[9px] text-wink-text-dim">YOU</div>
        </div>
        {result.target !== null && (
          <>
            <div className="w-px bg-wink-border" />
            <div className="text-center">
              <div className="font-mono text-[32px] font-extrabold text-wink-orange">
                {result.target}
              </div>
              <div className="text-[9px] text-wink-text-dim">TARGET</div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          onClick={onReset}
          className="bg-gradient-to-br from-wink-pink to-[var(--wink-pink-darker)] text-white hover:brightness-110"
        >
          <img src="/duel.svg" alt="" className="mr-1 h-4 w-4 invert" /> Again
        </Button>
        <Button
          onClick={handleCopyImage}
          disabled={copyStatus === "copying"}
          variant="outline"
          className="border-wink-cyan/30 bg-wink-cyan/[0.06] text-wink-cyan hover:bg-wink-cyan/[0.12]"
        >
          {copyStatus === "copying" ? (
            "Generating..."
          ) : copyStatus === "copied" ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Copied!
            </span>
          ) : copyStatus === "downloaded" ? (
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Downloaded!
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Copy Image
            </span>
          )}
        </Button>
        <Button
          onClick={shareOnX}
          className="bg-black text-white hover:bg-black/80"
        >
          <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="border-wink-border bg-[var(--glass-bg)] text-wink-text-dim hover:text-wink-text"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
