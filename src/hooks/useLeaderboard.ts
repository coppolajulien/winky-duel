"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";
import { publicClient } from "@/hooks/useWallet";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";
import type { LeaderboardEntry, DuelStatus } from "@/lib/types";

const RAKE_BPS = 500; // 5%
const MAX_DUELS = 200; // cap for performance

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface WinnerStats {
  wins: number;
  totalEarnings: number; // in USDM (human-readable)
  totalBlinks: number;
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // 1. Get total duel count
      const nextId = (await publicClient.readContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "nextDuelId",
      })) as bigint;

      const total = Number(nextId);
      if (total === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      // 2. Fetch all duels via multicall (cap at MAX_DUELS)
      const start = Math.max(0, total - MAX_DUELS);
      const ids: bigint[] = [];
      for (let i = start; i < total; i++) {
        ids.push(BigInt(i));
      }

      const results = await publicClient.multicall({
        contracts: ids.map((id) => ({
          address: WINKY_DUEL_ADDRESS as `0x${string}`,
          abi: WINKY_DUEL_ABI,
          functionName: "getDuel" as const,
          args: [id] as const,
        })),
      });

      // 3. Aggregate by winner
      const stats = new Map<string, WinnerStats>();

      for (const r of results) {
        if (r.status !== "success" || !r.result) continue;

        const raw = r.result as {
          creator: `0x${string}`;
          challenger: `0x${string}`;
          stake: bigint;
          creatorScore: number;
          challengerScore: number;
          status: number;
        };

        // Only settled duels
        if (Number(raw.status) !== 1) continue;

        const cScore = Number(raw.creatorScore);
        const chScore = Number(raw.challengerScore);

        // Draw = no winner
        if (cScore === chScore) continue;

        const winner = cScore > chScore ? raw.creator : raw.challenger;
        const winnerScore = cScore > chScore ? cScore : chScore;
        const stakeNum = parseFloat(formatUnits(raw.stake, 18));
        const payout = stakeNum * 2 * (1 - RAKE_BPS / 10_000); // 95% of pot

        const addr = winner.toLowerCase();
        const existing = stats.get(addr) || { wins: 0, totalEarnings: 0, totalBlinks: 0 };
        existing.wins += 1;
        existing.totalEarnings += payout;
        existing.totalBlinks += winnerScore;
        stats.set(addr, existing);
      }

      // 4. Sort by earnings desc
      const sorted = Array.from(stats.entries())
        .sort((a, b) => b[1].totalEarnings - a[1].totalEarnings);

      const leaderboard: LeaderboardEntry[] = sorted.map(([addr, s], i) => ({
        r: i + 1,
        addr: shortAddr(addr),
        addrFull: addr,
        blinks: s.totalBlinks,
        wins: s.wins,
        earn: Math.round(s.totalEarnings * 100) / 100, // 2 decimal places
      }));

      setEntries(leaderboard);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, loading, refetch: fetchLeaderboard };
}
