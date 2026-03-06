"use client";

import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

// Temporary mock data (will be replaced by on-chain events in Phase 5)
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { r: 1, addr: "0x7aB3...c92F", blinks: 1847, wins: 23, earn: 142.5 },
  { r: 2, addr: "0xfA20...8e1C", blinks: 1623, wins: 19, earn: 98.75 },
  { r: 3, addr: "0x1De8...44aB", blinks: 1580, wins: 17, earn: 87.2 },
  { r: 4, addr: "0x44cD...b3F7", blinks: 1402, wins: 15, earn: 65.0 },
  { r: 5, addr: "0x8bE1...2a6D", blinks: 1295, wins: 12, earn: 43.5 },
  { r: 6, addr: "0xC7a9...19eF", blinks: 1188, wins: 11, earn: 38.0 },
];

export function Leaderboard() {
  return (
    <div className="animate-[fade-in_0.3s_ease]">
      {/* Prize pool */}
      <div className="mb-3 rounded-xl bg-card p-4 text-center">
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
          className="grid grid-cols-[24px_1fr_40px_50px] items-center border-b border-wink-border px-2.5 py-2.5 text-[11px]"
        >
          <span
            className={cn(
              "font-mono text-[10px] font-bold",
              r.r <= 3 ? "text-wink-pink" : "text-wink-text-dim"
            )}
          >
            {r.r}
          </span>
          <div>
            <div className="font-mono text-[10px] text-wink-text">
              {r.addr}
            </div>
            <div className="text-[9px] text-wink-text-dim">
              {r.blinks.toLocaleString()}
            </div>
          </div>
          <span className="text-right font-mono text-[10px] text-wink-pink">
            {r.wins}W
          </span>
          <span className="text-right font-mono text-[11px] font-bold text-wink-text">
            ${r.earn}
          </span>
        </div>
      ))}
    </div>
  );
}
