import type { Duel } from "@/lib/types";

interface PhaseCountdownProps {
  countdownNum: number;
  challenge: Duel | null;
  stake: number;
}

export function PhaseCountdown({ countdownNum, challenge, stake }: PhaseCountdownProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-wink-text-dim">
        {challenge ? `Beat ${challenge.score} blinks` : `$${stake} duel`}
      </div>
      <div
        className="font-mono text-[140px] font-black leading-none text-wink-pink animate-[count-boom_1s_ease_infinite]"
        style={{ textShadow: "0 0 60px rgba(255,60,144,0.4)" }}
      >
        {countdownNum}
      </div>
    </div>
  );
}
