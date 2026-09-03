"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/tournament-logic";

export type EliminationEvent = {
  id: string;
  name: string;
  finishPosition: number | null;
  remaining: number;
  /** Prize amount for this finish, when it's a paid position (excluding the
   *  final two places, whose card is handled separately — see isBubble). */
  prizeAmount: number | null;
  /** True when this finish position is the first one just outside the money. */
  isBubble: boolean;
  currency: string;
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

type Variant = "eliminated" | "bubble" | "cashed";

/**
 * Full-screen card shown briefly on the public display whenever a player is
 * eliminated. Styled like a playing card. By default border/suit/title color
 * follows the tournament's selected accent color (via the `--accent-*` CSS
 * vars the page already sets). Two special variants override this:
 *  - "bubble": the first finish position just outside the paid places — a
 *    pivotal moment, so it gets a dramatic rose/red treatment with a
 *    pulsing glow, same title as the default "eliminated" card, with the
 *    subtitle swapped for a "so close" message.
 *  - "cashed": a paid finish position (excluding the top two, which get
 *    their own treatment elsewhere) — shows the dollar amount won in place
 *    of the usual title.
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

  const variant: Variant = event.prizeAmount != null ? "cashed" : event.isBubble ? "bubble" : "eliminated";
  const isBubbleVariant = variant === "bubble";

  const borderClass = isBubbleVariant ? "border-rose-500" : "border-accent-500";
  const suitClass = isBubbleVariant ? "text-rose-500" : "text-accent-500";
  const avatarBorderClass = isBubbleVariant ? "border-rose-500" : "border-accent-500";
  const titleClass = isBubbleVariant ? "text-rose-400" : "text-accent-500";
  const subtitleClass = isBubbleVariant ? "text-rose-300" : "text-accent-400";

  const titleText =
    variant === "cashed" ? formatCurrency(event.prizeAmount ?? 0, event.currency, "es-MX") : t("display_eliminated_title");
  const subtitleText =
    variant === "cashed"
      ? t("display_cashed_title")
      : variant === "bubble"
        ? t("display_bubble_subtitle")
        : t("display_eliminated_subtitle");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${EXIT_MS}ms ease` }}
      aria-live="polite"
    >
      <div
        className={`relative flex w-full max-w-sm flex-col justify-center rounded-3xl border-4 ${borderClass} bg-neutral-950 p-8 text-center shadow-2xl ${
          isBubbleVariant && visible ? "bubble-card-glow" : ""
        }`}
        style={{
          aspectRatio: "2.5 / 3.5",
          maxHeight: "85vh",
          transform: visible ? undefined : "scale(0.92)",
          transition: `transform ${EXIT_MS}ms ease`,
        }}
      >
        <span aria-hidden className={`absolute left-5 top-5 text-2xl ${suitClass}`}>
          ♥
        </span>
        <span aria-hidden className={`absolute bottom-5 right-5 rotate-180 text-2xl ${suitClass}`}>
          ♥
        </span>

        <div
          className={`mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 ${avatarBorderClass} bg-neutral-800 sm:h-32 sm:w-32`}
        >
          <span className="text-3xl font-extrabold text-white sm:text-4xl">{initials(event.name)}</span>
        </div>

        <p className={`text-3xl font-extrabold tracking-wide ${titleClass} sm:text-4xl`}>{titleText}</p>
        <p className={`mt-2 text-base font-semibold ${subtitleClass} sm:text-lg`}>{subtitleText}</p>

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
