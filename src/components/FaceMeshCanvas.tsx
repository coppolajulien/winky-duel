"use client";

import { type RefObject } from "react";
import { cn } from "@/lib/utils";

interface FaceMeshCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isBlinking: boolean;
  compact?: boolean;
}

export function FaceMeshCanvas({ canvasRef, isBlinking, compact }: FaceMeshCanvasProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border transition-all duration-150",
        isBlinking
          ? "border-red-500/60 shadow-[0_0_20px_var(--blink-shadow)]"
          : "border-wink-border shadow-[0_0_8px_var(--idle-shadow)]",
        compact && "shrink-0"
      )}
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={120}
        className="block bg-[var(--canvas-mesh-bg)]"
        style={{
          width: compact ? 80 : 160,
          height: compact ? 60 : 120,
        }}
      />
    </div>
  );
}
