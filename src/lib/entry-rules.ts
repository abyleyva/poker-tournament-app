// Rules for WHEN rebuys and add-ons can be bought.
//
// Standard tournament structure: rebuys are offered during the initial
// period (the first levels); that period ends when the "Add-on Break"
// begins, and the add-on — a one-time optional chip package open to every
// remaining player regardless of stack — is sold during that break only.
//
// The organizer marks ONE break as the Add-on Break (`isAddOnBreak`). If no
// break is marked the tournament has no time windows (the behavior from
// before this feature): rebuys and add-ons are only limited by the per-player
// rules (max rebuys, one add-on per player).
//
// The Add-on Break only makes sense when the add-on is enabled
// ("Allow add-on"); if it isn't, any marked break is ignored.

export type EntryWindows = {
  /** Index (in play order) of the Add-on Break, or null if none is marked. */
  addOnBreakIndex: number | null;
  rebuyOpen: boolean;
  addOnOpen: boolean;
  /**
   * Where the add-on window stands: "unrestricted" (no Add-on Break),
   * "upcoming" (not reached yet), "open" (the break is running), "closed".
   */
  addOnPhase: "unrestricted" | "upcoming" | "open" | "closed";
};

export function getEntryWindows(
  state: { status: string; currentLevelIndex: number },
  levels: { isAddOnBreak?: boolean | null }[],
  addOnEnabled = true
): EntryWindows {
  const addOnBreakIndex = addOnEnabled ? levels.findIndex((l) => !!l.isAddOnBreak) : -1;
  if (addOnBreakIndex === -1) {
    return { addOnBreakIndex: null, rebuyOpen: true, addOnOpen: true, addOnPhase: "unrestricted" };
  }

  if (state.status === "finished") {
    return { addOnBreakIndex, rebuyOpen: false, addOnOpen: false, addOnPhase: "closed" };
  }
  if (state.status === "draft") {
    return { addOnBreakIndex, rebuyOpen: true, addOnOpen: false, addOnPhase: "upcoming" };
  }

  const current = state.currentLevelIndex;
  if (current < addOnBreakIndex) {
    return { addOnBreakIndex, rebuyOpen: true, addOnOpen: false, addOnPhase: "upcoming" };
  }
  if (current === addOnBreakIndex) {
    return { addOnBreakIndex, rebuyOpen: false, addOnOpen: true, addOnPhase: "open" };
  }
  return { addOnBreakIndex, rebuyOpen: false, addOnOpen: false, addOnPhase: "closed" };
}
