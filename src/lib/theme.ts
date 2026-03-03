"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";

export interface ThemeColors {
  pink: string;
  cyan: string;
  orange: string;
  bg: string;
  bgLight: string;
  border: string;
  textDim: string;
  text: string;
  canvasBg1: string;
  canvasBg2: string;
  canvasGridStroke: string;
  /** RGB triplet for canvas grid dots, e.g. "255, 100, 180" */
  canvasGridDot: string;
  canvasMeshBg: string;
  canvasMeshNoface: string;
  /** Is the current theme dark? */
  isDark: boolean;
}

const DARK: ThemeColors = {
  pink: "#ff3c90",
  cyan: "#00ffc8",
  orange: "#ffaa55",
  bg: "#0d0612",
  bgLight: "#150a1e",
  border: "rgba(255,100,180,0.1)",
  textDim: "rgba(255,200,230,0.35)",
  text: "rgba(255,200,230,0.7)",
  canvasBg1: "#0d0612",
  canvasBg2: "#150a1e",
  canvasGridStroke: "rgba(255,80,160,0.02)",
  canvasGridDot: "255, 100, 180",
  canvasMeshBg: "#08040e",
  canvasMeshNoface: "rgba(255,200,230,0.1)",
  isDark: true,
};

const LIGHT: ThemeColors = {
  pink: "#FF8AA8",
  cyan: "#6DD0A9",
  orange: "#F5AF94",
  bg: "#ECE8E8",
  bgLight: "#DFD9D9",
  border: "rgba(25,25,26,0.1)",
  textDim: "rgba(25,25,26,0.5)",
  text: "rgba(25,25,26,0.85)",
  canvasBg1: "#ECE8E8",
  canvasBg2: "#DFD9D9",
  canvasGridStroke: "rgba(25,25,26,0.04)",
  canvasGridDot: "25, 25, 26",
  canvasMeshBg: "#DFD9D9",
  canvasMeshNoface: "rgba(25,25,26,0.2)",
  isDark: false,
};

/** Reactive hook: returns theme-aware color palette for canvas / inline styles */
export function useThemeColors(): ThemeColors {
  const { resolvedTheme } = useTheme();
  return useMemo(() => (resolvedTheme === "dark" ? DARK : LIGHT), [resolvedTheme]);
}

/** Legacy static export — kept for backward-compat, defaults to dark */
export const P = DARK;
