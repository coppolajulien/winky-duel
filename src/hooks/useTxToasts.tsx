"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { publicClient } from "@/hooks/useWallet";
import { BLOCK_EXPLORER_URL } from "@/lib/constants";

export function useTxToasts() {
  /** Add a TX toast that watches for confirmation */
  const addTx = useCallback((hash: `0x${string}`, label?: string) => {
    const shortHash =
      hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;

    const explorerLink = `${BLOCK_EXPLORER_URL}/tx/${hash}`;

    // Show loading toast — returns id for later update
    const toastId = toast.loading(`${label ?? "Sending"}...`);

    // Watch for confirmation
    publicClient
      .waitForTransactionReceipt({ hash, timeout: 30_000 })
      .then((receipt) => {
        if (receipt.status === "success") {
          toast.success(
            <span className="flex items-center gap-2 font-mono text-[13px]">
              <span className="font-semibold">{label ?? "Confirmed"}</span>
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wink-text-dim hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                #{shortHash}
              </a>
            </span>,
            { id: toastId, duration: 3000 }
          );
        } else {
          toast.error(
            <span className="flex items-center gap-2 font-mono text-[13px]">
              <span className="font-semibold">
                Failed{label ? ` · ${label}` : ""}
              </span>
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wink-text-dim hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                #{shortHash}
              </a>
            </span>,
            { id: toastId, duration: 5000 }
          );
        }
      })
      .catch(() => {
        toast.error(`Failed${label ? ` · ${label}` : ""}`, {
          id: toastId,
          duration: 5000,
        });
      });

    return toastId;
  }, []);

  const resetToasts = useCallback(() => {
    toast.dismiss();
  }, []);

  return { addTx, resetToasts };
}
