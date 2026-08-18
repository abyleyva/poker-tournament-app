"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatClock } from "@/lib/tournament-logic";

export type TimelineLevel = {
  durationMinutes: number;
  isBreak: boolean;
  breakLabel?: string | null;
  smallBlind?: number | null;
  bigBlind?: number | null;
};

type Props = {
  levels: TimelineLevel[];
  currentLevelIndex: number;
  /** Seconds left in the current level (the live, ticking value). */
  remainingSeconds: number;
  /** When true, the timeline can be clicked/dragged to move the clock. */
  interactive?: boolean;
  /** Called with the target "seconds elapsed since level 1 started" when the user releases a drag/click. */
  onSeek?: (elapsedSeconds: number) => void;
  /** Number of tick bars drawn across the width. */
  tickCount?: number;
};

/**
 * Tick-bar progress meter for the CURRENT level only (like a classic poker
 * timer clock): a row of thin vertical bars, filled from the left as the
 * level's time elapses. In interactive mode (admin panel) it can be dragged
 * or clicked to move the clock to any point within the current level.
 */
export function TournamentTimeline({
  levels,
  currentLevelIndex,
  remainingSeconds,
  interactive = false,
  onSeek,
  tickCount = 60,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const dragging = dragFraction !== null;

  const currentLevel = levels[currentLevelIndex];
  const durationSeconds = Math.max(0, currentLevel?.durationMinutes ?? 0) * 60;

  const levelStartSeconds = useMemo(
    () =>
      levels
        .slice(0, currentLevelIndex)
        .reduce((sum, l) => sum + Math.max(0, l.durationMinutes) * 60, 0),
    [levels, currentLevelIndex]
  );

  const elapsedFraction = useMemo(() => {
    if (durationSeconds <= 0) return 0;
    const elapsed = Math.min(durationSeconds, Math.max(0, durationSeconds - remainingSeconds));
    return elapsed / durationSeconds;
  }, [durationSeconds, remainingSeconds]);

  const fractionFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
  }, []);

  useEffect(() => {
    if (!dragging) return;
    function handleMove(e: PointerEvent) {
      const fraction = fractionFromClientX(e.clientX);
      if (fraction != null) setDragFraction(fraction);
    }
    function handleUp(e: PointerEvent) {
      const fraction = fractionFromClientX(e.clientX);
      setDragFraction(null);
      if (fraction != null) {
        onSeek?.(Math.round(levelStartSeconds + fraction * durationSeconds));
      }
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, fractionFromClientX, levelStartSeconds, durationSeconds, onSeek]);

  if (!currentLevel || durationSeconds === 0) return null;

  const previewFraction = dragFraction ?? hoverFraction;
  const showTooltip = interactive && previewFraction !== null;
  const filledTicks = Math.round(elapsedFraction * tickCount);
  const tooltipRemaining = previewFraction !== null ? Math.round((1 - previewFraction) * durationSeconds) : 0;
  const highlightedTick =
    previewFraction !== null ? Math.min(tickCount - 1, Math.floor(previewFraction * tickCount)) : null;

  const fillColor = currentLevel.isBreak ? "bg-amber-500" : "bg-accent-600";
  const baseColor = currentLevel.isBreak ? "bg-amber-950" : "bg-neutral-800";

  return (
    <div className="w-full select-none">
      <div
        ref={trackRef}
        onPointerDown={(e) => {
          if (!interactive) return;
          e.preventDefault();
          const fraction = fractionFromClientX(e.clientX);
          if (fraction != null) setDragFraction(fraction);
        }}
        onPointerMove={(e) => {
          if (!interactive || dragging) return;
          setHoverFraction(fractionFromClientX(e.clientX));
        }}
        onPointerLeave={() => setHoverFraction(null)}
        className={`relative flex h-10 items-stretch gap-[3px] sm:h-12 ${
          interactive ? "cursor-pointer touch-none" : ""
        }`}
      >
        {Array.from({ length: tickCount }, (_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[1px] transition-colors ${
              i < filledTicks ? fillColor : baseColor
            } ${highlightedTick === i ? "outline outline-2 outline-white" : ""}`}
          />
        ))}

        {showTooltip && (
          <div
            className="pointer-events-none absolute top-0 -translate-y-full"
            style={{ left: `${(previewFraction as number) * 100}%` }}
          >
            <div className="mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-center text-xs font-semibold text-white shadow-lg">
              {formatClock(tooltipRemaining)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
