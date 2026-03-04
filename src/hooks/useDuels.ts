"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";
import { publicClient } from "@/hooks/useWallet";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";
import type { Duel, HistoryDuel, OnChainDuel, DuelStatus } from "@/lib/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Convert raw on-chain duel to UI-friendly open-duel format */
function formatDuel(raw: OnChainDuel): Duel {
  return {
    id: raw.id,
    creator: shortAddr(raw.creator),
    creatorFull: raw.creator,
    stake: parseFloat(formatUnits(raw.stake, 18)),
    stakeRaw: raw.stake,
    score: raw.creatorScore,
    time: "Open",
  };
}

/** Convert raw on-chain duel to history format */
function formatHistory(raw: OnChainDuel, currentAddress: string | null): HistoryDuel {
  const isCreator = currentAddress && raw.creator.toLowerCase() === currentAddress.toLowerCase();
  const isChallenger = currentAddress && raw.challenger.toLowerCase() === currentAddress.toLowerCase();

  let won: boolean | null = null;
  if (raw.status === 1 && (isCreator || isChallenger)) {
    // Settled
    if (raw.creatorScore > raw.challengerScore) {
      won = !!isCreator;
    } else if (raw.challengerScore > raw.creatorScore) {
      won = !!isChallenger;
    }
    // draw = null
  }

  return {
    id: raw.id,
    creator: shortAddr(raw.creator),
    creatorFull: raw.creator,
    challenger: raw.challenger === ZERO_ADDRESS ? "" : shortAddr(raw.challenger),
    challengerFull: raw.challenger as `0x${string}`,
    stake: parseFloat(formatUnits(raw.stake, 18)),
    creatorScore: raw.creatorScore,
    challengerScore: raw.challengerScore,
    status: raw.status,
    won,
  };
}

export function useDuels(currentAddress?: string | null) {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [history, setHistory] = useState<HistoryDuel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDuels = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get nextDuelId to know how many duels exist
      const [openIds, nextId] = await Promise.all([
        publicClient.readContract({
          address: WINKY_DUEL_ADDRESS,
          abi: WINKY_DUEL_ABI,
          functionName: "getOpenDuels",
        }) as Promise<bigint[]>,
        publicClient.readContract({
          address: WINKY_DUEL_ADDRESS,
          abi: WINKY_DUEL_ABI,
          functionName: "nextDuelId",
        }) as Promise<bigint>,
      ]);

      const total = Number(nextId);
      if (total === 0) {
        setDuels([]);
        setHistory([]);
        return;
      }

      // 2. Build list of ALL duel IDs (cap at last 50 for perf)
      const start = Math.max(0, total - 50);
      const allIds: bigint[] = [];
      for (let i = start; i < total; i++) {
        allIds.push(BigInt(i));
      }

      // 3. Fetch all duels via multicall
      const results = await publicClient.multicall({
        contracts: allIds.map((id) => ({
          address: WINKY_DUEL_ADDRESS as `0x${string}`,
          abi: WINKY_DUEL_ABI,
          functionName: "getDuel" as const,
          args: [id] as const,
        })),
      });

      const openDuels: Duel[] = [];
      const historyDuels: HistoryDuel[] = [];

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status !== "success" || !r.result) continue;

        const raw = r.result as {
          creator: `0x${string}`;
          challenger: `0x${string}`;
          stake: bigint;
          creatorScore: number;
          challengerScore: number;
          status: number;
        };
        const onChain: OnChainDuel = {
          id: allIds[i],
          creator: raw.creator,
          challenger: raw.challenger,
          stake: raw.stake,
          creatorScore: Number(raw.creatorScore),
          challengerScore: Number(raw.challengerScore),
          status: Number(raw.status) as DuelStatus,
        };

        if (onChain.status === 0) {
          openDuels.push(formatDuel(onChain));
        } else {
          // Only show duels involving current user in history
          const addr = currentAddress?.toLowerCase();
          if (addr && (onChain.creator.toLowerCase() === addr || onChain.challenger.toLowerCase() === addr)) {
            historyDuels.push(formatHistory(onChain, currentAddress ?? null));
          }
        }
      }

      setDuels(openDuels);
      setHistory(historyDuels.reverse()); // newest first
    } catch (err) {
      console.error("Failed to fetch duels:", err);
    } finally {
      setLoading(false);
    }
  }, [currentAddress]);

  useEffect(() => { fetchDuels(); }, [fetchDuels]);
  useEffect(() => {
    const iv = setInterval(fetchDuels, 10_000);
    return () => clearInterval(iv);
  }, [fetchDuels]);

  return { duels, history, loading, refetchDuels: fetchDuels };
}
