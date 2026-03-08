"use client";

import { useAccount, useDisconnect, useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { megaethTestnet } from "viem/chains";
import { MOCK_USDM_ADDRESS, ERC20_ABI } from "@/lib/constants";

// Shared public client for read-only calls (exported for other hooks)
export const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
});

export function useWallet() {
  const { address: rawAddress, isConnected, status } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [usdmBalance, setUsdmBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const ready = status !== "connecting" && status !== "reconnecting";
  const authenticated = isConnected;
  const address = rawAddress ?? null;
  const wrongNetwork = authenticated && chainId !== megaethTestnet.id;

  const switchToMegaETH = useCallback(() => {
    switchChain({ chainId: megaethTestnet.id });
  }, [switchChain]);

  // Abbreviated: "0x7aB3...c92F"
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const login = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const logout = useCallback(async () => {
    disconnect();
  }, [disconnect]);

  // Return the wagmi wallet client (same viem WalletClient type)
  const getWalletClient = useCallback(async () => {
    if (!walletClient) throw new Error("Wallet not connected");
    return walletClient;
  }, [walletClient]);

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
        args: [address],
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
    user: null,
    wallet: null,
    address,
    shortAddress,
    usdmBalance,
    balanceLoading,
    refreshBalance: fetchBalance,
    getWalletClient,
    wrongNetwork,
    switchToMegaETH,
  };
}
