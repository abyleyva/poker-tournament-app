"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTournamentPoll } from "@/lib/use-tournament-poll";
import { formatClock, formatCurrency } from "@/lib/tournament-logic";
import { themeVars } from "@/lib/theme";

export default function JoinPage() {
  const { t } = useI18n();
  const params = useParams<{ token: string }>();
  const { data, error, loading } = useTournamentPoll<any>(
    params.token ? `/api/join/${params.token}` : null,
    3000
  );
  const [rebuySent, setRebuySent] = useState(false);

  if (loading && !data)
    return <div className="min-h-screen flex items-center justify-center text-neutral-400">{t("common_loading")}</div>;
  if (error && !data)
    return <div className="min-h-screen flex items-center justify-center text-red-400 px-6 text-center">{t("common_error")}</div>;
  if (!data) return null;

  const me = data.me;
  const currentLevel = data.levels[data.currentLevelIndex];
  const activePlayers = data.players.filter((p: any) => p.status === "active");
  const myRank = activePlayers.findIndex((p: any) => p.id === me.id) + 1;

  async function requestRebuy() {
    await fetch(`/api/join/${params.token}/rebuy-request`, { method: "POST" });
    setRebuySent(true);
  }

  return (
    <div className="min-h-screen flex flex-col" style={themeVars(data.themeColor)}>
      <header className="grid w-full grid-cols-3 items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-3">
        <div className="flex h-8 sm:h-10 items-center justify-start">
          {data.appLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.appLogoUrl} alt="" className="max-h-full max-w-[6rem] object-contain" />
          )}
        </div>
        <div className="flex items-center justify-center">
          <a
            href="https://www.abyleyva.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-400 transition-colors hover:text-accent-400"
          >
            by AbyLeyva
          </a>
        </div>
        <div className="flex h-8 sm:h-10 items-center justify-end">
          {data.tournamentLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.tournamentLogoUrl} alt="" className="max-h-full max-w-[6rem] object-contain" />
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-white mb-1">{data.name}</h1>
        <p className="text-neutral-400 mb-6">{t("join_title")}: {me.name}</p>

        {data.status === "draft" && (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-neutral-400">
            {t("join_not_started")}
          </p>
        )}

        {me.status === "eliminated" ? (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-neutral-300">
            {t("join_eliminated_msg")} {me.finishPosition ? `(#${me.finishPosition})` : ""}
          </p>
        ) : (
          <>
            {currentLevel && (data.status === "running" || data.status === "paused") && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-center mb-6">
                <p className="font-mono text-5xl font-bold text-white">{formatClock(data.remainingSeconds)}</p>
                {!currentLevel.isBreak ? (
                  <p className="mt-2 text-2xl font-semibold text-accent-400">
                    {currentLevel.smallBlind}/{currentLevel.bigBlind}
                    {currentLevel.ante ? ` · ${t("clock_ante")} ${currentLevel.ante}` : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-xl font-semibold text-amber-400">{currentLevel.breakLabel}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-white">{me.chipCount?.toLocaleString()}</p>
                <p className="text-xs text-neutral-500">{t("join_your_stack")}</p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {myRank > 0 ? `${myRank} / ${activePlayers.length}` : "-"}
                </p>
                <p className="text-xs text-neutral-500">{t("join_your_position")}</p>
              </div>
            </div>

            {data.allowRebuy && (
              <button
                onClick={requestRebuy}
                disabled={rebuySent || me.requestedRebuy}
                className="w-full mb-6 rounded-xl bg-accent-600 px-4 py-2.5 font-semibold text-white hover:bg-accent-500 disabled:opacity-50"
              >
                {rebuySent || me.requestedRebuy ? t("join_request_rebuy_sent") : t("join_request_rebuy")}
              </button>
            )}
          </>
        )}

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="font-semibold text-white mb-3">{t("join_leaderboard")}</h2>
          <div className="mb-3 text-sm text-neutral-400">
            {t("display_prize_pool")}: {formatCurrency(data.prizePool, data.currency, "es-MX")}
          </div>
          <ol className="space-y-2">
            {data.players.map((p: any, idx: number) => (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  p.id === me.id ? "bg-accent-900/30 text-accent-300" : "text-neutral-300"
                } ${p.status === "eliminated" ? "opacity-50" : ""}`}
              >
                <span>
                  {idx + 1}. {p.name}
                </span>
                <span>{p.status === "active" ? p.chipCount?.toLocaleString() : `#${p.finishPosition ?? "-"}`}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
