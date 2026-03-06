"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";

export interface ThemeColors {
  pink: string;
  bg: string;
  bgLight: string;
  border: string;
  textDim: string;
  text: string;
  canvasGridStroke: string;
  canvasMeshBg: string;
  /** Is the current theme dark? */
  isDark: boolean;
}

const DARK: ThemeColors = {
  pink: "#e8457a",
  bg: "#19191A",
  bgLight: "#222224",
  border: "rgba(236,232,232,0.06)",
  textDim: "rgba(236,232,232,0.5)",
  text: "#ECE8E8",
  canvasGridStroke: "rgba(236,232,232,0.04)",
  canvasMeshBg: "#222224",
  isDark: true,
};

const LIGHT: ThemeColors = {
  pink: "#e8457a",
  bg: "#ECE8E8",
  bgLight: "#DFD9D9",
  border: "rgba(25,25,26,0.08)",
  textDim: "rgba(25,25,26,0.5)",
  text: "rgba(25,25,26,0.85)",
  canvasGridStroke: "rgba(25,25,26,0.04)",
  canvasMeshBg: "#DFD9D9",
  isDark: false,
};

/** Reactive hook: returns theme-aware color palette for canvas / inline styles */
export function useThemeColors(): ThemeColors {
  const { resolvedTheme } = useTheme();
  return useMemo(() => (resolvedTheme === "dark" ? DARK : LIGHT), [resolvedTheme]);
}

/** Legacy static export — kept for backward-compat, defaults to dark */
export const P = DARK;
