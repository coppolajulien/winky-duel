"use client";

import { useState, useEffect } from "react";
import type { TxToastData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BLOCK_EXPLORER_URL } from "@/lib/constants";

interface TxToastProps {
  tx: TxToastData;
  onDone?: (id: number) => void;
}

export function TxToast({ tx, onDone }: TxToastProps) {
  const [show, setShow] = useState(true);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
    const t = setTimeout(() => {
      setVis(false);
      setTimeout(() => {
        setShow(false);
        onDone?.(tx.id);
      }, 300);
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  const confirmed = tx.status === "confirmed";
  const failed = tx.status === "failed";
  const pending = tx.status === "pending";
  const shortHash = tx.hash.length > 12
    ? `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`
    : tx.hash;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-full px-4 py-2.5 font-mono text-[13px] font-semibold whitespace-nowrap transition-all duration-300",
        confirmed
          ? "bg-gradient-to-br from-[var(--toast-confirmed-from)] to-wink-pink text-white shadow-[0_4px_20px_var(--glow-pink)]"
          : failed
            ? "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            : "border border-wink-border bg-[var(--toast-pending-bg)] text-wink-text-dim shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-[16px]"
      )}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis
          ? "translateY(0) scale(1)"
          : "translateY(-8px) scale(0.95)",
      }}
    >
      {confirmed ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[11px]">
          ✓
        </span>
      ) : failed ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/25 text-[11px]">
          ✕
        </span>
      ) : (
        <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-wink-text-dim border-t-wink-text" />
      )}
      <span>
        {failed
          ? `Failed${tx.label ? ` · ${tx.label}` : ""}`
          : confirmed
            ? `${tx.label ?? "Confirmed"}`
            : `${tx.label ?? "Sending"}...`}
        {!pending && (
          <a
            href={`${BLOCK_EXPLORER_URL}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 opacity-70 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            #{shortHash}
          </a>
        )}
      </span>
    </div>
  );
}
