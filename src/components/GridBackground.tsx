"use client";

import { useRef, useEffect, type ReactNode } from "react";

export function GridBackground({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let t = 0;
    let frame: number;

    const resize = () => {
      if (c.parentElement) {
        c.width = c.parentElement.offsetWidth;
        c.height = c.parentElement.offsetHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.001;
      const bg = ctx.createLinearGradient(0, 0, c.width, c.height);
      bg.addColorStop(0, "#0d0612");
      bg.addColorStop(0.5, "#150a1e");
      bg.addColorStop(1, "#0d0612");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);

      const gap = 70;
      ctx.strokeStyle = "rgba(255,80,160,0.02)";
      ctx.lineWidth = 0.5;
      for (let x = gap; x < c.width; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, c.height);
        ctx.stroke();
      }
      for (let y = gap; y < c.height; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(c.width, y);
        ctx.stroke();
      }

      for (let x = gap; x < c.width; x += gap) {
        for (let y = gap; y < c.height; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,100,180,${0.2 + 0.1 * Math.sin(t * 2 + x * 0.008 + y * 0.008)})`;
          ctx.fill();
        }
      }

      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden">
      <canvas ref={ref} className="absolute inset-0 z-0" />
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
}
