"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Copy, Check, ArrowUpRight, Trophy, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { X_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import type { Duel, HistoryDuel } from "@/lib/types";
import { DuelsList } from "./DuelsList";
import { MegaName } from "./MegaName";
import { isMuted, setMuted } from "@/hooks/useSounds";

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
  onCancelDuel?: (duel: Duel) => void;
  onClaimAbandoned?: (duelId: bigint) => void;
  duels: Duel[];
  history: HistoryDuel[];
  duelsLoading: boolean;
  currentAddress: `0x${string}` | null;
  onOpenSend?: () => void;
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  disabled?: boolean;
}

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
  onCancelDuel,
  onClaimAbandoned,
  duels,
  history,
  duelsLoading,
  currentAddress,
  onOpenSend,
  isPrivate,
  setIsPrivate,
  disabled,
}: SidebarProps) {
  const [copied, setCopied] = useState(false);
  const [muted, setMutedState] = useState(isMuted);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  }, [muted]);

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
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-wink-border bg-sidebar md:w-[300px] md:min-w-[300px]">
      {/* Header */}
      <div className="border-b border-wink-border px-5 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span
              className="inline-block h-11 w-11"
              style={{
                WebkitMaskImage: "url(/logo-blinkit.svg)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskImage: "url(/logo-blinkit.svg)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                backgroundColor: "var(--wink-text)",
              }}
            />
            <span className="text-lg font-bold tracking-wide text-wink-text">BLINKIT</span>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (authenticated ? logout() : login())}
            disabled={!ready}
            className={cn(
              "h-7 rounded-full px-3 text-[10px] font-semibold",
              authenticated
                ? "border-wink-pink/20 bg-wink-pink/[0.06] text-wink-pink"
                : "border-wink-border bg-card text-wink-text"
            )}
          >
            {authenticated ? (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-wink-pink" />
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

        {/* Wallet row */}
        {authenticated && shortAddress && (
          <div className="mt-2.5 flex items-center justify-between">
            <button
              onClick={copyAddress}
              className="flex items-center gap-1 text-[10px] text-wink-text-dim transition-colors hover:text-wink-text"
            >
              <span>My wallet</span>
              <span className="font-mono text-[9px]">
                {address ? <MegaName address={address} fallback={shortAddress!} /> : shortAddress}
              </span>
              {copied ? (
                <Check className="h-3 w-3 text-wink-pink" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
            <button
              onClick={onOpenSend}
              className="flex items-center gap-1 text-[10px] font-semibold text-wink-pink transition-colors hover:text-wink-pink/80"
              title="Withdraw USDM"
            >
              <ArrowUpRight className="h-3 w-3" />
              Withdraw
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <DuelsList
          stake={stake}
          setStake={setStake}
          stakeFilter={stakeFilter}
          setStakeFilter={setStakeFilter}
          duels={filtered}
          history={history}
          onLaunch={onLaunch}
          onCancelDuel={onCancelDuel}
          onClaimAbandoned={onClaimAbandoned}
          authenticated={authenticated}
          login={login}
          duelsLoading={duelsLoading}
          currentAddress={currentAddress}
          isPrivate={isPrivate}
          setIsPrivate={setIsPrivate}
          disabled={disabled}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-wink-border px-5 py-3">
        <Link
          href="/leaderboard"
          className="flex items-center gap-2 text-[10px] font-semibold text-wink-text-dim transition-colors hover:text-wink-pink"
        >
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wink-text-dim transition-colors hover:text-wink-text"
            title="Follow us on X"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <button
            onClick={toggleMute}
            className="flex items-center gap-1.5 text-[10px] text-wink-text-dim transition-colors hover:text-wink-text"
            title={muted ? "Unmute sounds" : "Mute sounds"}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
