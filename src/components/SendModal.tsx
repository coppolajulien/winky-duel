"use client";

import { useState, useCallback } from "react";
import { parseUnits } from "viem";
import { X, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicClient } from "@/hooks/useWallet";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  usdmBalance: string | null;
  transferUSDM: (to: `0x${string}`, amount: bigint) => Promise<`0x${string}`>;
  refreshBalance: () => Promise<void>;
}

export function SendModal({
  isOpen,
  onClose,
  usdmBalance,
  transferUSDM,
  refreshBalance,
}: SendModalProps) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    setError(null);
    setSuccess(null);

    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      setError("Invalid address");
      return;
    }

    // Validate amount
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Invalid amount");
      return;
    }

    const bal = parseFloat(usdmBalance ?? "0");
    if (num > bal) {
      setError("Insufficient balance");
      return;
    }

    setSending(true);
    try {
      const amountWei = parseUnits(amount, 18);
      const hash = await transferUSDM(toAddress as `0x${string}`, amountWei);
      await publicClient.waitForTransactionReceipt({ hash });
      setSuccess(`Sent $${amount} USDM!`);
      setAmount("");
      setToAddress("");
      refreshBalance();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      setError(msg.length > 100 ? msg.slice(0, 100) + "..." : msg);
    } finally {
      setSending(false);
    }
  }, [toAddress, amount, usdmBalance, transferUSDM, refreshBalance]);

  const handleMax = useCallback(() => {
    if (usdmBalance) setAmount(usdmBalance);
  }, [usdmBalance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[380px] rounded-2xl border border-wink-border bg-background p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">Send USDM</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-wink-text-dim transition-colors hover:text-wink-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Balance */}
        <div className="mb-4 rounded-lg bg-wink-cyan/[0.04] px-3 py-2 text-center">
          <div className="text-[10px] text-wink-text-dim">Available balance</div>
          <div className="font-mono text-lg font-bold text-wink-cyan">
            ${usdmBalance ?? "0.00"}
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-wink-text-dim">
            Recipient address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="w-full rounded-lg border border-wink-border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-wink-text-dim/40 focus:border-wink-cyan focus:outline-none"
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-wink-text-dim">
            Amount (USDM)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              className="flex-1 rounded-lg border border-wink-border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-wink-text-dim/40 focus:border-wink-cyan focus:outline-none"
            />
            <button
              onClick={handleMax}
              className="rounded-lg border border-wink-border px-3 py-2 text-[10px] font-semibold text-wink-cyan transition-colors hover:bg-wink-cyan/10"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-lg bg-wink-cyan/10 px-3 py-2 text-xs text-wink-cyan">
            {success}
          </div>
        )}

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={sending || !toAddress || !amount}
          className="w-full bg-gradient-to-br from-wink-pink to-[var(--wink-pink-darker)] text-white hover:brightness-110 disabled:opacity-50"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Send USDM
            </span>
          )}
        </Button>

        {/* Help text */}
        <p className="mt-3 text-center text-[9px] text-wink-text-dim">
          Transfer your USDM winnings to MetaMask or any EVM wallet
        </p>
      </div>
    </div>
  );
}
