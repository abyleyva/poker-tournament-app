"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTournamentPoll } from "@/lib/use-tournament-poll";
import { formatClock, formatCurrency } from "@/lib/tournament-logic";

function useLiveCountdown(remainingSeconds: number, isRunning: boolean) {
  const [display, setDisplay] = useState(remainingSeconds);
  useEffect(() => setDisplay(remainingSeconds), [remainingSeconds]);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setDisplay((d) => Math.max(0, d - 1)), 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  return display;
}

export default function DisplayPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const { data, error, loading } = useTournamentPoll<any>(
    params.id ? `/api/tournaments/${params.id}` : null,
    2000
  );

  const isRunning = data?.status === "running";
  const display = useLiveCountdown(data?.remainingSeconds ?? 0, isRunning);

  if (loading && !data)
    return <div className="min-h-screen flex items-center justify-center text-neutral-400 text-xl">{t("common_loading")}</div>;
  if (error && !data)
    return <div className="min-h-screen flex items-center justify-center text-red-400 text-xl">{t("common_error")}</div>;
  if (!data) return null;

  const currentLevel = data.levels[data.currentLevelIndex];
  const nextLevel = data.levels[data.currentLevelIndex + 1];
  const isLowTime = isRunning && display <= 30;
  const isBreak = currentLevel?.isBreak;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-10 ${isBreak ? "bg-amber-950" : "bg-neutral-950"}`}>
      <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-300 mb-6 text-center">{data.name}</h1>

      {data.status === "draft" && (
        <p className="text-2xl text-neutral-400 text-center">{t("display_waiting")}</p>
      )}

      {data.status === "finished" && (
        <p className="text-4xl sm:text-6xl font-bold text-emerald-400 text-center">{t("display_finished")}</p>
      )}

      {(data.status === "running" || data.status === "paused") && currentLevel && (
        <>
          {isBreak && (
            <p className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-widest mb-2">
              {currentLevel.breakLabel || t("display_break")}
            </p>
          )}
          <p
            className={`font-mono font-bold leading-none ${
              isLowTime ? "clock-warning text-red-400" : "text-white"
            } text-[18vw] sm:text-[12rem]`}
          >
            {formatClock(display)}
          </p>

          {!isBreak && (
            <p className="mt-6 text-4xl sm:text-6xl font-bold text-emerald-400">
              {currentLevel.smallBlind} / {currentLevel.bigBlind}
              {currentLevel.ante ? (
                <span className="text-2xl sm:text-4xl text-neutral-400"> · {t("clock_ante")} {currentLevel.ante}</span>
              ) : null}
            </p>
          )}

          {nextLevel && (
            <p className="mt-4 text-lg sm:text-2xl text-neutral-500">
              {t("clock_next_level")}:{" "}
              {nextLevel.isBreak
                ? nextLevel.breakLabel
                : `${nextLevel.smallBlind} / ${nextLevel.bigBlind}${
                    nextLevel.ante ? ` · ${t("clock_ante")} ${nextLevel.ante}` : ""
                  }`}
            </p>
          )}
        </>
      )}

      <div className="mt-10 grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-white">{data.stats.activeCount}</p>
          <p className="text-sm text-neutral-500">{t("clock_players_left")}</p>
        </div>
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-white">{data.stats.entriesCount}</p>
          <p className="text-sm text-neutral-500">{t("display_entries")}</p>
        </div>
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-emerald-400">
            {formatCurrency(data.prizePool, data.currency, "es-MX")}
          </p>
          <p className="text-sm text-neutral-500">{t("display_prize_pool")}</p>
        </div>
      </div>

      <p className="mt-10 text-sm text-neutral-600 text-center">{t("display_scan_hint")}</p>
    </div>
  );
}
