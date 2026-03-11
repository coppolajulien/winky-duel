"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { WinBubbles } from "./WinBubbles";
import { MOBILE_SLIDES } from "@/lib/constants";

export function MobileGate({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(() => {
      setSlideIdx((i) => (i + 1) % MOBILE_SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isMobile]);

  // Mobile gate disabled — testing mobile gameplay
  if (!isMobile) return <>{children}</>;
  return <>{children}</>;

  // eslint-disable-next-line no-unreachable
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden font-sans">
      {/* Background slideshow with Ken Burns */}
      {MOBILE_SLIDES.map((src, i) => (
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

      {/* Powered by MegaETH — bottom */}
      <div className="absolute bottom-5 left-0 right-0 z-10 flex items-center justify-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
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
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
      </div>

      {/* Center content — matches LandingPage mobile */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          {/* Logo */}
          <Link href="/">
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
          </Link>

          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
            The first PvP blink-to-earn game
          </h2>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Bet. Blink.
            <br />
            Win the pool.
          </h1>

          <p className="max-w-md text-sm text-white/60">
            Desktop only... for now!
          </p>
        </div>
      </div>
    </div>
  );
}
