"use client";

import { STAKES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DuelStatus } from "@/lib/types";
import type { Duel, HistoryDuel } from "@/lib/types";

interface DuelsListProps {
  stake: number;
  setStake: (s: number) => void;
  stakeFilter: number | null;
  setStakeFilter: (s: number | null) => void;
  duels: Duel[];
  history: HistoryDuel[];
  onLaunch: (duel: Duel | null) => void;
  authenticated: boolean;
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
  authenticated,
  duelsLoading,
  currentAddress,
}: DuelsListProps) {
  return (
    <div className="animate-[fade-in_0.3s_ease] flex flex-col gap-2">
      {/* Box 1: New Duel */}
      <div className="rounded-lg border border-wink-border bg-card p-3">
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-wink-text">
          New Duel
        </h2>
        <div className="mb-2 flex gap-1">
          {STAKES.map((s) => (
            <button
              key={s}
              onClick={() => setStake(s)}
              className={cn(
                "flex-1 rounded-md py-1.5 font-mono text-[11px] font-bold transition-all",
                stake === s
                  ? "border-[1.5px] border-wink-pink bg-wink-pink/10 text-wink-pink"
                  : "border border-wink-border bg-transparent text-wink-text-dim hover:border-wink-pink/30"
              )}
            >
              ${s}
            </button>
          ))}
        </div>
        <Button
          onClick={() => onLaunch(null)}
          disabled={!authenticated}
          className="w-full bg-gradient-to-br from-wink-pink to-[var(--wink-pink-darker)] text-[11px] font-bold text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          size="sm"
        >
          {authenticated ? "⚡ Create & Play" : "Connect to Play"}
        </Button>
      </div>

      {/* Box 2: Engage in a battle */}
      <div className="rounded-lg border border-wink-border bg-card p-3">
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-wink-text">
          Engage in a battle
        </h2>

        <div className="mb-1.5 flex gap-1">
          {([null, ...STAKES] as (number | null)[]).map((s) => (
            <button
              key={String(s)}
              onClick={() => setStakeFilter(s)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-semibold transition-all",
                s !== null && "font-mono",
                stakeFilter === s
                  ? "border border-wink-pink/25 bg-wink-pink/[0.07] text-wink-pink"
                  : "border border-transparent text-wink-text-dim hover:text-wink-text"
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

          {duels.map((d) => {
            const isOwn =
              currentAddress &&
              d.creatorFull.toLowerCase() === currentAddress.toLowerCase();
            const hasFuse = d.stake >= 50 && !isOwn;

            const card = (
              <div
                onClick={() => !isOwn && authenticated && onLaunch(d)}
                className={cn(
                  "group flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-2 transition-all",
                  hasFuse
                    ? "duel-fuse-inner"
                    : "border border-wink-border",
                  isOwn
                    ? "border-wink-cyan/20 opacity-70"
                    : authenticated
                      ? "cursor-pointer hover:border-wink-pink/30"
                      : "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex-1">
                  <div className="font-mono text-[10px] text-wink-text">
                    {isOwn ? "You" : d.creator}
                  </div>
                  <div className="text-[9px] text-wink-text-dim">{d.time}</div>
                </div>
                <div className="rounded-[5px] bg-wink-orange/[0.08] px-1.5 py-0.5 font-mono text-xs font-bold text-wink-orange">
                  {d.score}👁️
                </div>
                <div className="font-mono text-[11px] font-bold text-wink-pink">
                  ${d.stake}
                </div>
              </div>
            );

            return hasFuse ? (
              <div key={String(d.id)} className="duel-fuse">
                {card}
              </div>
            ) : (
              <div key={String(d.id)}>{card}</div>
            );
          })}
        </div>
      </div>

      {/* Box 3: History */}
      {history.length > 0 && (
        <div className="rounded-lg border border-wink-border bg-card p-3">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-wink-text">
            My History
          </h2>
          <div className="flex flex-col gap-1">
            {history.map((h) => {
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
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-2",
                    h.status === DuelStatus.Cancelled
                      ? "border-wink-border opacity-50"
                      : h.won === true
                        ? "border-wink-cyan/20 bg-wink-cyan/[0.03]"
                        : h.won === false
                          ? "border-red-500/15 bg-red-500/[0.03]"
                          : "border-wink-border"
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
                  <div className="font-mono text-[11px] font-bold text-wink-pink">
                    ${h.stake}
                  </div>
                  {h.status === DuelStatus.Settled && (
                    <div
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold",
                        h.won === true
                          ? "bg-wink-cyan/10 text-wink-cyan"
                          : h.won === false
                            ? "bg-red-500/10 text-red-400"
                            : "bg-wink-border text-wink-text-dim"
                      )}
                    >
                      {h.won === true ? "WON" : h.won === false ? "LOST" : "DRAW"}
                    </div>
                  )}
                  {h.status === DuelStatus.Cancelled && (
                    <div className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-wink-border text-wink-text-dim">
                      CANCELLED
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
