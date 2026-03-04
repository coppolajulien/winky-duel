import { Loader2 } from "lucide-react";
import type { Duel } from "@/lib/types";
import type { ApprovalStatus } from "@/hooks/useGameLoop";

interface PhaseCountdownProps {
  countdownNum: number;
  challenge: Duel | null;
  stake: number;
  approvalStatus: ApprovalStatus;
}

export function PhaseCountdown({ countdownNum, challenge, stake, approvalStatus }: PhaseCountdownProps) {
  const isWaiting = approvalStatus === "approving";

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      {isWaiting ? (
        /* ── Waiting for Privy approval ── */
        <>
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-wink-text-dim">
            {challenge ? `Challenge · Beat ${challenge.score} blinks` : "New duel"}
          </div>
          <div className="mb-6 rounded-2xl border border-wink-border bg-[var(--glass-bg)] px-6 py-3 backdrop-blur-[10px]">
            <span className="font-mono text-[36px] font-extrabold text-wink-pink">
              ${stake}
            </span>
            <span className="ml-2 text-[13px] text-wink-text-dim">USDM</span>
          </div>
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-wink-pink" />
          <span className="text-[12px] text-wink-text-dim">
            Confirm in your wallet to continue…
          </span>
        </>
      ) : (
        /* ── Real countdown 3-2-1 ── */
        <>
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-wink-text-dim">
            {challenge ? `Beat ${challenge.score} blinks` : `$${stake} duel`}
          </div>
          <div
            className="font-mono text-[140px] font-black leading-none text-wink-pink animate-[count-boom_1s_ease_infinite]"
            style={{ textShadow: "0 0 60px var(--glow-pink)" }}
          >
            {countdownNum}
          </div>
        </>
      )}
    </div>
  );
}
