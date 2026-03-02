"use client";

import { type RefObject } from "react";
import { cn } from "@/lib/utils";

interface FaceMeshCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isBlinking: boolean;
}

export function FaceMeshCanvas({ canvasRef, isBlinking }: FaceMeshCanvasProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border transition-all duration-150",
        isBlinking
          ? "border-red-500/60 shadow-[0_0_20px_rgba(255,60,100,0.3)]"
          : "border-wink-border shadow-[0_0_8px_rgba(255,60,144,0.06)]"
      )}
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={120}
        className="block bg-[#08040e]"
        style={{ width: 160, height: 120 }}
      />
    </div>
  );
}
