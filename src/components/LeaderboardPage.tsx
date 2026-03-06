"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Leaderboard } from "./Leaderboard";

export default function LeaderboardPage() {
  const { entries, loading } = useLeaderboard();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-wink-bg font-sans text-wink-text">
      {/* Header */}
      <header className="border-b border-wink-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/play"
            className="flex items-center gap-2 text-[11px] font-semibold text-wink-text-dim transition-colors hover:text-wink-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to game
          </Link>
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span
              className="inline-block h-8 w-8"
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
            <span className="text-sm font-bold tracking-wide text-wink-text">BLINKIT</span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <Leaderboard entries={entries} loading={loading} />
        </div>
      </main>
    </div>
  );
}
