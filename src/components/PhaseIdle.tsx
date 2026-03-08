"use client";

import { useMemo, useRef } from "react";
import type { Duel } from "@/lib/types";
import { netWin, RAKE_BPS } from "@/lib/constants";

const DESKTOP_SLIDES = [
  "/desktop-bg.jpg",
  "/desktop-bg-1.jpg",
  "/desktop-bg-2.jpg",
  "/desktop-bg-3.jpg",
  "/desktop-bg-4.jpg",
  "/desktop-bg-5.jpg",
];

// Drop mp4 files in /public/ and add paths here
const HERO_VIDEOS: string[] = [
  "/video-blinkit-it-1.mp4",
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const heroVideo = useMemo(
    () => HERO_VIDEOS.length > 0 ? HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)] : null,
    []
  );

  // Pick up to 3 duels: prioritize $25+, fill remaining slots with cheaper ones
  const featuredDuels = useMemo(() => {
    const big = shuffle(duels.filter((d) => d.stake >= 25), Date.now());
    const small = shuffle(duels.filter((d) => d.stake < 25), Date.now() + 2);
    const picked = [...big.slice(0, 3)];
    if (picked.length < 3) {
      picked.push(...small.slice(0, 3 - picked.length));
    }
    const imgs = shuffle(DESKTOP_SLIDES, Date.now() + 1);
    return picked.slice(0, 3).map((d, i) => ({
      ...d,
      img: imgs[i % imgs.length],
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
            Stake USDM. Face your opp. Most blinks takes it all.
          </p>

          {authenticated && (
            <button
              onClick={onCreate}
              className="mt-2 rounded-full border-2 border-white bg-white/10 px-10 py-4 text-lg font-black uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:bg-white hover:text-black active:scale-95"
            >
              Create a Duel →
            </button>
          )}

        </div>
      </div>

      {/* Featured battle cards */}
      {featuredDuels.length > 0 && (
        <div className="w-full max-w-3xl px-8 py-8">
          <div className={`grid gap-4 ${featuredDuels.length >= 3 ? "grid-cols-3" : featuredDuels.length === 2 ? "grid-cols-2 max-w-xl mx-auto" : "grid-cols-1 max-w-xs mx-auto"}`}>
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
