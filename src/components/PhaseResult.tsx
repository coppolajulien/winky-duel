"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { GameResult } from "@/lib/types";

interface PhaseResultProps {
  result: GameResult;
  stake: number;
  onReset: () => void;
}

export function PhaseResult({ result, stake, onReset }: PhaseResultProps) {
  return (
    <div className="flex flex-1 animate-[fade-in_0.4s_ease] flex-col items-center justify-center p-5">
      {/* Emoji */}
      <div className="mb-2.5 text-[52px]">
        {result.isChallenge ? (result.won ? "🏆" : "💀") : "✅"}
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
      <div className="flex gap-2">
        <Button
          onClick={onReset}
          className="bg-gradient-to-br from-wink-pink to-[var(--wink-pink-darker)] text-white hover:brightness-110"
        >
          ⚔️ Again
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
