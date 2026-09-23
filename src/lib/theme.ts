import type { CSSProperties } from "react";
import type { DictKey } from "./i18n";

export type ThemeColorId =
  | "red"
  | "emerald"
  | "blue"
  | "violet"
  | "rose"
  | "amber"
  | "cyan"
  | "pink"
  | "orange";

type ThemeColorDef = {
  /** i18n dictionary key for the display name — never a literal string, so
   * the label follows the app's ES/EN language switch like everything else. */
  labelKey: DictKey;
  /** Hex used to paint the little swatch button in the settings picker. */
  swatch: string;
  vars: {
    "--accent-300": string;
    "--accent-400": string;
    "--accent-500": string;
    "--accent-600": string;
    "--accent-900": string;
  };
};

export const DEFAULT_THEME_COLOR: ThemeColorId = "emerald";

export const THEME_COLORS: Record<ThemeColorId, ThemeColorDef> = {
  red: {
    labelKey: "theme_color_red",
    swatch: "#ef4444",
    vars: {
      "--accent-300": "#fca5a5",
      "--accent-400": "#f87171",
      "--accent-500": "#ef4444",
      "--accent-600": "#dc2626",
      "--accent-900": "#7f1d1d",
    },
  },
  emerald: {
    labelKey: "theme_color_emerald",
    swatch: "#10b981",
    vars: {
      "--accent-300": "#6ee7b7",
      "--accent-400": "#34d399",
      "--accent-500": "#10b981",
      "--accent-600": "#059669",
      "--accent-900": "#064e3b",
    },
  },
  blue: {
    labelKey: "theme_color_blue",
    swatch: "#3b82f6",
    vars: {
      "--accent-300": "#93c5fd",
      "--accent-400": "#60a5fa",
      "--accent-500": "#3b82f6",
      "--accent-600": "#2563eb",
      "--accent-900": "#1e3a8a",
    },
  },
  violet: {
    labelKey: "theme_color_violet",
    swatch: "#8b5cf6",
    vars: {
      "--accent-300": "#c4b5fd",
      "--accent-400": "#a78bfa",
      "--accent-500": "#8b5cf6",
      "--accent-600": "#7c3aed",
      "--accent-900": "#4c1d95",
    },
  },
  rose: {
    labelKey: "theme_color_rose",
    swatch: "#f43f5e",
    vars: {
      "--accent-300": "#fda4af",
      "--accent-400": "#fb7185",
      "--accent-500": "#f43f5e",
      "--accent-600": "#e11d48",
      "--accent-900": "#881337",
    },
  },
  amber: {
    labelKey: "theme_color_amber",
    swatch: "#f59e0b",
    vars: {
      "--accent-300": "#fcd34d",
      "--accent-400": "#fbbf24",
      "--accent-500": "#f59e0b",
      "--accent-600": "#d97706",
      "--accent-900": "#78350f",
    },
  },
  cyan: {
    labelKey: "theme_color_cyan",
    swatch: "#06b6d4",
    vars: {
      "--accent-300": "#67e8f9",
      "--accent-400": "#22d3ee",
      "--accent-500": "#06b6d4",
      "--accent-600": "#0891b2",
      "--accent-900": "#164e63",
    },
  },
  pink: {
    labelKey: "theme_color_pink",
    swatch: "#ec4899",
    vars: {
      "--accent-300": "#f9a8d4",
      "--accent-400": "#f472b6",
      "--accent-500": "#ec4899",
      "--accent-600": "#db2777",
      "--accent-900": "#831843",
    },
  },
  orange: {
    labelKey: "theme_color_orange",
    swatch: "#f97316",
    vars: {
      "--accent-300": "#fdba74",
      "--accent-400": "#fb923c",
      "--accent-500": "#f97316",
      "--accent-600": "#ea580c",
      "--accent-900": "#7c2d12",
    },
  },
};

export const THEME_COLOR_IDS = Object.keys(THEME_COLORS) as ThemeColorId[];

export function isThemeColorId(value: unknown): value is ThemeColorId {
  return typeof value === "string" && value in THEME_COLORS;
}

/** CSS custom properties to spread onto a wrapping element's `style` prop. */
export function themeVars(themeColor?: string | null): CSSProperties {
  const id = isThemeColorId(themeColor) ? themeColor : DEFAULT_THEME_COLOR;
  return THEME_COLORS[id].vars as CSSProperties;
}
