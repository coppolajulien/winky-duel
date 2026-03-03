"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";
import { publicClient } from "@/hooks/useWallet";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";
import type { Duel, OnChainDuel, DuelStatus } from "@/lib/types";

/** Convert raw on-chain duel to UI-friendly format */
function formatDuel(raw: OnChainDuel): Duel {
  const addr = raw.creator;
  return {
    id: raw.id,
    creator: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
    creatorFull: addr,
    stake: parseFloat(formatUnits(raw.stake, 18)),
    stakeRaw: raw.stake,
    score: raw.creatorScore,
    time: "Open",
  };
}

export function useDuels() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDuels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get all open duel IDs
      const openIds = (await publicClient.readContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "getOpenDuels",
      })) as bigint[];

      if (openIds.length === 0) {
        setDuels([]);
        return;
      }

      // 2. Fetch each duel's details via multicall
      const results = await publicClient.multicall({
        contracts: openIds.map((id) => ({
          address: WINKY_DUEL_ADDRESS as `0x${string}`,
          abi: WINKY_DUEL_ABI,
          functionName: "getDuel" as const,
          args: [id] as const,
        })),
      });

      // 3. Convert to UI format
      const formatted: Duel[] = [];
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "success" && r.result) {
          const raw = r.result as {
            creator: `0x${string}`;
            challenger: `0x${string}`;
            stake: bigint;
            creatorScore: number;
            challengerScore: number;
            status: number;
          };
          const onChain: OnChainDuel = {
            id: openIds[i],
            creator: raw.creator,
            challenger: raw.challenger,
            stake: raw.stake,
            creatorScore: Number(raw.creatorScore),
            challengerScore: Number(raw.challengerScore),
            status: Number(raw.status) as DuelStatus,
          };
          formatted.push(formatDuel(onChain));
        }
      }

      setDuels(formatted);
    } catch (err) {
      console.error("Failed to fetch duels:", err);
      setError("Failed to load duels");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDuels();
  }, [fetchDuels]);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchDuels, 10_000);
    return () => clearInterval(interval);
  }, [fetchDuels]);

  return { duels, loading, error, refetchDuels: fetchDuels };
}
