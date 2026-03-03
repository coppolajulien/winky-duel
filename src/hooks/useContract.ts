"use client";

import { useCallback } from "react";
import { parseUnits } from "viem";
import { publicClient, useWallet } from "@/hooks/useWallet";
import {
  WINKY_DUEL_ADDRESS,
  MOCK_USDM_ADDRESS,
  WINKY_DUEL_ABI,
  ERC20_ABI,
} from "@/lib/constants";

// MegaETH has ~60K intrinsic gas — explicit limits to avoid estimation issues
const GAS_LIMITS = {
  approve: 150_000n,
  createDuel: 300_000n,
  challengeDuel: 400_000n,
  cancelDuel: 250_000n,
  recordBlink: 150_000n,
} as const;

export function useContract() {
  const { getWalletClient, address } = useWallet();

  /** Check current USDM allowance for WinkyDuel contract */
  const checkAllowance = useCallback(async (): Promise<bigint> => {
    if (!address) return 0n;
    return publicClient.readContract({
      address: MOCK_USDM_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address as `0x${string}`, WINKY_DUEL_ADDRESS],
    });
  }, [address]);

  /** Approve USDM spending. Returns TX hash. Waits for confirmation. */
  const approveUSDM = useCallback(
    async (amount: bigint): Promise<`0x${string}`> => {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: MOCK_USDM_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [WINKY_DUEL_ADDRESS, amount],
        gas: GAS_LIMITS.approve,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    [getWalletClient]
  );

  /** Ensure USDM allowance is sufficient, approve if needed */
  const ensureAllowance = useCallback(
    async (amount: bigint): Promise<`0x${string}` | null> => {
      const allowance = await checkAllowance();
      if (allowance < amount) {
        return approveUSDM(amount);
      }
      return null;
    },
    [checkAllowance, approveUSDM]
  );

  /** Create a duel on-chain. Returns TX hash. */
  const createDuel = useCallback(
    async (score: number, stakeUsdm: number): Promise<`0x${string}`> => {
      const amount = parseUnits(String(stakeUsdm), 18);
      await ensureAllowance(amount);

      const wc = await getWalletClient();
      return wc.writeContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "createDuel",
        args: [score, amount],
        gas: GAS_LIMITS.createDuel,
      });
    },
    [getWalletClient, ensureAllowance]
  );

  /** Challenge an existing duel. Returns TX hash. */
  const challengeDuel = useCallback(
    async (duelId: bigint, score: number, stakeRaw: bigint): Promise<`0x${string}`> => {
      await ensureAllowance(stakeRaw);

      const wc = await getWalletClient();
      return wc.writeContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "challengeDuel",
        args: [duelId, score],
        gas: GAS_LIMITS.challengeDuel,
      });
    },
    [getWalletClient, ensureAllowance]
  );

  /** Cancel an open duel (creator only). Returns TX hash. */
  const cancelDuel = useCallback(
    async (duelId: bigint): Promise<`0x${string}`> => {
      const wc = await getWalletClient();
      return wc.writeContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "cancelDuel",
        args: [duelId],
        gas: GAS_LIMITS.cancelDuel,
      });
    },
    [getWalletClient]
  );

  /** Record a blink event (fire-and-forget, event-only). Returns TX hash. */
  const recordBlink = useCallback(
    async (duelId: bigint): Promise<`0x${string}`> => {
      const wc = await getWalletClient();
      return wc.writeContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "recordBlink",
        args: [duelId],
        gas: GAS_LIMITS.recordBlink,
      });
    },
    [getWalletClient]
  );

  /** Read nextDuelId from contract */
  const getNextDuelId = useCallback(async (): Promise<bigint> => {
    return publicClient.readContract({
      address: WINKY_DUEL_ADDRESS,
      abi: WINKY_DUEL_ABI,
      functionName: "nextDuelId",
    });
  }, []);

  return {
    checkAllowance,
    approveUSDM,
    ensureAllowance,
    createDuel,
    challengeDuel,
    cancelDuel,
    recordBlink,
    getNextDuelId,
  };
}
