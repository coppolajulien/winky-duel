"use client";

import { STAKES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Duel } from "@/lib/types";

interface DuelsListProps {
  stake: number;
  setStake: (s: number) => void;
  stakeFilter: number | null;
  setStakeFilter: (s: number | null) => void;
  duels: Duel[];
  onLaunch: (duel: Duel | null) => void;
}

export function DuelsList({
  stake,
  setStake,
  stakeFilter,
  setStakeFilter,
  duels,
  onLaunch,
}: DuelsListProps) {
  return (
    <div className="animate-[fade-in_0.3s_ease] flex flex-col gap-2">
      {/* Box 1: New Duel */}
      <div className="rounded-lg border border-wink-border bg-white/[0.02] p-3">
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
          className="w-full bg-gradient-to-br from-wink-pink to-[#cc2070] text-[11px] font-bold text-white hover:brightness-110"
          size="sm"
        >
          ⚡ Create & Play
        </Button>
      </div>

      {/* Box 2: Engage in a battle */}
      <div className="rounded-lg border border-wink-border bg-white/[0.02] p-3">
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
          {duels.map((d) => (
            <div
              key={d.id}
              onClick={() => onLaunch(d)}
              className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-wink-border bg-white/[0.02] px-2.5 py-2 transition-all hover:border-wink-pink/30"
            >
              <div className="flex-1">
                <div className="font-mono text-[10px] text-wink-text">
                  {d.creator}
                </div>
                <div className="text-[9px] text-wink-text-dim">{d.time} ago</div>
              </div>
              <div className="rounded-[5px] bg-wink-orange/[0.08] px-1.5 py-0.5 font-mono text-xs font-bold text-wink-orange">
                {d.score}👁️
              </div>
              <div className="font-mono text-[11px] font-bold text-wink-pink">
                ${d.stake}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
