"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
import { fetchDuelById } from "@/hooks/useDuels";
import { useIsMobile } from "@/hooks/useIsMobile";
import { netWin, RAKE_BPS } from "@/lib/constants";
import { DuelStatus } from "@/lib/types";
import type { Duel } from "@/lib/types";
import { Button } from "@/components/ui/button";

const DESKTOP_SLIDES = [
  "/desktop-bg.jpg",
  "/desktop-bg-1.jpg",
  "/desktop-bg-2.jpg",
  "/desktop-bg-3.jpg",
  "/desktop-bg-4.jpg",
  "/desktop-bg-5.jpg",
  "/desktop-bg-6.jpg",
  "/desktop-bg-7.jpg",
  "/desktop-bg-8.jpg",
  "/desktop-bg-9.jpg",
  "/desktop-bg-10.jpg",
  "/desktop-bg-11.jpg",
];

export default function DuelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isMobile = useIsMobile();

  const [duel, setDuel] = useState<Duel | null>(null);
  const [status, setStatus] = useState<DuelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((i) => (i + 1) % DESKTOP_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchDuelById(BigInt(id));
        if (!result) {
          setError("Duel not found");
        } else {
          setDuel(result.duel);
          setStatus(result.status);
        }
      } catch {
        setError("Failed to load duel");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAccept = () => {
    router.push(`/play?join=${id}`);
  };

  // Mobile block
  if (isMobile) {
    return (
      <div className="relative flex h-dvh flex-col items-center justify-center gap-4 overflow-hidden p-8 text-center">
        {DESKTOP_SLIDES.map((src, i) => (
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
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span
            className="inline-block h-[48px] w-[48px]"
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
          <p className="text-white/60">Blink is desktop only.... for now!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center overflow-hidden">
      {/* Background slideshow */}
      {DESKTOP_SLIDES.map((src, i) => (
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
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
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-white/50">Loading duel...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/5 px-10 py-8 backdrop-blur-sm">
            <p className="text-lg font-semibold text-white">Duel not found</p>
            <p className="text-sm text-white/50">This duel doesn&apos;t exist or has been removed.</p>
            <Button
              onClick={() => router.push("/play")}
              className="rounded-full bg-wink-pink text-white hover:brightness-110"
            >
              Browse All Duels
            </Button>
          </div>
        )}

        {duel && status !== null && (
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-white/5 px-12 py-10 backdrop-blur-sm">
            {status === DuelStatus.Open ? (
              <>
                {/* Challenge header */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-wink-pink">
                    You&apos;ve been challenged
                  </p>
                  <h2 className="text-3xl font-black text-white">Blinkit Duel</h2>
                </div>

                {/* Duel info */}
                <div className="flex items-center gap-8">
                  {/* Stake */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs uppercase tracking-wider text-white/40">Stake</p>
                    <p className="font-mono text-4xl font-black text-white">${duel.stake}</p>
                    <p className="text-[10px] text-white/30">USDM</p>
                  </div>

                  <div className="h-16 w-px bg-white/10" />

                  {/* Score to beat */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs uppercase tracking-wider text-white/40">Score to beat</p>
                    <p className="font-mono text-4xl font-black text-wink-pink">{duel.score}</p>
                    <p className="text-[10px] text-white/30">blinks in 30s</p>
                  </div>
                </div>

                {/* Creator */}
                <p className="text-xs text-white/30">
                  Created by{" "}
                  <a
                    href={`https://mtrkr.xyz/wallet/${duel.creatorFull}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/60 transition-colors underline"
                  >
                    {duel.creator}
                  </a>
                </p>

                {/* Win info */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm text-white/60">
                    Win <span className="font-bold text-green-400">${netWin(duel.stake)}</span>
                  </p>
                  <p className="text-[10px] text-white/30">{RAKE_BPS / 100}% fee applied</p>
                </div>

                {/* CTA */}
                <Button
                  onClick={handleAccept}
                  className="rounded-full bg-wink-pink px-10 py-6 text-lg font-bold text-white transition-opacity duration-200 hover:opacity-85"
                >
                  Accept Challenge ⚔️
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-white">Duel unavailable</p>
                <p className="text-sm text-white/50">
                  {status === DuelStatus.Locked
                    ? "This duel has already been accepted by another player."
                    : status === DuelStatus.Settled
                      ? "This duel has already been completed."
                      : "This duel has been cancelled."}
                </p>
                <Button
                  onClick={() => router.push("/play")}
                  className="rounded-full bg-wink-pink text-white hover:brightness-110"
                >
                  Browse All Duels
                </Button>
              </>
            )}
          </div>
        )}

        {/* Back link */}
        {!loading && (
          <button
            onClick={() => router.push("/play")}
            className="text-xs text-white/30 transition-colors hover:text-white/60"
          >
            ← Back to all duels
          </button>
        )}
      </div>
    </div>
  );
}
