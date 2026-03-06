"use client";

import { ArrowLeft } from "lucide-react";

interface MobileGameHeaderProps {
  usdmBalance: string | null;
  onBack: () => void;
}

export function MobileGameHeader({ usdmBalance, onBack }: MobileGameHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-wink-border bg-sidebar/80 px-3 py-2 backdrop-blur-[10px] md:hidden">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[11px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <a href="/" className="flex items-center gap-1.5">
        <span
          className="inline-block h-4 w-4"
          style={{
            WebkitMaskImage: "url(/logo-blinkit.svg)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskImage: "url(/logo-blinkit.svg)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            backgroundColor: "var(--wink-text)",
          }}
        />
        <span className="text-xs font-bold tracking-wide text-wink-text">BLINKIT</span>
      </a>
      <div className="text-[10px] font-mono font-semibold text-wink-cyan">
        {usdmBalance !== null ? `$${usdmBalance}` : ""}
      </div>
    </div>
  );
}
