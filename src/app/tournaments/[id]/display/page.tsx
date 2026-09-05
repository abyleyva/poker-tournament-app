"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTournamentPoll } from "@/lib/use-tournament-poll";
import { formatClock, formatCurrency, isBubblePhase, secondsUntilNextBreak } from "@/lib/tournament-logic";
import { TournamentTimeline } from "@/components/tournament-timeline";
import { themeVars } from "@/lib/theme";
import { EliminationCard, type EliminationEvent } from "@/components/elimination-card";
import { WinnerCelebration } from "@/components/winner-celebration";
import { BubbleBanner } from "@/components/bubble-banner";

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

/**
 * Watches the polled player list and queues one EliminationEvent per player
 * that newly transitions to "eliminated" since the last poll. Players who
 * are already eliminated on the very first load (display opened mid-tournament)
 * are recorded silently so we don't replay the whole history as a burst of cards.
 */
function useEliminationQueue(data: any) {
  const alertedIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [queue, setQueue] = useState<EliminationEvent[]>([]);
  const [current, setCurrent] = useState<EliminationEvent | null>(null);

  useEffect(() => {
    if (!data?.players) return;
    const eliminated = data.players.filter((p: any) => p.status === "eliminated");

    if (!initialized.current) {
      eliminated.forEach((p: any) => alertedIds.current.add(p.id));
      initialized.current = true;
      return;
    }

    // Forget anyone who was previously eliminated but is no longer (they were
    // reactivated), so if they get eliminated again the card fires a second time.
    const eliminatedIds = new Set(eliminated.map((p: any) => p.id));
    for (const id of Array.from(alertedIds.current)) {
      if (!eliminatedIds.has(id)) alertedIds.current.delete(id);
    }

    const fresh = eliminated.filter((p: any) => !alertedIds.current.has(p.id));
    if (fresh.length === 0) return;
    fresh.forEach((p: any) => alertedIds.current.add(p.id));

    const payouts: { position: number; amount: number }[] = data.payouts ?? [];
    const paidPositions = payouts.length;

    // 2nd place (the runner-up) skips the regular elimination card entirely —
    // once they bust out, only the winner is left and the tournament is over,
    // so the WinnerCelebration overlay takes over instead (see DisplayPage).
    const newEvents = fresh
      .filter((p: any) => (p.finishPosition ?? null) !== 2)
      .map((p: any) => {
        const finishPosition: number | null = p.finishPosition ?? null;
        const payout = finishPosition != null ? payouts.find((x) => x.position === finishPosition) : undefined;
        const isBubble = paidPositions > 0 && finishPosition === paidPositions + 1;
        const isCashed = !!payout && finishPosition != null && finishPosition > 2;
        return {
          id: p.id,
          name: p.name,
          finishPosition,
          remaining: data.stats.activeCount,
          prizeAmount: isCashed ? payout!.amount : null,
          isBubble,
          currency: data.currency,
        };
      });

    if (newEvents.length > 0) {
      setQueue((q) => [...q, ...newEvents]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [queue, current]);

  return { current, dismiss: () => setCurrent(null) };
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
  const { current: eliminationEvent, dismiss: dismissElimination } = useEliminationQueue(data);
  const [winnerDismissed, setWinnerDismissed] = useState(false);

  if (loading && !data)
    return <div className="min-h-screen flex items-center justify-center text-neutral-400 text-xl">{t("common_loading")}</div>;
  if (error && !data)
    return <div className="min-h-screen flex items-center justify-center text-red-400 text-xl">{t("common_error")}</div>;
  if (!data) return null;

  const currentLevel = data.levels[data.currentLevelIndex];
  const nextLevel = data.levels[data.currentLevelIndex + 1];
  const isLowTime = isRunning && display <= 30;
  const isBreak = currentLevel?.isBreak;
  const secondsToBreak = secondsUntilNextBreak(data.levels, data.currentLevelIndex, display);
  // Human-facing level number: counts only blind levels (breaks aren't numbered).
  const levelNumber =
    currentLevel && !isBreak
      ? 1 + data.levels.slice(0, data.currentLevelIndex).filter((l: any) => !l.isBreak).length
      : null;

  const bubblePhase = isBubblePhase(data.payouts?.length ?? 0, data.stats.activeCount, data.status);

  // The runner-up busting out auto-finishes the tournament server-side (see
  // updatePlayer in tournament-service.ts) — that combination (finished +
  // exactly one player still active) is what distinguishes "we have a
  // winner" from a tournament that simply ran out of clock time.
  const winner = data.status === "finished" && data.stats.activeCount === 1 ? data.players.find((p: any) => p.status === "active") : null;
  const winnerResults = winner
    ? data.players.map((p: any, idx: number) => ({
        id: p.id,
        name: p.name,
        rank: idx === 0 ? 1 : p.finishPosition ?? idx + 1,
      }))
    : null;

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col ${isBreak ? "" : "bg-neutral-950"}`}
      style={{
        ...themeVars(data.themeColor),
        ...(isBreak
          ? { background: "radial-gradient(ellipse 120% 65% at 50% 100%, #92400e 0%, #451a03 55%, #000000 100%)" }
          : {}),
      }}
    >
      <header
        className={`grid w-full shrink-0 grid-cols-3 items-center gap-4 border-b border-white/10 px-6 py-2 sm:px-10 sm:py-3 ${
          isBreak ? "bg-gradient-to-b from-black/40 to-transparent" : "bg-black/20"
        }`}
      >
        <div className="flex h-8 sm:h-11 items-center justify-start">
          {data.appLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.appLogoUrl} alt="" className="max-h-full max-w-[8rem] sm:max-w-[12rem] object-contain" />
          )}
        </div>
        <div className="flex items-center justify-center">
          <a
            href="https://www.abyleyva.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm sm:text-base text-neutral-400 transition-colors hover:text-accent-400"
          >
            by AbyLeyva
          </a>
        </div>
        <div className="flex h-8 sm:h-11 items-center justify-end">
          {data.tournamentLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.tournamentLogoUrl} alt="" className="max-h-full max-w-[8rem] sm:max-w-[12rem] object-contain" />
          )}
        </div>
      </header>

      {bubblePhase && <BubbleBanner />}

      <div className="flex flex-1 min-h-0 flex-col items-center justify-center overflow-hidden px-6 py-[1vh]">
        <h1 className="text-[clamp(1.5rem,4.2vh,3.75rem)] font-extrabold uppercase tracking-wide text-white mb-[clamp(0.4rem,1.6vh,2rem)] text-center">
          {data.name}
        </h1>

        {data.status === "draft" && (
          <p className="text-2xl text-neutral-400 text-center">{t("display_waiting")}</p>
        )}

        {data.status === "finished" && !winnerResults && (
          <p className="text-[clamp(1.75rem,5.5vh,3.75rem)] font-bold text-accent-600 text-center">{t("display_finished")}</p>
        )}

        {(data.status === "running" || data.status === "paused") && currentLevel && (
          <>
            {isBreak ? (
              <p className="text-[clamp(1.1rem,2.6vh,1.875rem)] font-bold text-amber-400 tracking-widest mb-[clamp(0.2rem,0.6vh,0.5rem)]">
                {currentLevel.breakLabel || t("display_break")}
              </p>
            ) : (
              <p className="text-[clamp(0.9rem,2vh,1.5rem)] font-bold uppercase tracking-widest text-neutral-400 mb-[clamp(0.2rem,0.6vh,0.5rem)]">
                {t("display_level_label", { n: levelNumber })}
              </p>
            )}
            <p
              className={`font-mono font-bold leading-none ${
                isLowTime ? "clock-warning text-red-400" : "text-white"
              } text-[min(18vw,17vh)]`}
            >
              {formatClock(display)}
            </p>

            {!isBreak && (
              <p className="mt-[clamp(0.4rem,1.4vh,1.5rem)] text-[clamp(1.3rem,3.6vh,3.75rem)] font-bold text-accent-600">
                {currentLevel.smallBlind} / {currentLevel.bigBlind}
                {currentLevel.ante ? (
                  <span className="text-[clamp(0.9rem,2.4vh,2.25rem)] text-neutral-400"> · {t("clock_ante")} {currentLevel.ante}</span>
                ) : null}
              </p>
            )}

            {nextLevel && (
              <p className="mt-[clamp(0.25rem,0.9vh,1rem)] text-[clamp(0.8rem,1.5vh,1.5rem)] text-neutral-500">
                {t("clock_next_level")}:{" "}
                {nextLevel.isBreak
                  ? nextLevel.breakLabel
                  : `${nextLevel.smallBlind} / ${nextLevel.bigBlind}${
                      nextLevel.ante ? ` · ${t("clock_ante")} ${nextLevel.ante}` : ""
                    }`}
              </p>
            )}

            <div className="mt-[clamp(0.4rem,1.8vh,2rem)] w-full max-w-3xl">
              <TournamentTimeline
                levels={data.levels}
                currentLevelIndex={data.currentLevelIndex}
                remainingSeconds={display}
              />
              <p className="mt-[clamp(0.15rem,0.5vh,0.5rem)] text-center text-sm text-neutral-500">
                {isBreak
                  ? t("clock_on_break")
                  : secondsToBreak == null
                  ? t("clock_no_more_breaks")
                  : t("clock_next_break_in", { n: Math.max(1, Math.ceil(secondsToBreak / 60)) })}
              </p>
            </div>
          </>
        )}

        <div className="mt-[clamp(0.5rem,2.2vh,2.5rem)] grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-[clamp(1.1rem,2.4vh,2.25rem)] font-bold text-white">{data.stats.activeCount}</p>
            <p className="text-sm text-neutral-500">{t("clock_players_left")}</p>
          </div>
          <div>
            <p className="text-[clamp(1.1rem,2.4vh,2.25rem)] font-bold text-white">{data.stats.entriesCount}</p>
            <p className="text-sm text-neutral-500">{t("display_entries")}</p>
          </div>
          <div>
            <p className="text-[clamp(1.1rem,2.4vh,2.25rem)] font-bold text-accent-600">
              {formatCurrency(data.prizePool, data.currency, "es-MX")}
            </p>
            <p className="text-sm text-neutral-500">{t("display_prize_pool")}</p>
          </div>
        </div>

        <p className="mt-[clamp(0.5rem,2vh,2.5rem)] text-sm text-neutral-600 text-center">{t("display_scan_hint")}</p>
      </div>

      {eliminationEvent && <EliminationCard event={eliminationEvent} onDone={dismissElimination} />}

      {winnerResults && !winnerDismissed && (
        <WinnerCelebration
          results={winnerResults}
          payouts={data.payouts ?? []}
          currency={data.currency}
          name={data.name}
          appLogoUrl={data.appLogoUrl}
          tournamentLogoUrl={data.tournamentLogoUrl}
          onClose={() => setWinnerDismissed(true)}
        />
      )}
    </div>
  );
}
