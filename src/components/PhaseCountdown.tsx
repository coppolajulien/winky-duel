import type { Duel } from "@/lib/types";

interface PhaseCountdownProps {
  countdownNum: number;
  challenge: Duel | null;
  stake: number;
}

export function PhaseCountdown({ countdownNum, challenge, stake }: PhaseCountdownProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      {/* Stake & context */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wink-text-dim">
          {challenge ? `Challenge · Beat ${challenge.score} blinks` : "New duel"}
        </div>
        <div className="rounded-2xl border border-wink-border bg-[var(--glass-bg)] px-5 py-2.5 backdrop-blur-[10px]">
          <span className="font-mono text-[22px] font-extrabold text-wink-pink md:text-[28px]">
            ${stake}
          </span>
          <span className="ml-1.5 text-[11px] text-wink-text-dim">USDM</span>
        </div>
      </div>

      {/* Countdown number */}
      <div
        className="font-mono text-[80px] font-black leading-none text-wink-pink animate-[count-boom_1s_ease_infinite] md:text-[140px]"
        style={{ textShadow: "0 0 60px var(--glow-pink)" }}
      >
        {countdownNum}
      </div>
    </div>
  );
}
