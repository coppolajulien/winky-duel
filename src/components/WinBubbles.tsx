"use client";

import { useEffect, useRef, useCallback } from "react";

const AMOUNTS = [1, 5, 10, 25, 50, 100];

export function WinBubbles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnBubble = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const amount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
    const x = 55 + Math.random() * 40; // 55-95% from left
    const size = 18 + Math.random() * 18; // 18-36px
    const duration = 5000 + Math.random() * 3000; // 5-8s
    const drift = -40 + Math.random() * 80; // horizontal sway

    const el = document.createElement("span");
    el.textContent = `$${amount}`;
    el.style.cssText = `
      position: absolute;
      left: ${x}%;
      bottom: -40px;
      font-size: ${size}px;
      font-family: var(--font-mono), ui-monospace, monospace;
      font-weight: 800;
      color: rgba(255,255,255,0.85);
      text-shadow: 0 2px 16px rgba(0,0,0,0.6);
      pointer-events: none;
      will-change: transform, opacity;
    `;

    container.appendChild(el);

    const anim = el.animate(
      [
        { opacity: 0, transform: "translateY(0) translateX(0) scale(0.6)" },
        { opacity: 0.9, transform: `translateY(-8vh) translateX(${drift * 0.15}px) scale(0.8)`, offset: 0.08 },
        { opacity: 0.7, transform: `translateY(-25vh) translateX(${drift * 0.5}px) scale(1)`, offset: 0.3 },
        { opacity: 0.45, transform: `translateY(-50vh) translateX(${drift * 0.8}px) scale(1.3)`, offset: 0.55 },
        { opacity: 0.2, transform: `translateY(-75vh) translateX(${drift}px) scale(1.7)`, offset: 0.8 },
        { opacity: 0, transform: `translateY(-105vh) translateX(${drift}px) scale(2.2)` },
      ],
      { duration, easing: "ease-out", fill: "forwards" }
    );

    anim.onfinish = () => el.remove();
  }, []);

  useEffect(() => {
    // Spawn initial batch staggered
    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnBubble(), i * 600);
    }

    // Keep spawning
    const loop = () => {
      spawnBubble();
      timerRef.current = setTimeout(loop, 800 + Math.random() * 1000);
    };
    timerRef.current = setTimeout(loop, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [spawnBubble]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 2 }}
    />
  );
}
