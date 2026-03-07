"use client";

import { useEffect, useState } from "react";
import type { ErrorBanner as ErrorBannerType } from "@/hooks/useGameLoop";

interface ErrorBannerProps {
  error: ErrorBannerType;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const isWarning = error.type === "warning";

  return (
    <div
      className="pointer-events-auto absolute left-1/2 top-6 z-50 w-full max-w-md -translate-x-1/2 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(-12px)",
      }}
    >
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
          isWarning
            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
            : "border-red-500/20 bg-red-500/10 text-red-300"
        }`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/15 text-sm">
          {isWarning ? "!" : "\u2715"}
        </span>
        <span className="flex-1 text-[13px] font-medium leading-snug">
          {error.message}
        </span>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
