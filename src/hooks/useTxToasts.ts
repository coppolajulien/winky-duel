"use client";

import { useState, useCallback, useRef } from "react";
import type { TxToastData } from "@/lib/types";

export function useTxToasts() {
  const [txToasts, setTxToasts] = useState<TxToastData[]>([]);
  const txIdRef = useRef(0);

  const addTx = useCallback(() => {
    txIdRef.current++;
    const id = txIdRef.current;
    const hash =
      "0x" +
      Math.random().toString(16).slice(2, 6) +
      "..." +
      Math.random().toString(16).slice(2, 6);

    // Add pending
    setTxToasts((prev) =>
      [{ id, hash, status: "pending" as const }, ...prev].slice(0, 6)
    );

    // Confirm after delay
    setTimeout(() => {
      setTxToasts((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "confirmed" as const } : t
        )
      );
    }, 200 + Math.random() * 300);
  }, []);

  const removeTx = useCallback((id: number) => {
    setTxToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetToasts = useCallback(() => {
    setTxToasts([]);
    txIdRef.current = 0;
  }, []);

  return { txToasts, addTx, removeTx, resetToasts };
}
