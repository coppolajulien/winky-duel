"use client";

import { useState } from "react";
import { Monitor, ChevronDown, X } from "lucide-react";
import { STAKES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DuelStatus } from "@/lib/types";
import type { Duel, HistoryDuel } from "@/lib/types";
import { useIsMobile } from "@/hooks/useIsMobile";

const HISTORY_PAGE_SIZE = 5;
const DUELS_PAGE_SIZE = 5;

interface DuelsListProps {
  stake: number;
  setStake: (s: number) => void;
  stakeFilter: number | null;
  setStakeFilter: (s: number | null) => void;
  duels: Duel[];
  history: HistoryDuel[];
  onLaunch: (duel: Duel | null) => void;
  onCancelDuel?: (duel: Duel) => void;
  authenticated: boolean;
  login: () => void;
  duelsLoading: boolean;
  currentAddress: `0x${string}` | null;
}

export function DuelsList({
  stake,
  setStake,
  stakeFilter,
  setStakeFilter,
  duels,
  history,
  onLaunch,
  onCancelDuel,
  authenticated,
  login,
  duelsLoading,
  currentAddress,
}: DuelsListProps) {
  const isMobile = useIsMobile();
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<"all" | "won" | "lost">("all");
  const [duelsPage, setDuelsPage] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showMine, setShowMine] = useState(false);

  const filteredHistory = historyFilter === "all"
    ? history
    : historyFilter === "won"
      ? history.filter((h) => h.won === true)
      : history.filter((h) => h.won === false);

  const totalPages = Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE);
  const paginatedHistory = filteredHistory.slice(
    historyPage * HISTORY_PAGE_SIZE,
    (historyPage + 1) * HISTORY_PAGE_SIZE
  );

  const myDuelsCount = currentAddress
    ? duels.filter((d) => d.creatorFull.toLowerCase() === currentAddress.toLowerCase()).length
    : 0;

  const displayedDuels = (showMine
    ? duels.filter((d) => currentAddress && d.creatorFull.toLowerCase() === currentAddress.toLowerCase())
    : duels.filter((d) => !currentAddress || d.creatorFull.toLowerCase() !== currentAddress.toLowerCase())
  ).toSorted((a, b) => b.stake - a.stake);

  const duelsTotalPages = Math.ceil(displayedDuels.length / DUELS_PAGE_SIZE);
  const paginatedDuels = displayedDuels.slice(
    duelsPage * DUELS_PAGE_SIZE,
    (duelsPage + 1) * DUELS_PAGE_SIZE
  );

  return (
    <div className="animate-[fade-in_0.3s_ease] flex flex-col gap-2.5">
      {/* Mobile alert */}
      {isMobile && (
        <div className="rounded-xl bg-card p-3">
          <div className="flex items-center gap-2.5">
            <Monitor className="h-5 w-5 shrink-0 text-wink-text-dim" />
            <div>
              <p className="text-[11px] font-semibold text-wink-text">Desktop only</p>
              <p className="mt-0.5 text-[10px] text-wink-text-dim">
                Blinkit uses your webcam to detect blinks. Open this page on a computer to play.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Box 1: New Duel */}
      <div className="rounded-xl bg-card p-3.5">
        <h2 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-wink-text-dim">
          New Duel
        </h2>
        <div className="mb-2.5 flex gap-1.5">
          {STAKES.map((s) => (
            <button
              key={s}
              onClick={() => setStake(s)}
              className={cn(
                "flex-1 rounded-lg py-2 font-mono text-[11px] font-bold transition-all md:py-1.5",
                stake === s
                  ? "bg-wink-pink text-white"
                  : "bg-wink-bg text-wink-text-dim hover:text-wink-text"
              )}
            >
              ${s}
            </button>
          ))}
        </div>
        <Button
          onClick={() => authenticated ? onLaunch(null) : login()}
          disabled={isMobile}
          className="w-full rounded-xl bg-wink-pink text-[11px] font-bold text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          size="sm"
        >
          {isMobile ? "PLAY ON DESKTOP" : authenticated ? "CREATE A DUEL" : "CONNECT TO PLAY"}
        </Button>
      </div>

      {/* Box 2: Engage in a battle */}
      <div className="rounded-xl bg-card p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-wink-text-dim">
            {showMine ? "My open duels" : "Engage in a battle"}
          </h2>
          {authenticated && myDuelsCount > 0 && (
            <button
              onClick={() => { setShowMine((v) => !v); setDuelsPage(0); }}
              className={cn(
                "text-[9px] font-semibold transition-colors",
                showMine
                  ? "text-wink-pink"
                  : "text-wink-text-dim hover:text-wink-text"
              )}
            >
              {showMine ? "← Back" : `Mine (${myDuelsCount})`}
            </button>
          )}
        </div>

        <div className="mb-2 flex gap-1">
          {([null, ...STAKES] as (number | null)[]).map((s) => (
            <button
              key={String(s)}
              onClick={() => setStakeFilter(s)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[9px] font-semibold transition-all",
                s !== null && "font-mono",
                stakeFilter === s
                  ? "bg-white/[0.1] text-wink-text"
                  : "text-wink-text-dim hover:text-wink-text"
              )}
            >
              {s === null ? "All" : `$${s}`}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {duelsLoading && duels.length === 0 && (
            <div className="py-4 text-center text-[10px] text-wink-text-dim">
              Loading duels...
            </div>
          )}

          {!duelsLoading && duels.length === 0 && (
            <div className="py-4 text-center text-[10px] text-wink-text-dim">
              No open duels. Create one!
            </div>
          )}

          {paginatedDuels.map((d) => {
            const isOwn =
              currentAddress &&
              d.creatorFull.toLowerCase() === currentAddress.toLowerCase();
            const isHighStake = d.stake >= 50;

            return (
              <div
                key={String(d.id)}
                onClick={() => !isOwn && authenticated && !isMobile && onLaunch(d)}
                className={cn(
                  "group flex items-center gap-1.5 rounded-xl px-3 py-2.5 transition-all",
                  isHighStake && "border border-wink-pink/25 duel-high-stake",
                  isOwn
                    ? "bg-wink-pink/[0.04]"
                    : isMobile
                      ? "cursor-not-allowed opacity-50"
                      : authenticated
                        ? "cursor-pointer hover:bg-wink-bg"
                        : "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex-1">
                  <div className="font-mono text-[10px] text-wink-text">
                    {isOwn ? "You" : d.creator}
                  </div>
                  <div className="text-[9px] text-wink-text-dim">{d.time}</div>
                </div>
                <div className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs font-bold text-wink-text-dim">
                  {d.score}👁
                </div>
                <div className="font-mono text-[11px] font-bold text-wink-pink">
                  ${d.stake}
                </div>
                {isOwn && onCancelDuel && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancelDuel(d); }}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-wink-border text-wink-text-dim transition-colors hover:border-red-400/40 hover:text-red-400"
                    title="Cancel duel"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Duels pagination */}
        {duelsTotalPages > 1 && (
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => setDuelsPage((p) => Math.max(0, p - 1))}
              disabled={duelsPage === 0}
              className="rounded px-2 py-0.5 text-[10px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="text-[9px] text-wink-text-dim">
              {duelsPage + 1} / {duelsTotalPages}
            </span>
            <button
              onClick={() => setDuelsPage((p) => Math.min(duelsTotalPages - 1, p + 1))}
              disabled={duelsPage >= duelsTotalPages - 1}
              className="rounded px-2 py-0.5 text-[10px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Box 3: History (collapsible) */}
      {history.length > 0 && (
        <div className="rounded-xl bg-card">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex w-full items-center justify-between p-3.5"
          >
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-wink-text-dim">
              My History
              <span className="ml-1.5 text-wink-text-dim/60">({history.length})</span>
            </h2>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-wink-text-dim transition-transform duration-200",
                historyOpen && "rotate-180"
              )}
            />
          </button>

          {historyOpen && (
            <div className="px-3.5 pb-3.5">
              {/* Filters */}
              <div className="mb-2 flex gap-1">
                {(["all", "won", "lost"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setHistoryFilter(f); setHistoryPage(0); }}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[9px] font-semibold transition-all",
                      historyFilter === f
                        ? f === "won"
                          ? "bg-wink-pink/[0.1] text-wink-pink"
                          : f === "lost"
                            ? "bg-white/[0.06] text-wink-text-dim"
                            : "bg-white/[0.1] text-wink-text"
                        : "text-wink-text-dim hover:text-wink-text"
                    )}
                  >
                    {f === "all" ? "All" : f === "won" ? "Won" : "Lost"}
                  </button>
                ))}
              </div>

              {/* History items */}
              <div className="flex flex-col gap-1">
                {paginatedHistory.map((h) => {
                  const isCreator =
                    currentAddress &&
                    h.creatorFull.toLowerCase() === currentAddress.toLowerCase();
                  const myScore = isCreator ? h.creatorScore : h.challengerScore;
                  const theirScore = isCreator ? h.challengerScore : h.creatorScore;
                  const opponent = isCreator ? h.challenger : h.creator;

                  return (
                    <div
                      key={String(h.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3 py-2.5",
                        h.status === DuelStatus.Cancelled
                          ? "opacity-40"
                          : h.won === true
                            ? "bg-wink-pink/[0.04]"
                            : ""
                      )}
                    >
                      <div className="flex-1">
                        <div className="font-mono text-[10px] text-wink-text">
                          vs {opponent || "—"}
                        </div>
                        <div className="text-[9px] text-wink-text-dim">
                          {h.status === DuelStatus.Cancelled ? "Cancelled" : `${myScore} - ${theirScore}`}
                        </div>
                      </div>
                      <div className="font-mono text-[11px] font-bold text-wink-text">
                        ${h.stake}
                      </div>
                      {h.status === DuelStatus.Settled && (
                        <div
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[9px] font-bold",
                            h.won === true
                              ? "bg-wink-pink/10 text-wink-pink"
                              : h.won === false
                                ? "bg-white/[0.04] text-wink-text-dim"
                                : "bg-white/[0.04] text-wink-text-dim"
                          )}
                        >
                          {h.won === true ? "WON" : h.won === false ? "LOST" : "DRAW"}
                        </div>
                      )}
                      {h.status === DuelStatus.Cancelled && (
                        <div className="rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-white/[0.04] text-wink-text-dim">
                          CANCELLED
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={historyPage === 0}
                    className="rounded px-2 py-0.5 text-[10px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="text-[9px] text-wink-text-dim">
                    {historyPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={historyPage >= totalPages - 1}
                    className="rounded px-2 py-0.5 text-[10px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
