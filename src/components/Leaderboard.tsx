"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { WALLET_PROFILE_URL } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/types";

const PAGE_SIZE = 20;
const MEDALS = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"] as const; // 1st, 2nd, 3rd

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  currentAddress?: string | null;
}

/* Shared row renderer */
function LeaderboardRow({
  r,
  isMe,
  pinned,
}: {
  r: LeaderboardEntry;
  isMe: boolean;
  pinned?: boolean;
}) {
  const medal = MEDALS[r.r] ?? "";

  return (
    <div
      className={cn(
        "grid grid-cols-[32px_1fr_48px_64px] items-center rounded-xl px-4 py-3.5 transition-colors",
        pinned
          ? "bg-wink-cyan/[0.08] border border-wink-cyan/30"
          : isMe
            ? "bg-wink-cyan/[0.08] border border-wink-cyan/30 ring-1 ring-wink-cyan/20"
            : r.r <= 3
              ? "bg-wink-pink/[0.06] border border-wink-pink/25"
              : "bg-card"
      )}
    >
      <span
        className={cn(
          "font-mono text-sm font-bold",
          medal
            ? "text-base"
            : r.r <= 3
              ? "text-wink-pink/70"
              : "text-wink-text-dim"
        )}
      >
        {medal || r.r}
      </span>
      <div>
        <div className="flex items-center gap-1.5">
          <a
            href={`${WALLET_PROFILE_URL}/wallet/${r.addrFull}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-mono text-[11px] transition-colors hover:text-wink-pink",
              isMe ? "text-wink-cyan font-semibold" : "text-wink-text"
            )}
          >
            {r.addr}
          </a>
          {isMe && (
            <span className="rounded-full bg-wink-cyan/20 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-wink-cyan">
              You
            </span>
          )}
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
  );
}

export function Leaderboard({ entries, loading, currentAddress }: LeaderboardProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const paginated = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const normalizedAddr = currentAddress?.toLowerCase() ?? null;

  // Find the current user's entry (if any)
  const myEntry = useMemo(
    () => (normalizedAddr ? entries.find((e) => e.addrFull === normalizedAddr) : undefined),
    [entries, normalizedAddr]
  );

  // Is the user's row already visible on the current page?
  const myVisibleOnPage = myEntry
    ? paginated.some((r) => r.addrFull === normalizedAddr)
    : false;

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

      {/* Your ranking banner */}
      {!loading && myEntry && (
        <div className="mb-5 rounded-2xl border border-wink-cyan/20 bg-wink-cyan/[0.04] px-5 py-4 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-wink-text-dim">
            Your ranking
          </div>
          <div className="mt-1 font-mono text-3xl font-black text-wink-cyan">
            #{myEntry.r}
          </div>
          <div className="mt-2 flex justify-center gap-6">
            <div>
              <div className="font-mono text-lg font-bold text-wink-text">${myEntry.earn}</div>
              <div className="text-[9px] uppercase tracking-wider text-wink-text-dim">Earned</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-wink-pink">{myEntry.wins}</div>
              <div className="text-[9px] uppercase tracking-wider text-wink-text-dim">Wins</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-wink-text">{myEntry.blinks.toLocaleString()}</div>
              <div className="text-[9px] uppercase tracking-wider text-wink-text-dim">Blinks</div>
            </div>
          </div>
        </div>
      )}

      {/* Not ranked banner (connected but no wins) */}
      {!loading && normalizedAddr && !myEntry && entries.length > 0 && (
        <div className="mb-5 rounded-2xl border border-wink-border bg-card px-5 py-4 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-wink-text-dim">
            Your ranking
          </div>
          <div className="mt-1 text-sm text-wink-text-dim">
            Unranked — win a duel to appear on the leaderboard!
          </div>
        </div>
      )}

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
            {paginated.map((r) => {
              const isMe = normalizedAddr != null && r.addrFull === normalizedAddr;
              return <LeaderboardRow key={r.r} r={r} isMe={isMe} />;
            })}
          </div>

          {/* Pinned "You" row at the bottom when not visible on current page */}
          {myEntry && !myVisibleOnPage && (
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-wink-border/50" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-wink-text-dim">
                  You
                </span>
                <div className="h-px flex-1 bg-wink-border/50" />
              </div>
              <LeaderboardRow r={myEntry} isMe pinned />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded px-3 py-1 text-[11px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                &larr; Prev
              </button>
              <span className="text-[10px] text-wink-text-dim">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded px-3 py-1 text-[11px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
