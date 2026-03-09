"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { WinBubbles } from "./WinBubbles";
import { DESKTOP_SLIDES, MOBILE_SLIDES } from "@/lib/constants";

const DESKTOP_VIDEOS = [
  "/video-blinkit-1.mp4",
  "/video-blinkit-2.mp4",
  "/video-blinkit-3.mp4",
  "/video-blinkit-4.mp4",
  "/video-blinkit-5.mp4",
  "/video-blinkit-6.mp4",
  "/video-blinkit-7.mp4",
  "/video-blinkit-8.mp4",
  "/video-blinkit-9.mp4",
  "/video-blinkit-10.mp4",
];


function VideoSlideshow() {
  const [idx, setIdx] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const advance = useCallback(() => {
    setIdx((prev) => (prev + 1) % DESKTOP_VIDEOS.length);
  }, []);

  // Play only the active video, pause others and reset them
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === idx) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [idx]);

  // Fixed 4s per video
  useEffect(() => {
    const timer = setTimeout(advance, 4000);
    return () => clearTimeout(timer);
  }, [idx, advance]);

  return (
    <>
      {DESKTOP_VIDEOS.map((src, i) => (
        <video
          key={src}
          ref={(el) => { videoRefs.current[i] = el; }}
          src={src}
          muted
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
    </>
  );
}

export default function LandingPage() {
  const [slideIdx, setSlideIdx] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(() => {
      setSlideIdx((i) => (i + 1) % MOBILE_SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isMobile]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden font-sans">
      {/* Background slider */}
      {isMobile
        ? MOBILE_SLIDES.map((src, i) => (
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
          ))
        : <VideoSlideshow />}

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
                Open a duel. Deposit USDM. Most blinks takes it all.
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
