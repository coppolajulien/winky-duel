"use client";

import { MOCK_LEADERBOARD } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const MEDAL_COLORS = ["text-yellow-400", "text-gray-400", "text-amber-700"] as const;
const MEDALS = ["🥇", "🥈", "🥉"] as const;

export function Leaderboard() {
  return (
    <div className="animate-[fade-in_0.3s_ease]">
      {/* Prize pool */}
      <div className="mb-2 rounded-lg border border-wink-pink/[0.13] bg-gradient-to-br from-wink-pink/[0.08] to-transparent p-3 text-center">
        <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-wink-text-dim">
          Weekly Pool
        </div>
        <div className="font-mono text-2xl font-extrabold text-wink-pink">
          $250
        </div>
        <div className="mt-0.5 text-[9px] text-wink-text-dim">
          Ends in <strong className="text-wink-text">3d 14h</strong>
        </div>
      </div>

      {/* Leaderboard table */}
      {MOCK_LEADERBOARD.map((r) => (
        <div
          key={r.r}
          className="grid grid-cols-[24px_1fr_40px_50px] items-center border-b border-wink-border px-2.5 py-2 text-[11px]"
        >
          <span
            className={cn(
              "font-mono text-[10px] font-bold",
              r.r <= 3 ? MEDAL_COLORS[r.r - 1] : "text-wink-text-dim"
            )}
          >
            {r.r <= 3 ? MEDALS[r.r - 1] : r.r}
          </span>
          <div>
            <div className="font-mono text-[10px] text-wink-text">
              {r.addr}
            </div>
            <div className="text-[9px] text-wink-text-dim">
              {r.blinks.toLocaleString()}
            </div>
          </div>
          <span className="text-right font-mono text-[10px] text-wink-cyan">
            {r.wins}W
          </span>
          <span className="text-right font-mono text-[11px] font-bold text-wink-pink">
            ${r.earn}
          </span>
        </div>
      ))}
    </div>
  );
}
