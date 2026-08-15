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

export type PrizeInput = { position: number; percentage: number };

export type PrizePayout = {
  position: number;
  percentage: number;
  amount: number;
};

/**
 * Total prize pool = (active + eliminated players) * buyIn
 *                   + total rebuys * rebuyPrice
 *                   + total add-ons * addOnPrice
 */
export function computePrizePool(params: {
  entriesCount: number;
  buyIn: number;
  totalRebuys: number;
  rebuyPrice: number | null | undefined;
  totalAddOns: number;
  addOnPrice: number | null | undefined;
}): number {
  const { entriesCount, buyIn, totalRebuys, rebuyPrice, totalAddOns, addOnPrice } = params;
  const base = entriesCount * buyIn;
  const rebuys = totalRebuys * (rebuyPrice ?? 0);
  const addOns = totalAddOns * (addOnPrice ?? 0);
  return base + rebuys + addOns;
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

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
