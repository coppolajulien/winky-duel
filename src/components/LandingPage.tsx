"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { WinBubbles } from "./WinBubbles";

const MOBILE_SLIDES = [
  "/mobile-bg.png",
  "/mobile-bg-1.png",
  "/mobile-bg-2.png",
  "/mobile-bg-3.png",
  "/mobile-bg-4.png",
  "/mobile-bg-5.png",
];

const DESKTOP_SLIDES = [
  "/desktop-bg.jpg",
  "/desktop-bg-1.jpg",
  "/desktop-bg-2.jpg",
  "/desktop-bg-3.jpg",
  "/desktop-bg-4.jpg",
  "/desktop-bg-5.jpg",
];


export default function LandingPage() {
  const [slideIdx, setSlideIdx] = useState(0);
  const isMobile = useIsMobile();
  const slides = isMobile ? MOBILE_SLIDES : DESKTOP_SLIDES;

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isMobile]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden font-sans">
      {/* Background slider */}
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out"
          style={{
            opacity: i === slideIdx ? 1 : 0,
            animation: "kenburns 8s ease-in-out infinite alternate",
            animationDelay: `${i * -1.3}s`,
          }}
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      {/* Win bubbles animation */}
      <WinBubbles />

      {/* Navbar — desktop only */}
      {!isMobile && (
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 md:py-6">
          <a href="/" className="flex items-center gap-2.5">
            <span
              className="inline-block h-[72px] w-[72px]"
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
            <span className="text-2xl font-bold tracking-wide text-white">BLINKIT</span>
          </a>
          <Link
            href="/play"
            className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10"
          >
            Launch App
          </Link>
        </nav>
      )}

      {/* Center content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          {/* Mobile: logo centered */}
          {isMobile && (
            <span
              className="inline-block h-[84px] w-[84px]"
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
          )}

          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
            The first PvP blink-to-earn game
          </h2>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Bet. Blink.
            <br />
            Win the pool.
          </h1>

          {isMobile ? (
            <p className="max-w-md text-sm text-white/60">
              Desktop only... for now!
            </p>
          ) : (
            <>
              <h3 className="max-w-md text-base font-normal text-white/60 md:text-lg">
                Stake USDM. Face your opp. Most blinks takes it all.
              </h3>
              <Link
                href="/play"
                className="mt-4 rounded-full border-2 border-white px-10 py-3.5 text-base font-bold text-white transition-all hover:bg-white hover:text-black"
              >
                Challenge Now →
              </Link>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
