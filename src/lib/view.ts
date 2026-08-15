import { blindLevels, players, prizes, tournaments } from "@/db/schema";
import {
  computePrizePayouts,
  computePrizePool,
  secondsRemaining,
} from "./tournament-logic";

type Tournament = typeof tournaments.$inferSelect;
type Level = typeof blindLevels.$inferSelect;
type Player = typeof players.$inferSelect;
type Prize = typeof prizes.$inferSelect;

export function serializeTournament(params: {
  tournament: Tournament;
  levels: Level[];
  players: Player[];
  prizes: Prize[];
  isAdmin: boolean;
  origin: string;
}) {
  const { tournament, levels, players: playerRows, prizes: prizeRows, isAdmin, origin } = params;
  const now = new Date();

  const entriesCount = playerRows.length;
  const totalRebuys = playerRows.reduce((sum, p) => sum + (p.rebuysCount ?? 0), 0);
  const totalAddOns = playerRows.reduce((sum, p) => sum + (p.addOnsCount ?? 0), 0);

  const pool = computePrizePool({
    entriesCount,
    buyIn: tournament.buyIn,
    totalRebuys,
    rebuyPrice: tournament.rebuyPrice,
    totalAddOns,
    addOnPrice: tournament.addOnPrice,
  });

  const payouts = computePrizePayouts(
    pool,
    prizeRows.map((p) => ({ position: p.position, percentage: p.percentage }))
  );

  const remaining = secondsRemaining(
    {
      status: tournament.status,
      currentLevelIndex: tournament.currentLevelIndex,
      levelEndsAt: tournament.levelEndsAt,
      remainingSeconds: tournament.remainingSeconds,
    },
    now
  );

  const activeCount = playerRows.filter((p) => p.status === "active").length;
  const totalChips = playerRows
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.chipCount ?? 0), 0);
  const averageStack = activeCount > 0 ? Math.round(totalChips / activeCount) : 0;

  return {
    id: tournament.id,
    name: tournament.name,
    language: tournament.language,
    currency: tournament.currency,
    buyIn: tournament.buyIn,
    startingStack: tournament.startingStack,
    allowRebuy: tournament.allowRebuy,
    rebuyPrice: tournament.rebuyPrice,
    rebuyStack: tournament.rebuyStack,
    maxRebuys: tournament.maxRebuys,
    allowAddOn: tournament.allowAddOn,
    addOnPrice: tournament.addOnPrice,
    addOnStack: tournament.addOnStack,
    status: tournament.status,
    currentLevelIndex: tournament.currentLevelIndex,
    remainingSeconds: remaining,
    serverTime: now.toISOString(),
    isAdmin,
    adminToken: isAdmin ? tournament.adminToken : undefined,
    displayUrl: `${origin}/tournaments/${tournament.id}/display`,
    adminUrl: isAdmin ? `${origin}/tournaments/${tournament.id}/admin?admin=${tournament.adminToken}` : undefined,
    levels: levels.map((l) => ({
      id: l.id,
      order: l.order,
      isBreak: l.isBreak,
      smallBlind: l.smallBlind,
      bigBlind: l.bigBlind,
      ante: l.ante,
      durationMinutes: l.durationMinutes,
      breakLabel: l.breakLabel,
    })),
    prizePool: Math.round(pool * 100) / 100,
    payouts,
    stats: { entriesCount, activeCount, averageStack, totalRebuys, totalAddOns },
    players: playerRows
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        if (a.status === "active") return (b.chipCount ?? 0) - (a.chipCount ?? 0);
        return (a.finishPosition ?? 999) - (b.finishPosition ?? 999);
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        chipCount: p.chipCount,
        rebuysCount: p.rebuysCount,
        addOnsCount: p.addOnsCount,
        finishPosition: p.finishPosition,
        joined: !!p.joinedAt,
        requestedRebuy: p.requestedRebuy,
        ...(isAdmin
          ? {
              email: p.email,
              inviteToken: p.inviteToken,
              inviteUrl: `${origin}/join/${p.inviteToken}`,
            }
          : {}),
      })),
  };
}

export type SerializedTournament = ReturnType<typeof serializeTournament>;
