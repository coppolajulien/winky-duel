"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Duel } from "@/lib/types";
import { DuelsList } from "./DuelsList";
import { Leaderboard } from "./Leaderboard";

interface SidebarProps {
  stake: number;
  setStake: (s: number) => void;
  stakeFilter: number | null;
  setStakeFilter: (s: number | null) => void;
  authenticated: boolean;
  ready: boolean;
  login: () => void;
  logout: () => Promise<void>;
  shortAddress: string | null;
  address: string | null;
  usdmBalance: string | null;
  balanceLoading: boolean;
  onLaunch: (duel: Duel | null) => void;
  duels: Duel[];
  duelsLoading: boolean;
  currentAddress: `0x${string}` | null;
  onCancel?: (duel: Duel) => void;
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
  authenticated,
  ready,
  login,
  logout,
  shortAddress,
  address,
  usdmBalance,
  balanceLoading,
  onLaunch,
  duels,
  duelsLoading,
  currentAddress,
  onCancel,
}: SidebarProps) {
  const [tab, setTab] = useState<"duels" | "leaderboard">("duels");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  const copyAddress = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [address]);

  const filtered = stakeFilter
    ? duels.filter((d) => d.stake === stakeFilter)
    : duels;

  return (
    <div className="flex w-[300px] min-w-[300px] flex-col border-r border-wink-border bg-sidebar backdrop-blur-[20px]">
      {/* Header */}
      <div className="border-b border-wink-border px-4 py-3.5">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="text-lg">👁️</span>
            <span className="text-[15px] font-extrabold italic text-wink-pink">
              winky
            </span>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (authenticated ? logout() : login())}
            disabled={!ready}
            className={cn(
              "h-7 rounded-2xl px-3 text-[10px] font-semibold",
              authenticated
                ? "border-wink-cyan/20 bg-wink-cyan/[0.06] text-wink-cyan"
                : "border-wink-border bg-card text-wink-text"
            )}
          >
            {authenticated ? (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-wink-cyan" />
                {balanceLoading
                  ? "..."
                  : usdmBalance !== null
                    ? `$${usdmBalance}`
                    : shortAddress}
              </span>
            ) : (
              "Connect"
            )}
          </Button>
        </div>

        {/* Wallet address with copy button */}
        {authenticated && shortAddress && (
          <button
            onClick={copyAddress}
            className="mt-2 flex w-full items-center justify-between rounded-lg bg-wink-cyan/[0.04] px-3 py-1.5 transition-colors hover:bg-wink-cyan/[0.08]"
          >
            <span className="font-mono text-[11px] text-wink-text-dim">
              <span className="text-[9px] text-wink-text-dim/60">My wallet: </span>{shortAddress}
            </span>
            <span className="flex items-center gap-1 text-[9px] text-wink-text-dim">
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-wink-cyan" />
                  <span className="text-wink-cyan">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </span>
          </button>
        )}
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
            authenticated={authenticated}
            duelsLoading={duelsLoading}
            currentAddress={currentAddress}
            onCancel={onCancel}
          />
        ) : (
          <Leaderboard />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between border-t border-wink-border px-3 py-2 text-[9px] text-wink-text-dim">
        {mounted ? (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-md p-1 text-wink-text-dim transition-colors hover:text-wink-text"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="h-3.5 w-3.5" />
        )}
        <span className="flex items-center gap-1">
          <img src="/megaeth-icon.svg" alt="MegaETH" className="h-3 w-3 dark:invert" />
          MegaETH Testnet
        </span>
      </div>
    </div>
  );
}
