export type LevelLike = {
  durationMinutes: number;
};

export type ClockState = {
  status: string; // draft | running | paused | finished
  currentLevelIndex: number;
  levelEndsAt: Date | null;
  remainingSeconds: number | null;
};

/**
 * Given the persisted clock state and the ordered list of levels, figures out
 * whether the running level (or levels, if the server was untouched for a
 * while) has elapsed and returns the up-to-date state. Server-authoritative:
 * every client polls and gets a state that has already "caught up" to now.
 */
export function computeAdvancedClock(
  state: ClockState,
  levels: LevelLike[],
  now: Date
): ClockState {
  if (state.status !== "running" || !state.levelEndsAt || levels.length === 0) {
    return state;
  }

  let currentLevelIndex = state.currentLevelIndex;
  let endsAtMs = state.levelEndsAt.getTime();
  const nowMs = now.getTime();
  let changed = false;

  while (nowMs >= endsAtMs) {
    changed = true;
    currentLevelIndex += 1;
    if (currentLevelIndex >= levels.length) {
      return {
        status: "finished",
        currentLevelIndex: levels.length - 1,
        levelEndsAt: null,
        remainingSeconds: 0,
      };
    }
    endsAtMs += levels[currentLevelIndex].durationMinutes * 60_000;
  }

  if (!changed) return state;

  return {
    status: "running",
    currentLevelIndex,
    levelEndsAt: new Date(endsAtMs),
    remainingSeconds: null,
  };
}

export function secondsRemaining(state: ClockState, now: Date): number {
  if (state.status === "running" && state.levelEndsAt) {
    return Math.max(0, Math.round((state.levelEndsAt.getTime() - now.getTime()) / 1000));
  }
  if (state.status === "paused" && state.remainingSeconds != null) {
    return Math.max(0, state.remainingSeconds);
  }
  return 0;
}

/**
 * Seconds remaining until the next break starts, counting from the current
 * level's remaining time plus the full duration of every level in between.
 * Returns 0 if currently on a break, or null if there is no upcoming break.
 */
export function secondsUntilNextBreak(
  levels: { durationMinutes: number; isBreak: boolean }[],
  currentLevelIndex: number,
  remainingSeconds: number
): number | null {
  if (currentLevelIndex < 0 || currentLevelIndex >= levels.length) return null;
  if (levels[currentLevelIndex].isBreak) return 0;

  let total = Math.max(0, remainingSeconds);
  for (let i = currentLevelIndex + 1; i < levels.length; i++) {
    if (levels[i].isBreak) return total;
    total += levels[i].durationMinutes * 60;
  }
  return null;
}

export type PrizeInput = { position: number; percentage: number };

export type PrizePayout = {
  position: number;
  percentage: number;
  amount: number;
};

import type { FeeMode } from "./organizer-fee";

/**
 * How much of a single payment (buy-in, rebuy, or add-on) the organizer
 * retains as an administration/management/logistics fee. Always clamped to
 * [0, paymentAmount] — a fixed fee can never exceed (and therefore never
 * make negative) the contribution it applies to.
 */
export function computeFeePerEntry(
  paymentAmount: number,
  feeMode: FeeMode | null | undefined,
  feeValue: number | null | undefined
): number {
  if (!paymentAmount || paymentAmount <= 0) return 0;
  const value = feeValue ?? 0;
  if (feeMode === "percentage") {
    const pct = Math.min(Math.max(value, 0), 100);
    return Math.min((paymentAmount * pct) / 100, paymentAmount);
  }
  if (feeMode === "fixed") {
    return Math.min(Math.max(value, 0), paymentAmount);
  }
  return 0;
}

export type PrizePoolBreakdown = {
  grossPool: number;
  feeTotal: number;
  netPool: number;
};

/**
 * Gross prize pool = (active + eliminated players) * buyIn
 *                   + total rebuys * rebuyPrice
 *                   + total add-ons * addOnPrice
 *
 * The organizer's administration/management/logistics fee (see
 * src/lib/organizer-fee.ts) is retained from each buy-in and, if
 * feeAppliesToRebuyAddOn is set, from each rebuy/add-on as well. The net
 * pool (gross minus retained fees) is what actually gets distributed to
 * payouts.
 */
export function computePrizePool(params: {
  entriesCount: number;
  buyIn: number;
  totalRebuys: number;
  rebuyPrice: number | null | undefined;
  totalAddOns: number;
  addOnPrice: number | null | undefined;
  feeMode?: FeeMode | null;
  feeValue?: number | null;
  feeAppliesToRebuyAddOn?: boolean | null;
}): PrizePoolBreakdown {
  const {
    entriesCount,
    buyIn,
    totalRebuys,
    rebuyPrice,
    totalAddOns,
    addOnPrice,
    feeMode,
    feeValue,
    feeAppliesToRebuyAddOn,
  } = params;
  const base = entriesCount * buyIn;
  const rebuys = totalRebuys * (rebuyPrice ?? 0);
  const addOns = totalAddOns * (addOnPrice ?? 0);
  const grossPool = base + rebuys + addOns;

  const feePerBuyIn = computeFeePerEntry(buyIn, feeMode, feeValue);
  let feeTotal = entriesCount * feePerBuyIn;
  if (feeAppliesToRebuyAddOn) {
    const feePerRebuy = computeFeePerEntry(rebuyPrice ?? 0, feeMode, feeValue);
    const feePerAddOn = computeFeePerEntry(addOnPrice ?? 0, feeMode, feeValue);
    feeTotal += totalRebuys * feePerRebuy + totalAddOns * feePerAddOn;
  }

  const netPool = Math.max(0, grossPool - feeTotal);
  return { grossPool, feeTotal, netPool };
}

export function computePrizePayouts(pool: number, prizes: PrizeInput[]): PrizePayout[] {
  return [...prizes]
    .sort((a, b) => a.position - b.position)
    .map((p) => ({
      position: p.position,
      percentage: p.percentage,
      amount: Math.round(((pool * p.percentage) / 100) * 100) / 100,
    }));
}

/**
 * True while the tournament is "on the bubble": exactly one more elimination
 * stands between the field and the paid places, so whoever busts out next
 * gets nothing while everyone after them cashes. Only meaningful once the
 * clock has actually started and prizes are configured.
 */
export function isBubblePhase(paidPositions: number, activeCount: number, status: string): boolean {
  return paidPositions > 0 && activeCount === paidPositions + 1 && status !== "draft" && status !== "finished";
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Formats a total duration given in minutes as a clock-style string:
 * "H:MM:SS" once it spans an hour or more, otherwise just "M:SS" (no
 * leading hour segment) — e.g. 55 -> "55:00", 170 -> "2:50:00".
 */
export function formatDurationHMS(totalMinutes: number): string {
  const totalSeconds = Math.max(0, Math.round(totalMinutes * 60));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
