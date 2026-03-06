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
          ? "bg-wink-pink text-white"
          : failed
            ? "bg-red-500/10 text-red-400"
            : "bg-card text-wink-text-dim"
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
