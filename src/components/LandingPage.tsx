"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { WinBubbles } from "./WinBubbles";
import { X_URL } from "@/lib/constants";

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
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden font-sans">
      {/* Background video slideshow */}
      <VideoSlideshow />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      {/* Win bubbles animation */}
      <WinBubbles />

      {/* Navbar */}
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
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition-all hover:border-white/60 hover:bg-white/10"
          title="Follow us on X"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </nav>

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
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
            The first PvP blink-to-earn game
          </h2>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Bet. Blink.
            <br />
            Win the pool.
          </h1>

          <h3 className="max-w-md text-base font-normal text-white/60 md:text-lg">
            Open a duel. Deposit USDM. Most blinks takes it all.
          </h3>
          <Link
            href="/play"
            className="mt-4 rounded-full border-2 border-white px-10 py-3.5 text-base font-bold text-white transition-all hover:bg-white hover:text-black"
          >
            Challenge Now →
          </Link>
        </div>
      </div>

    </div>
  );
}
