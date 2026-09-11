/**
 * Which sections the public clock display (/tournaments/[id]/display) shows.
 * Configured per tournament from the admin Settings tab.
 *
 *  - "simple": just the clock and the current level's blinds — nothing else.
 *  - "now_next": simple, plus the next level's blinds shown alongside the
 *    current ones.
 *  - "all_data": now_next, plus the active players / entries / prize pool
 *    stats row.
 */
export type ScreenLayoutId = "simple" | "now_next" | "all_data";

export const DEFAULT_SCREEN_LAYOUT: ScreenLayoutId = "all_data";

export const SCREEN_LAYOUT_IDS: ScreenLayoutId[] = ["simple", "now_next", "all_data"];

export function isScreenLayoutId(value: unknown): value is ScreenLayoutId {
  return value === "simple" || value === "now_next" || value === "all_data";
}
