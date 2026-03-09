"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import type { Duel } from "@/lib/types";
import { netWin, RAKE_BPS, DESKTOP_SLIDES } from "@/lib/constants";

// Drop mp4 files in /public/ and add paths here
const HERO_VIDEOS: string[] = [
  "/video-blinkit-1.mp4",
  "/video-blinkit-2.mp4",
  "/video-blinkit-3.mp4",
  "/video-blinkit-4.mp4",
  "/video-blinkit-5.mp4",
  "/video-blinkit-6.mp4",
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
  loading: boolean;
  onLaunch: (duel: Duel) => void;
}

export function PhaseIdle({ duels, authenticated, loading, onLaunch }: PhaseIdleProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const heroVideo = useMemo(
    () => HERO_VIDEOS.length > 0 ? HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)] : null,
    []
  );

  // Pick up to 6 duels: prioritize $25+, fill remaining slots with cheaper ones
  // Seed is stable (based on duel IDs) so cards don't shuffle on re-renders
  const featuredDuels = useMemo(() => {
    const seed = duels.reduce((s, d) => s + Number(d.id), 0) || 1;
    const big = shuffle(duels.filter((d) => d.stake >= 25), seed);
    const small = shuffle(duels.filter((d) => d.stake < 25), seed + 2);
    const picked = [...big.slice(0, 6)];
    if (picked.length < 6) {
      picked.push(...small.slice(0, 6 - picked.length));
    }
    return picked.slice(0, 6).map((d) => ({
      ...d,
      img: DESKTOP_SLIDES[Number(d.id) % DESKTOP_SLIDES.length],
    }));
  }, [duels]);

  return (
    <div className="flex flex-1 animate-[fade-in_0.5s_ease] flex-col items-center overflow-y-auto">
      {/* Hero section with video/image background */}
      <div className="relative flex w-full flex-col items-center justify-center px-8 py-16">
        {/* Background video */}
        {heroVideo && (
          <video
            ref={videoRef}
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-wink-bg" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl font-extrabold uppercase text-white md:text-4xl">
            Bet. Blink.
            <br />
            Win the pool.
          </h2>
          <p className="max-w-md text-sm text-white/60">
            Open a duel. Deposit USDM. Most blinks takes it all.
          </p>
        </div>
      </div>

      {/* Featured battle cards — skeleton while loading */}
      {loading && featuredDuels.length === 0 && (
        <div className="w-full max-w-4xl px-8 py-8">
          <div className="grid grid-cols-3 gap-4" style={{ maxWidth: "56rem" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        </div>
      )}
      {featuredDuels.length > 0 && (
        <div className="w-full max-w-4xl px-8 py-8">
          <div className={`grid gap-4 ${featuredDuels.length >= 3 ? "grid-cols-3" : featuredDuels.length === 2 ? "grid-cols-2 max-w-xl mx-auto" : "grid-cols-1 max-w-xs mx-auto"}`} style={{ maxWidth: "56rem" }}>
            {featuredDuels.map((d) => (
              <div
                key={String(d.id)}
                onClick={() => authenticated && onLaunch(d)}
                className={`group flex flex-col ${
                  authenticated
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
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
                      Win <span className="text-wink-pink">${netWin(d.stake)}</span>.
                    </p>
                    <p className="mt-0.5 text-[8px] text-white/30">
                      {RAKE_BPS / 100}% fee included
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-white/40">
                      {d.creator}
                    </p>
                  </div>
                </div>
                {authenticated && (
                  <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wider text-wink-text-dim transition-colors group-hover:text-wink-pink">
                    Enter the Battle →
                  </p>
                )}
              </div>
            ))}
          </div>
          {duels.length > 6 && (
            <div className="mt-6 text-center">
              <Link
                href="/duels"
                className="text-sm font-semibold text-wink-text-dim transition-colors hover:text-wink-pink"
              >
                See all duels →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Powered on MegaETH — bottom */}
      <div className="mt-auto flex items-center justify-center gap-2 pb-6 pt-10">
        <span className="text-[10px] font-medium uppercase tracking-wider text-wink-text-dim/40">
          Powered on
        </span>
        <span
          className="inline-block h-[14px] w-[80px]"
          style={{
            WebkitMaskImage: "url(/megaeth-logo.svg)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskImage: "url(/megaeth-logo.svg)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            backgroundColor: "var(--wink-text-dim)",
            opacity: 0.3,
          }}
        />
      </div>
    </div>
  );
}
