"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDuels } from "@/hooks/useDuels";
import { useWallet } from "@/hooks/useWallet";
import { netWin, RAKE_BPS, STAKES, DESKTOP_SLIDES } from "@/lib/constants";

export default function DuelsPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { duels, loading } = useDuels(wallet.address);
  const [stakeFilter, setStakeFilter] = useState<number | null>(null);

  // Exclude own duels + apply stake filter
  const filteredDuels = useMemo(() => {
    let list = duels;
    if (wallet.address) {
      list = list.filter(
        (d) => d.creatorFull.toLowerCase() !== wallet.address!.toLowerCase()
      );
    }
    if (stakeFilter !== null) {
      list = list.filter((d) => d.stake === stakeFilter);
    }
    // Sort by stake descending, then by ID descending
    return [...list].sort((a, b) => b.stake - a.stake || Number(b.id - a.id));
  }, [duels, wallet.address, stakeFilter]);

  return (
    <div className="min-h-[100dvh] bg-wink-bg font-sans text-foreground">
      {/* Header */}
      <header className="flex flex-col items-center gap-4 px-6 pt-8 pb-2">
        <Link href="/play" className="absolute left-6 top-8 text-sm text-wink-text-dim transition-colors hover:text-wink-pink">
          ← Back
        </Link>
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block h-[40px] w-[40px]"
            style={{
              WebkitMaskImage: "url(/logo-blinkit.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/logo-blinkit.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              backgroundColor: "white",
            }}
          />
          <span className="text-xl font-bold tracking-wide text-white">BLINKIT</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Enter a duel</h1>
      </header>

      {/* Stake filters */}
      <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2 px-6">
        <button
          onClick={() => setStakeFilter(null)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            stakeFilter === null
              ? "bg-wink-pink text-white"
              : "bg-card text-wink-text-dim hover:text-wink-text"
          }`}
        >
          All
        </button>
        {STAKES.map((s) => (
          <button
            key={s}
            onClick={() => setStakeFilter(stakeFilter === s ? null : s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              stakeFilter === s
                ? "bg-wink-pink text-white"
                : "bg-card text-wink-text-dim hover:text-wink-text"
            }`}
          >
            ${s}
          </button>
        ))}
      </div>

      {/* Duels grid */}
      <div className="mx-auto mt-8 max-w-4xl px-6 pb-12">
        {loading && filteredDuels.length === 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : filteredDuels.length === 0 ? (
          <div className="py-20 text-center text-sm text-wink-text-dim">
            {stakeFilter !== null
              ? `No open duels at $${stakeFilter}. Try another amount.`
              : "No open duels right now. Create one!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDuels.map((d) => (
              <div
                key={String(d.id)}
                onClick={() => router.push(`/play?join=${d.id}`)}
                className="group flex cursor-pointer flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <img
                    src={DESKTOP_SLIDES[Number(d.id) % DESKTOP_SLIDES.length]}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <p className="text-lg font-bold leading-tight text-white">
                      Beat <span className="text-wink-pink">{d.score}</span> blinks.
                      <br />
                      Win <span className="text-wink-pink">${netWin(d.stake)}</span>.
                    </p>
                    <p className="mt-0.5 text-[8px] text-white/30">
                      {RAKE_BPS / 100}% fee included
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-white/40">
                      {d.creator}
                    </p>
                  </div>
                  {/* Stake badge */}
                  <div className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-wink-pink backdrop-blur-sm">
                    ${d.stake}
                  </div>
                </div>
                <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wider text-wink-text-dim transition-colors group-hover:text-wink-pink">
                  Enter the Battle →
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
