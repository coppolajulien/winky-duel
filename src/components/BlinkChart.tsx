"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useThemeColors } from "@/lib/theme";
import type { ChartPoint } from "@/lib/types";

interface BlinkChartProps {
  data: ChartPoint[];
  hasTarget: boolean;
}

export function BlinkChart({ data, hasTarget }: BlinkChartProps) {
  const colors = useThemeColors();

  return (
    <div className="relative h-full w-full">
      {/* Legend */}
      <div className="absolute left-3.5 top-1.5 z-[2] flex gap-3 text-[10px] font-medium">
        <span className="text-wink-pink">━ You</span>
        {hasTarget && (
          <span className="text-wink-orange opacity-50">┅ Target</span>
        )}
      </div>

      {/* LIVE indicator */}
      <div className="absolute right-3.5 top-1.5 z-[2] flex items-center gap-1 font-mono text-[9px] text-wink-text-dim">
        LIVE
        <span className="h-1 w-1 rounded-full bg-wink-pink animate-[live-dot_1s_ease_infinite]" />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 24, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.pink} stopOpacity={0.35} />
              <stop offset="60%" stopColor={colors.pink} stopOpacity={0.08} />
              <stop offset="100%" stopColor={colors.pink} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            stroke={colors.canvasGridStroke}
            vertical={false}
          />
          <XAxis dataKey="t" hide />
          <YAxis hide domain={[0, "auto"]} />
          <Area
            type="monotone"
            dataKey="you"
            stroke={colors.pink}
            strokeWidth={2.5}
            fill="url(#gradientPink)"
            dot={false}
            isAnimationActive={false}
          />
          {hasTarget && (
            <Area
              type="monotone"
              dataKey="target"
              stroke={colors.orange}
              strokeWidth={1.5}
              fill="none"
              dot={false}
              isAnimationActive={false}
              strokeDasharray="8 4"
              strokeOpacity={0.4}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
