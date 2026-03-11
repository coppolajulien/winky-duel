"use client";

import { useState, useEffect } from "react";
import { DESKTOP_SLIDES } from "@/lib/constants";

const STORAGE_KEY = "blinkit-invite-code";

export function InviteGate({ children }: { children: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null); // null = loading
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setHasAccess(!!stored);
  }, []);

  // Background slideshow
  useEffect(() => {
    if (hasAccess) return;
    const id = setInterval(() => {
      setSlideIdx((i) => (i + 1) % DESKTOP_SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [hasAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      if (res.ok) {
        localStorage.setItem(STORAGE_KEY, trimmed.toUpperCase());
        setHasAccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  // Still checking localStorage
  if (hasAccess === null) return null;

  // Access granted
  if (hasAccess) return <>{children}</>;

  // Gate screen
  return (
    <div className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden font-sans">
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

      {/* Dark overlay */}
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

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
          Invite only
        </p>

        {/* Code form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="Enter your invite code"
            maxLength={12}
            autoFocus
            className="w-64 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center font-mono text-sm font-bold uppercase tracking-[0.15em] text-white placeholder:text-white/20 focus:border-wink-pink/50 focus:outline-none focus:ring-1 focus:ring-wink-pink/30"
          />

          {error && (
            <p className="text-xs font-semibold text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="rounded-full bg-wink-pink px-10 py-3 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>

        <p className="max-w-xs text-center text-[11px] text-white/30">
          You need an invite code to access Blinkit.
          <br />
          Ask a friend or follow us on X to get one.
        </p>
      </div>
    </div>
  );
}
