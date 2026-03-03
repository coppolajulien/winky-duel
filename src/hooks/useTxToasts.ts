"use client";

import { useState, useCallback, useRef } from "react";
import type { TxToastData } from "@/lib/types";
import { publicClient } from "@/hooks/useWallet";

export function useTxToasts() {
  const [txToasts, setTxToasts] = useState<TxToastData[]>([]);
  const txIdRef = useRef(0);

  /** Add a real TX toast that watches for confirmation */
  const addTx = useCallback((hash: `0x${string}`, label?: string) => {
    txIdRef.current++;
    const id = txIdRef.current;

    setTxToasts((prev) =>
      [{ id, hash, status: "pending" as const, label }, ...prev].slice(0, 6)
    );

    // Watch for confirmation
    publicClient
      .waitForTransactionReceipt({ hash, timeout: 30_000 })
      .then((receipt) => {
        setTxToasts((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, status: receipt.status === "success" ? ("confirmed" as const) : ("failed" as const) }
              : t
          )
        );
      })
      .catch(() => {
        setTxToasts((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: "failed" as const } : t
          )
        );
      });

    return id;
  }, []);

  /** Fire-and-forget toast for recordBlink (event-only, fast on MegaETH) */
  const addBlinkTx = useCallback((hash: `0x${string}`) => {
    txIdRef.current++;
    const id = txIdRef.current;

    setTxToasts((prev) =>
      [{ id, hash, status: "pending" as const, label: "Blink" }, ...prev].slice(0, 6)
    );

    // Auto-confirm after short delay
    setTimeout(() => {
      setTxToasts((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "confirmed" as const } : t
        )
      );
    }, 500);

    return id;
  }, []);

  const removeTx = useCallback((id: number) => {
    setTxToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetToasts = useCallback(() => {
    setTxToasts([]);
    txIdRef.current = 0;
  }, []);

  return { txToasts, addTx, addBlinkTx, removeTx, resetToasts };
}
