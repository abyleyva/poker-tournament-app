"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export type EliminationEvent = {
  id: string;
  name: string;
  finishPosition: number | null;
  remaining: number;
};

const VISIBLE_MS = 5000;
const EXIT_MS = 350;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function ordinal(n: number, lang: "es" | "en"): string {
  if (lang === "es") return `${n}°`;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Full-screen card shown briefly on the public display whenever a player is
 * eliminated. Styled like a playing card; border/suit/title color follows
 * the tournament's selected accent color (via the `--accent-*` CSS vars the
 * page already sets), not a hardcoded color.
 */
export function EliminationCard({ event, onDone }: { event: EliminationEvent; onDone: () => void }) {
  const { t, lang } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    const removeTimer = setTimeout(onDone, VISIBLE_MS + EXIT_MS);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${EXIT_MS}ms ease` }}
      aria-live="polite"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border-4 border-accent-500 bg-neutral-950 p-8 text-center shadow-2xl"
        style={{
          transform: visible ? "scale(1)" : "scale(0.92)",
          transition: `transform ${EXIT_MS}ms ease`,
        }}
      >
        <span aria-hidden className="absolute left-5 top-5 text-2xl text-accent-500">
          ♥
        </span>
        <span aria-hidden className="absolute bottom-5 right-5 rotate-180 text-2xl text-accent-500">
          ♥
        </span>

        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-accent-500 bg-neutral-800 sm:h-32 sm:w-32">
          <span className="text-3xl font-extrabold text-white sm:text-4xl">{initials(event.name)}</span>
        </div>

        <p className="text-3xl font-extrabold tracking-wide text-accent-500 sm:text-4xl">
          {t("display_eliminated_title")}
        </p>
        <p className="mt-2 text-base font-semibold text-accent-400 sm:text-lg">
          {t("display_eliminated_subtitle")}
        </p>

        <p className="mt-6 truncate text-xl font-bold text-white sm:text-2xl">{event.name}</p>
        <p className="mt-2 text-sm font-semibold text-neutral-400">
          {event.finishPosition
            ? `${t("display_eliminated_place", { ord: ordinal(event.finishPosition, lang) })} · `
            : ""}
          {t("display_eliminated_remaining", { n: event.remaining })}
        </p>
      </div>
    </div>
  );
}
