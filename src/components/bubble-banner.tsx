"use client";

import { useI18n } from "@/lib/i18n";

/**
 * Persistent alert strip shown on both the public display and the admin
 * panel for as long as the tournament is on the bubble (see isBubblePhase
 * in tournament-logic.ts) — exactly one elimination away from the money.
 * Unlike the one-shot elimination card, this stays visible the whole time
 * the field is in that state, since it's a phase, not a single event.
 */
export function BubbleBanner() {
  const { t } = useI18n();
  return (
    <div className="bubble-banner-glow relative z-10 flex w-full items-center justify-center gap-3 border-b border-rose-500/40 bg-rose-950/60 px-6 py-3 text-center sm:py-4">
      <span aria-hidden className="text-xl sm:text-2xl">
        🫧
      </span>
      <div>
        <p className="text-sm font-extrabold uppercase tracking-widest text-rose-300 sm:text-lg">
          {t("bubble_banner_title")}
        </p>
        <p className="text-xs font-semibold text-rose-200/80 sm:text-sm">{t("bubble_banner_subtitle")}</p>
      </div>
    </div>
  );
}
