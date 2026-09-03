"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/tournament-logic";

const SLIDE_MS = 8000;
const CONFETTI_INTERVAL_MS = 400;

type ResultRow = {
  id: string;
  name: string;
  /** 1 for the winner, otherwise the recorded finish position. */
  rank: number;
};

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
 * Full-screen, non-auto-dismissing overlay shown once the runner-up (2nd
 * place) busts out and only the winner remains — there's no one left to
 * compete against, so the tournament is effectively over right then. A
 * two-slide carousel: confetti + the winner's card, then the final results
 * for every place. Closing it is purely a local/client action (the public
 * display has no admin token to change anything server-side) — reopening
 * the page shows it again as long as the tournament is still in this state.
 */
export function WinnerCelebration({
  results,
  payouts,
  currency,
  name,
  appLogoUrl,
  tournamentLogoUrl,
  onClose,
}: {
  /** Ranked results, winner (rank 1) first. */
  results: ResultRow[];
  payouts: { position: number; amount: number }[];
  currency: string;
  /** Tournament name, shown as a footer caption under both slides. */
  name: string;
  appLogoUrl?: string | null;
  tournamentLogoUrl?: string | null;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const hasLogos = !!(appLogoUrl || tournamentLogoUrl);
  const [slide, setSlide] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fireRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  const winner = results[0];
  const winnerAmount = payouts.find((p) => p.position === 1)?.amount ?? 0;

  useEffect(() => {
    if (!canvasRef.current) return;
    fireRef.current = confetti.create(canvasRef.current, { resize: true, useWorker: true });
    return () => {
      fireRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (slide !== 0) return;
    const fire = fireRef.current;
    if (!fire) return;

    const colors = ["#f5c518", "#ffffff", "#d4af37", "#8b1e1e", "#2f2f2f"];

    // Two cannons planted in the bottom corners, firing up and inward — reads
    // better on a wide TV screen than confetti simply falling from the top.
    const fireCannons = (particleCount: number, startVelocity: number) => {
      fire({
        particleCount,
        angle: 60,
        spread: 55,
        startVelocity,
        origin: { x: 0, y: 1 },
        colors,
      });
      fire({
        particleCount,
        angle: 120,
        spread: 55,
        startVelocity,
        origin: { x: 1, y: 1 },
        colors,
      });
    };

    fireCannons(90, 65);
    const interval = setInterval(() => fireCannons(45, 55), CONFETTI_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [slide]);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s === 0 ? 1 : 0)), SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  if (!winner) return null;

  // Diffuse glow rising from the bottom in the tournament's accent color,
  // fading to black toward the top — same accent-driven theming used
  // elsewhere on the display, just applied as a background wash here.
  const backgroundStyle = {
    background: "radial-gradient(ellipse 120% 65% at 50% 100%, var(--accent-900) 0%, #000000 70%)",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={backgroundStyle} aria-live="polite">
      {hasLogos && (
        <header className="relative z-10 flex w-full items-center justify-between gap-4 border-b border-white/10 bg-black/20 px-6 py-3 sm:px-10 sm:py-4">
          <div className="flex h-10 sm:h-14 items-center">
            {appLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={appLogoUrl} alt="" className="max-h-full max-w-[8rem] object-contain sm:max-w-[12rem]" />
            )}
          </div>
          <div className="flex h-10 sm:h-14 items-center">
            {tournamentLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tournamentLogoUrl}
                alt=""
                className="max-h-full max-w-[8rem] object-contain sm:max-w-[12rem]"
              />
            )}
          </div>
        </header>
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8">
        {slide === 0 ? (
          <>
            <p className="mb-8 max-w-4xl text-center text-3xl font-extrabold uppercase tracking-wide text-white sm:text-5xl">
              {t("display_winner_header", { name: winner.name })}
            </p>
            <div
              className="winner-card-float relative flex w-full max-w-sm flex-col justify-center rounded-3xl border-4 border-accent-500 bg-neutral-950 p-8 text-center shadow-2xl"
              style={{ aspectRatio: "2.5 / 3.5", maxHeight: "85vh" }}
            >
              <span aria-hidden className="absolute left-5 top-5 text-2xl text-accent-500">
                ♥
              </span>
              <span aria-hidden className="absolute bottom-5 right-5 rotate-180 text-2xl text-accent-500">
                ♥
              </span>
              <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-accent-500 bg-neutral-800 sm:h-32 sm:w-32">
                <span className="text-3xl font-extrabold text-white sm:text-4xl">{initials(winner.name)}</span>
              </div>
              <p className="text-3xl font-extrabold tracking-wide text-accent-500 sm:text-4xl">
                {formatCurrency(winnerAmount, currency, "es-MX")}
              </p>
              <p className="mt-2 text-base font-semibold text-accent-400 sm:text-lg">{t("display_winner_badge")}</p>
              <p className="mt-6 truncate text-xl font-bold text-white sm:text-2xl">{winner.name}</p>
              <p className="mt-2 text-sm font-semibold text-neutral-400">{t("display_winner_place")}</p>
            </div>
          </>
        ) : (
          <div className="w-full max-w-5xl">
            <h2 className="mb-6 text-center text-3xl font-extrabold uppercase tracking-wide text-white sm:text-5xl">
              {t("display_final_results_title")}
            </h2>
            <div className="max-h-[52vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-6">
              <ol className="grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
                {results.map((p) => {
                  const amount = payouts.find((x) => x.position === p.rank)?.amount;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 border-b border-neutral-800 py-3 last:border-0 sm:last:border-b"
                    >
                      <span className="w-12 shrink-0 text-lg font-extrabold text-accent-400 sm:text-xl">
                        {ordinal(p.rank, lang)}
                      </span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">
                        {initials(p.name)}
                      </span>
                      <span className="flex-1 truncate text-white sm:text-lg">{p.name}</span>
                      <span className="shrink-0 font-semibold text-neutral-300 sm:text-lg">
                        {amount != null ? formatCurrency(amount, currency, "es-MX") : "—"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2">
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                slide === i ? "bg-accent-500" : "bg-neutral-700"
              }`}
            />
          ))}
        </div>

        <p className="mt-6 max-w-4xl text-center text-3xl font-extrabold uppercase tracking-wide text-white sm:text-5xl">
          {name}
        </p>
      </div>

      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-20 h-full w-full" />

      <button
        type="button"
        onClick={onClose}
        aria-label={t("display_close_winner")}
        className={`fixed right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white transition-colors hover:bg-white/20 ${
          hasLogos ? "top-20 sm:top-24" : "top-5"
        }`}
      >
        ×
      </button>
    </div>
  );
}
