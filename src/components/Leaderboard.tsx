"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

const PAGE_SIZE = 20;

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
}

export function Leaderboard({ entries, loading }: LeaderboardProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const paginated = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="animate-[fade-in_0.3s_ease]">
      {/* Title */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-wink-text">
          Leaderboard
        </h1>
        <p className="mt-1 text-xs text-wink-text-dim">
          Top winners by total earnings
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[32px_1fr_48px_64px] items-center rounded-xl bg-card px-4 py-3.5"
            >
              <div className="h-4 w-4 animate-pulse rounded bg-wink-border" />
              <div className="flex flex-col gap-1">
                <div className="h-3 w-24 animate-pulse rounded bg-wink-border" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-wink-border" />
              </div>
              <div className="ml-auto h-3 w-8 animate-pulse rounded bg-wink-border" />
              <div className="ml-auto h-3.5 w-10 animate-pulse rounded bg-wink-border" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="rounded-xl bg-card p-8 text-center">
          <p className="text-sm text-wink-text-dim">No duels settled yet. Be the first winner!</p>
        </div>
      )}

      {/* Leaderboard table */}
      {!loading && entries.length > 0 && (
        <>
          <div className="flex flex-col gap-1.5">
            {paginated.map((r) => (
              <div
                key={r.r}
                className={cn(
                  "grid grid-cols-[32px_1fr_48px_64px] items-center rounded-xl px-4 py-3.5 transition-colors",
                  r.r <= 3
                    ? "bg-wink-pink/[0.06] border border-wink-pink/25 duel-high-stake"
                    : "bg-card"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    r.r === 1
                      ? "text-wink-pink"
                      : r.r <= 3
                        ? "text-wink-pink/70"
                        : "text-wink-text-dim"
                  )}
                >
                  {r.r}
                </span>
                <div>
                  <div className="font-mono text-[11px] text-wink-text">
                    {r.addr}
                  </div>
                  <div className="text-[9px] text-wink-text-dim">
                    {r.blinks.toLocaleString()} blinks
                  </div>
                </div>
                <span className="text-right font-mono text-[11px] font-semibold text-wink-pink">
                  {r.wins}W
                </span>
                <span className="text-right font-mono text-sm font-bold text-wink-text">
                  ${r.earn}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded px-3 py-1 text-[11px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-[10px] text-wink-text-dim">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded px-3 py-1 text-[11px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
