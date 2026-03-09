"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Image, Link2 } from "lucide-react";
import type { GameResult, ChartPoint } from "@/lib/types";
import { copyShareCard } from "@/lib/shareCard";
import { netWin, RAKE_BPS, APP_URL, DESKTOP_SLIDES } from "@/lib/constants";

interface PhaseResultProps {
  result: GameResult;
  stake: number;
  chartData: ChartPoint[];
  onReset: () => void;
}

export function PhaseResult({ result, stake, chartData, onReset }: PhaseResultProps) {
  const [copying, setCopying] = useState(false);

  // Confetti burst on win
  const isWin = result.isChallenge && result.won === true && !result.error;
  useEffect(() => {
    if (!isWin) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      // First burst — left side
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.2, y: 0.5 },
        colors: ["#FF3B8B", "#FF6DB3", "#FFD700", "#FFFFFF"],
      });
      // Second burst — right side (slight delay)
      setTimeout(() => {
        if (cancelled) return;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.8, y: 0.5 },
          colors: ["#FF3B8B", "#FF6DB3", "#FFD700", "#FFFFFF"],
        });
      }, 200);
    });
    return () => { cancelled = true; };
  }, [isWin]);

  const duelUrl = result.duelId != null ? `${APP_URL}/duel/${result.duelId}` : null;

  const bgImage = useMemo(
    () => DESKTOP_SLIDES[Math.floor(Math.random() * DESKTOP_SLIDES.length)],
    []
  );

  const copyLink = useCallback(() => {
    if (!duelUrl) return;
    navigator.clipboard.writeText(duelUrl).then(() => {
      toast.success("Link copied!");
    });
  }, [duelUrl]);

  const shareOnX = useCallback(() => {
    let text: string;
    if (result.error) {
      text = `👁️ I just scored ${result.my} blinks in a Blinkit Duel!\n\nDeposited $${stake} USDM. Who dares to challenge me? ⚔️`;
    } else if (result.isChallenge && result.won === true) {
      text = `👁️ I just won a Blinkit Duel!\n\n${result.my} vs ${result.target} blinks — earned $${netWin(stake)} USDM 💰\n\nThink you can blink faster? 👀`;
    } else if (result.isChallenge && result.won === false) {
      text = `👁️ Lost a Blinkit Duel... ${result.my} vs ${result.target} blinks 💀\n\nI need a rematch! Can you beat ${result.target} blinks?`;
    } else {
      text = `👁️ I just scored ${result.my} blinks in a Blinkit Duel!\n\nDeposited $${stake} USDM. Who dares to challenge me? ⚔️`;
    }
    text += `\n\n${duelUrl ?? APP_URL}`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [result, stake, duelUrl]);

  const handleCopyImage = useCallback(async () => {
    setCopying(true);
    try {
      const status = await copyShareCard(chartData, result, stake);
      if (status === "copied") {
        toast.success("Image copied!");
      } else {
        toast.success("Image downloaded!");
      }
    } catch (err) {
      console.error("Share card failed:", err);
      toast.error("Failed to generate share card");
    } finally {
      setCopying(false);
    }
  }, [chartData, result, stake]);

  return (
    <div className="flex flex-1 animate-[fade-in_0.4s_ease] flex-col items-center justify-center p-5">
      {/* Title — above the card */}
      <div
        className={cn(
          "mb-5 text-5xl font-black md:text-6xl",
          result.error
            ? "text-red-400"
            : result.isChallenge
              ? result.won === true
                ? "text-wink-pink"
                : result.won === false
                  ? "text-white/40"
                  : "text-white/60"
              : "text-wink-pink"
        )}
      >
        {result.error
          ? "TX FAILED"
          : result.isChallenge
            ? result.won === true
              ? "YOU WIN!"
              : result.won === false
                ? "YOU LOSE"
                : "DRAW"
            : "DUEL POSTED!"}
      </div>

      {/* Hero card with background visual */}
      <div className="relative mb-8 w-full max-w-lg overflow-hidden rounded-2xl">
        <img
          src={bgImage}
          alt=""
          className="h-64 w-full object-cover md:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          {/* Error message */}
          {result.error && (
            <div className="mb-2 max-w-[280px] text-center text-[11px] text-red-400/80 drop-shadow-lg">
              {result.error}
            </div>
          )}

          {/* Winnings */}
          {result.isChallenge && result.won === true && !result.error && (
            <div className="flex flex-col items-center">
              <div className="font-mono text-5xl font-black text-wink-pink drop-shadow-lg md:text-6xl">
                +${netWin(stake)}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {RAKE_BPS / 100}% fee applied, thank you!
              </div>
            </div>
          )}

          {/* Stake amount (duel posted) */}
          {!result.isChallenge && !result.error && (
            <div className="flex flex-col items-center">
              <div className="font-mono text-5xl font-black text-wink-pink drop-shadow-lg md:text-6xl">
                ${stake}
              </div>
              <div className="mt-1 text-xs text-white/50">
                deposited
              </div>
            </div>
          )}

          {/* Subtitle */}
          {result.error && (
            <div className="mb-3 text-center text-xs text-white/60 md:text-sm">
              You blinked {result.my} times
            </div>
          )}

          {/* Score */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-mono text-[40px] font-extrabold leading-none text-white drop-shadow-lg md:text-[52px]">
                {result.my}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/50 md:text-xs">
                {!result.isChallenge && !result.error ? "Your score posted" : "You"}
              </div>
            </div>
            {result.target !== null && (
              <>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <div className="font-mono text-[40px] font-extrabold leading-none text-white/40 drop-shadow-lg md:text-[52px]">
                    {result.target}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/30 md:text-xs">
                    Target
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          onClick={onReset}
          className="rounded-full bg-wink-pink text-white hover:brightness-110"
        >
          Again
        </Button>
        <Button
          onClick={handleCopyImage}
          disabled={copying}
          variant="outline"
          className="rounded-full border-wink-border text-wink-text hover:bg-card"
        >
          {copying ? (
            "Generating..."
          ) : (
            <span className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Copy Image
            </span>
          )}
        </Button>
        {duelUrl && (
          <Button
            onClick={copyLink}
            variant="outline"
            className="rounded-full border-wink-border text-wink-text hover:bg-card"
          >
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Copy Link
            </span>
          </Button>
        )}
        <Button
          onClick={shareOnX}
          className="rounded-full bg-card text-wink-text hover:brightness-110"
        >
          <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="rounded-full border-wink-border text-wink-text-dim hover:text-wink-text"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
