"use client";

import { useMemo } from "react";
import type { Duel } from "@/lib/types";

const DESKTOP_SLIDES = [
  "/desktop-bg.jpg",
  "/desktop-bg-1.jpg",
  "/desktop-bg-2.jpg",
  "/desktop-bg-3.jpg",
  "/desktop-bg-4.jpg",
  "/desktop-bg-5.jpg",
];

/** Deterministic shuffle based on a simple seed */
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 16807 + 0) % 2147483647;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PhaseIdleProps {
  duels: Duel[];
  authenticated: boolean;
  onLaunch: (duel: Duel) => void;
  onCreate: () => void;
}

export function PhaseIdle({ duels, authenticated, onLaunch, onCreate }: PhaseIdleProps) {
  // Pick up to 3 random duels $25+ with random images
  const featuredDuels = useMemo(() => {
    const big = duels.filter((d) => d.stake >= 25);
    const shuffled = shuffle(big, Date.now());
    const imgs = shuffle(DESKTOP_SLIDES, Date.now() + 1);
    return shuffled.slice(0, 3).map((d, i) => ({
      ...d,
      img: imgs[i % imgs.length],
    }));
  }, [duels]);

  return (
    <div className="flex flex-1 animate-[fade-in_0.5s_ease] flex-col items-center overflow-y-auto px-8 pt-10">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-4xl font-extrabold uppercase text-wink-text">
          Bet. Blink.
          <br />
          Win the pool.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-wink-text-dim">
          Stake USDM. Face your opp. Most blinks takes it all.
        </p>
      </div>

      {/* Featured battle cards */}
      {featuredDuels.length > 0 && (
        <div className="mt-10 w-full max-w-3xl">
          <div className="grid grid-cols-3 gap-4">
            {featuredDuels.map((d) => (
              <div
                key={String(d.id)}
                onClick={() => authenticated && onLaunch(d)}
                className={`group relative aspect-[4/3] overflow-hidden rounded-2xl ${
                  authenticated
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <img
                  src={d.img}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-lg font-bold leading-tight text-white">
                    Beat <span className="text-wink-pink">{d.score}</span> blinks.
                    <br />
                    Take <span className="text-wink-pink">${d.stake}</span>.
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-white/40">
                    {d.creator}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {authenticated && (
        <button
          onClick={onCreate}
          className="mt-10 rounded-full border border-wink-pink/40 px-6 py-2.5 text-sm font-semibold uppercase text-wink-pink transition-all hover:bg-wink-pink/10"
        >
          CREATE A DUEL →
        </button>
      )}
    </div>
  );
}
