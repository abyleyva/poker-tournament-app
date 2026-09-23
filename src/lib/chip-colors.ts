import type { DictKey } from "./i18n";

// Fixed palette of standard casino poker chip colors, used by the "Fichas"
// (chip plan) tab so the organizer picks a color visually instead of typing
// free text. The stored value in `chip_denominations.color` is one of these
// ids (a plain string, same column as before — no schema change needed).
//
// Each entry has the chip's base color (`hex`) and the color used for its
// edge marks / dashed inner ring (`accent`), matching real chip designs:
// light chips get a colored accent, colored chips get a white accent. The
// display name comes from `labelKey`, a normal i18n dictionary key — the id
// itself is never shown to the user, so the label follows the app's ES/EN
// language switch like everything else.
export type ChipColorId =
  | "white"
  | "red"
  | "green"
  | "black"
  | "blue"
  | "purple"
  | "yellow"
  | "orange"
  | "pink"
  | "gray";

export type ChipColorDef = {
  labelKey: DictKey;
  hex: string;
  accent: string;
};

export const CHIP_COLORS: Record<ChipColorId, ChipColorDef> = {
  white: { labelKey: "chip_color_white", hex: "#f5f5f0", accent: "#1d4ed8" },
  red: { labelKey: "chip_color_red", hex: "#dc2626", accent: "#ffffff" },
  green: { labelKey: "chip_color_green", hex: "#16a34a", accent: "#ffffff" },
  black: { labelKey: "chip_color_black", hex: "#171717", accent: "#ffffff" },
  blue: { labelKey: "chip_color_blue", hex: "#1d4ed8", accent: "#ffffff" },
  purple: { labelKey: "chip_color_purple", hex: "#7c3aed", accent: "#ffffff" },
  yellow: { labelKey: "chip_color_yellow", hex: "#eab308", accent: "#171717" },
  orange: { labelKey: "chip_color_orange", hex: "#ea580c", accent: "#ffffff" },
  pink: { labelKey: "chip_color_pink", hex: "#db2777", accent: "#ffffff" },
  gray: { labelKey: "chip_color_gray", hex: "#6b7280", accent: "#ffffff" },
};

export const CHIP_COLOR_IDS = Object.keys(CHIP_COLORS) as ChipColorId[];

export function isChipColorId(value: unknown): value is ChipColorId {
  return typeof value === "string" && value in CHIP_COLORS;
}

/** Label for a stored color value — falls back to the raw text for any
 * legacy/custom value that isn't one of the fixed palette ids. `t` is the
 * translator from `useI18n()`, so the label follows the current language. */
export function chipColorLabel(value: string, t: (key: DictKey) => string): string {
  return isChipColorId(value) ? t(CHIP_COLORS[value].labelKey) : value;
}
