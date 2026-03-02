"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MOCK_DUELS } from "@/lib/mockData";
import type { Duel } from "@/lib/types";
import { DuelsList } from "./DuelsList";
import { Leaderboard } from "./Leaderboard";

interface SidebarProps {
  stake: number;
  setStake: (s: number) => void;
  stakeFilter: number | null;
  setStakeFilter: (s: number | null) => void;
  connected: boolean;
  setConnected: (c: boolean) => void;
  onLaunch: (duel: Duel | null) => void;
}

const TABS = [
  { id: "duels" as const, icon: "⚔️", label: "Duels" },
  // { id: "leaderboard" as const, icon: "🏆", label: "Leaderboard" },
];

export function Sidebar({
  stake,
  setStake,
  stakeFilter,
  setStakeFilter,
  connected,
  setConnected,
  onLaunch,
}: SidebarProps) {
  const [tab, setTab] = useState<"duels" | "leaderboard">("duels");

  const filtered = stakeFilter
    ? MOCK_DUELS.filter((d) => d.stake === stakeFilter)
    : MOCK_DUELS;

  return (
    <div className="flex w-[300px] min-w-[300px] flex-col border-r border-wink-border bg-[rgba(13,6,18,0.95)] backdrop-blur-[20px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-wink-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">👁️</span>
          <span className="text-[15px] font-extrabold italic text-wink-pink">
            winky
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConnected(!connected)}
          className={cn(
            "h-7 rounded-2xl px-3 text-[10px] font-semibold",
            connected
              ? "border-wink-cyan/20 bg-wink-cyan/[0.06] text-wink-cyan"
              : "border-wink-border bg-white/[0.02] text-wink-text"
          )}
        >
          {connected ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-wink-cyan" />
              $1,854
            </span>
          ) : (
            "Connect"
          )}
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="px-2 pt-2 pb-1">
        {TABS.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={cn(
              "mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
              tab === n.id
                ? "bg-wink-pink/[0.08] text-wink-pink"
                : "text-wink-text-dim hover:text-wink-text"
            )}
          >
            <span className="text-sm">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {tab === "duels" ? (
          <DuelsList
            stake={stake}
            setStake={setStake}
            stakeFilter={stakeFilter}
            setStakeFilter={setStakeFilter}
            duels={filtered}
            onLaunch={onLaunch}
          />
        ) : (
          <Leaderboard />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between border-t border-wink-border px-3 py-2 text-[9px] text-wink-text-dim">
        <span>⚙️</span>
        <span className="flex items-center gap-1">
          <img src="/megaeth-icon.svg" alt="MegaETH" className="h-3 w-3 invert" />
          MegaETH Testnet
        </span>
      </div>
    </div>
  );
}
