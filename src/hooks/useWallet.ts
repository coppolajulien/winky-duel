"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { megaethTestnet } from "viem/chains";
import { MOCK_USDM_ADDRESS, ERC20_BALANCE_ABI } from "@/lib/constants";

// Shared public client for read-only calls
const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
});

export function useWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const [usdmBalance, setUsdmBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // First EVM wallet (embedded or external)
  const wallet = wallets.find((w) => w.chainType === "ethereum") ?? null;
  const address = wallet?.address ?? null;

  // Abbreviated: "0x7aB3...c92F"
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  // Fetch USDM balance
  const fetchBalance = useCallback(async () => {
    if (!address) {
      setUsdmBalance(null);
      return;
    }
    setBalanceLoading(true);
    try {
      const raw = await publicClient.readContract({
        address: MOCK_USDM_ADDRESS,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });
      const formatted = parseFloat(formatUnits(raw, 18)).toFixed(2);
      setUsdmBalance(formatted);
    } catch (err) {
      console.error("Failed to fetch USDM balance:", err);
      setUsdmBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (authenticated && address) {
      fetchBalance();
    } else {
      setUsdmBalance(null);
    }
  }, [authenticated, address, fetchBalance]);

  return {
    ready,
    authenticated,
    login,
    logout,
    user,
    wallet,
    address,
    shortAddress,
    usdmBalance,
    balanceLoading,
    refreshBalance: fetchBalance,
  };
}
