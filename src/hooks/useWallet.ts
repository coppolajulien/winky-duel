"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createPublicClient, createWalletClient, custom, http, formatUnits } from "viem";
import { megaethTestnet } from "viem/chains";
import { MOCK_USDM_ADDRESS, ERC20_ABI } from "@/lib/constants";

// Shared public client for read-only calls (exported for other hooks)
export const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
});

export function useWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const [usdmBalance, setUsdmBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // First wallet (only EVM chains configured)
  const wallet = wallets[0] ?? null;
  const address = wallet?.address ?? null;

  // Abbreviated: "0x7aB3...c92F"
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  // Create a wallet client for write operations (lazy, on-demand)
  const getWalletClient = useCallback(async () => {
    if (!wallet) throw new Error("Wallet not connected");
    if (!address) throw new Error("No address available");

    // Ensure wallet is on the correct chain
    await wallet.switchChain(megaethTestnet.id);

    const provider = await wallet.getEthereumProvider();
    return createWalletClient({
      account: address as `0x${string}`,
      chain: megaethTestnet,
      transport: custom(provider),
    });
  }, [wallet, address]);

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
        abi: ERC20_ABI,
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
    getWalletClient,
  };
}
