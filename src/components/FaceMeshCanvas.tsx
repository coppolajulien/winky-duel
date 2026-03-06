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
        "overflow-hidden rounded-xl transition-all duration-150",
        isBlinking
          ? "ring-2 ring-wink-pink/40"
          : "",
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
