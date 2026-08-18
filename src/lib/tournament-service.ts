import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blindLevels, players, prizes, tournaments } from "@/db/schema";
import { generateToken } from "./tokens";
import { computeAdvancedClock } from "./tournament-logic";
import { DEFAULT_THEME_COLOR, isThemeColorId } from "./theme";

export type LevelInput = {
  order: number;
  isBreak: boolean;
  smallBlind?: number | null;
  bigBlind?: number | null;
  ante?: number | null;
  durationMinutes: number;
  breakLabel?: string | null;
};

export type PrizeInputRow = { position: number; percentage: number };

export type CreateTournamentInput = {
  name: string;
  language?: string;
  currency: string;
  buyIn: number;
  startingStack: number;
  allowRebuy: boolean;
  rebuyPrice?: number | null;
  rebuyStack?: number | null;
  maxRebuys?: number | null;
  allowAddOn: boolean;
  addOnPrice?: number | null;
  addOnStack?: number | null;
  themeColor?: string | null;
  levels: LevelInput[];
  prizes: PrizeInputRow[];
};

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}
export class ValidationError extends Error {}

export async function createTournament(input: CreateTournamentInput) {
  if (!input.name?.trim()) throw new ValidationError("El nombre del torneo es obligatorio.");
  if (!input.levels || input.levels.length === 0)
    throw new ValidationError("Debes definir al menos un nivel de ciegas.");

  const adminToken = generateToken();

  const [tournament] = await db
    .insert(tournaments)
    .values({
      name: input.name.trim(),
      language: input.language ?? "es",
      currency: input.currency,
      buyIn: input.buyIn,
      startingStack: input.startingStack,
      allowRebuy: input.allowRebuy,
      rebuyPrice: input.allowRebuy ? input.rebuyPrice ?? 0 : null,
      rebuyStack: input.allowRebuy ? input.rebuyStack ?? input.startingStack : null,
      maxRebuys: input.allowRebuy ? input.maxRebuys ?? null : null,
      allowAddOn: input.allowAddOn,
      addOnPrice: input.allowAddOn ? input.addOnPrice ?? 0 : null,
      addOnStack: input.allowAddOn ? input.addOnStack ?? input.startingStack : null,
      themeColor: isThemeColorId(input.themeColor) ? input.themeColor : DEFAULT_THEME_COLOR,
      status: "draft",
      currentLevelIndex: 0,
      adminToken,
    })
    .returning();

  if (input.levels.length > 0) {
    await db.insert(blindLevels).values(
      input.levels.map((lvl) => ({
        tournamentId: tournament.id,
        order: lvl.order,
        isBreak: lvl.isBreak,
        smallBlind: lvl.isBreak ? null : lvl.smallBlind ?? null,
        bigBlind: lvl.isBreak ? null : lvl.bigBlind ?? null,
        ante: lvl.isBreak ? null : lvl.ante ?? null,
        durationMinutes: lvl.durationMinutes,
        breakLabel: lvl.isBreak ? lvl.breakLabel ?? "Descanso" : null,
      }))
    );
  }

  if (input.prizes.length > 0) {
    await db.insert(prizes).values(
      input.prizes.map((p) => ({
        tournamentId: tournament.id,
        position: p.position,
        percentage: p.percentage,
      }))
    );
  }

  return tournament;
}

async function fetchFull(tournamentId: string) {
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
  });
  if (!tournament) throw new NotFoundError("Torneo no encontrado.");

  const [levels, playerRows, prizeRows] = await Promise.all([
    db.query.blindLevels.findMany({
      where: eq(blindLevels.tournamentId, tournamentId),
      orderBy: (t, { asc }) => [asc(t.order)],
    }),
    db.query.players.findMany({
      where: eq(players.tournamentId, tournamentId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    }),
    db.query.prizes.findMany({
      where: eq(prizes.tournamentId, tournamentId),
      orderBy: (t, { asc }) => [asc(t.position)],
    }),
  ]);

  return { tournament, levels, players: playerRows, prizes: prizeRows };
}

/** Advances the clock if needed (server-authoritative) and persists the change. */
async function tick(tournamentId: string) {
  const { tournament, levels, players: playerRows, prizes: prizeRows } = await fetchFull(
    tournamentId
  );

  const advanced = computeAdvancedClock(
    {
      status: tournament.status,
      currentLevelIndex: tournament.currentLevelIndex,
      levelEndsAt: tournament.levelEndsAt,
      remainingSeconds: tournament.remainingSeconds,
    },
    levels.map((l) => ({ durationMinutes: l.durationMinutes })),
    new Date()
  );

  const changed =
    advanced.status !== tournament.status ||
    advanced.currentLevelIndex !== tournament.currentLevelIndex ||
    advanced.levelEndsAt?.getTime() !== tournament.levelEndsAt?.getTime();

  if (changed) {
    await db
      .update(tournaments)
      .set({
        status: advanced.status,
        currentLevelIndex: advanced.currentLevelIndex,
        levelEndsAt: advanced.levelEndsAt,
        remainingSeconds: advanced.remainingSeconds,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, tournamentId));

    return {
      tournament: { ...tournament, ...advanced },
      levels,
      players: playerRows,
      prizes: prizeRows,
    };
  }

  return { tournament, levels, players: playerRows, prizes: prizeRows };
}

export async function getTournamentState(tournamentId: string) {
  return tick(tournamentId);
}

export function assertAdmin(tournamentAdminToken: string, provided: string | null | undefined) {
  if (!provided || provided !== tournamentAdminToken) {
    throw new ForbiddenError("Token de administrador inválido.");
  }
}

export async function updateTournamentSettings(
  tournamentId: string,
  adminToken: string,
  patch: Partial<CreateTournamentInput>
) {
  const { tournament } = await fetchFull(tournamentId);
  assertAdmin(tournament.adminToken, adminToken);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.language !== undefined) updates.language = patch.language;
  if (patch.currency !== undefined) updates.currency = patch.currency;
  if (patch.buyIn !== undefined) updates.buyIn = patch.buyIn;
  if (patch.startingStack !== undefined) updates.startingStack = patch.startingStack;
  if (patch.allowRebuy !== undefined) updates.allowRebuy = patch.allowRebuy;
  if (patch.rebuyPrice !== undefined) updates.rebuyPrice = patch.rebuyPrice;
  if (patch.rebuyStack !== undefined) updates.rebuyStack = patch.rebuyStack;
  if (patch.maxRebuys !== undefined) updates.maxRebuys = patch.maxRebuys;
  if (patch.allowAddOn !== undefined) updates.allowAddOn = patch.allowAddOn;
  if (patch.addOnPrice !== undefined) updates.addOnPrice = patch.addOnPrice;
  if (patch.addOnStack !== undefined) updates.addOnStack = patch.addOnStack;
  if (patch.themeColor !== undefined && isThemeColorId(patch.themeColor)) {
    updates.themeColor = patch.themeColor;
  }

  await db.update(tournaments).set(updates).where(eq(tournaments.id, tournamentId));

  if (patch.levels) {
    await db.delete(blindLevels).where(eq(blindLevels.tournamentId, tournamentId));
    if (patch.levels.length > 0) {
      await db.insert(blindLevels).values(
        patch.levels.map((lvl) => ({
          tournamentId,
          order: lvl.order,
          isBreak: lvl.isBreak,
          smallBlind: lvl.isBreak ? null : lvl.smallBlind ?? null,
          bigBlind: lvl.isBreak ? null : lvl.bigBlind ?? null,
          ante: lvl.isBreak ? null : lvl.ante ?? null,
          durationMinutes: lvl.durationMinutes,
          breakLabel: lvl.isBreak ? lvl.breakLabel ?? "Descanso" : null,
        }))
      );
    }
  }

  if (patch.prizes) {
    await db.delete(prizes).where(eq(prizes.tournamentId, tournamentId));
    if (patch.prizes.length > 0) {
      await db.insert(prizes).values(
        patch.prizes.map((p) => ({ tournamentId, position: p.position, percentage: p.percentage }))
      );
    }
  }

  return fetchFull(tournamentId);
}

export type ControlAction = "start" | "pause" | "resume" | "next" | "prev" | "reset" | "seek";

export type ControlPayload = { seekSeconds?: number };

export async function controlTournament(
  tournamentId: string,
  adminToken: string,
  action: ControlAction,
  payload: ControlPayload = {}
) {
  const { tournament, levels } = await tick(tournamentId);
  assertAdmin(tournament.adminToken, adminToken);

  if (levels.length === 0) {
    throw new ValidationError("Define al menos un nivel antes de iniciar el reloj.");
  }

  const now = new Date();
  let update: Partial<typeof tournaments.$inferInsert> = {};

  switch (action) {
    case "start": {
      update = {
        status: "running",
        currentLevelIndex: 0,
        levelEndsAt: new Date(now.getTime() + levels[0].durationMinutes * 60_000),
        remainingSeconds: null,
      };
      break;
    }
    case "pause": {
      if (tournament.status !== "running") break;
      const remaining = tournament.levelEndsAt
        ? Math.max(0, Math.round((tournament.levelEndsAt.getTime() - now.getTime()) / 1000))
        : 0;
      update = { status: "paused", levelEndsAt: null, remainingSeconds: remaining };
      break;
    }
    case "resume": {
      if (tournament.status !== "paused") break;
      const remaining = tournament.remainingSeconds ?? levels[tournament.currentLevelIndex].durationMinutes * 60;
      update = {
        status: "running",
        levelEndsAt: new Date(now.getTime() + remaining * 1000),
        remainingSeconds: null,
      };
      break;
    }
    case "next": {
      const nextIndex = Math.min(tournament.currentLevelIndex + 1, levels.length - 1);
      const finished = tournament.currentLevelIndex + 1 >= levels.length;
      if (finished) {
        update = { status: "finished", currentLevelIndex: levels.length - 1, levelEndsAt: null, remainingSeconds: 0 };
      } else {
        const dur = levels[nextIndex].durationMinutes * 60_000;
        update =
          tournament.status === "paused"
            ? { currentLevelIndex: nextIndex, remainingSeconds: Math.round(dur / 1000) }
            : { currentLevelIndex: nextIndex, status: "running", levelEndsAt: new Date(now.getTime() + dur) };
      }
      break;
    }
    case "prev": {
      const prevIndex = Math.max(tournament.currentLevelIndex - 1, 0);
      const dur = levels[prevIndex].durationMinutes * 60_000;
      update =
        tournament.status === "paused"
          ? { currentLevelIndex: prevIndex, remainingSeconds: Math.round(dur / 1000) }
          : { currentLevelIndex: prevIndex, status: "running", levelEndsAt: new Date(now.getTime() + dur) };
      break;
    }
    case "reset": {
      update = { status: "draft", currentLevelIndex: 0, levelEndsAt: null, remainingSeconds: null };
      break;
    }
    case "seek": {
      if (tournament.status !== "running" && tournament.status !== "paused") break;

      const totalSeconds = levels.reduce((sum, l) => sum + l.durationMinutes * 60, 0);
      if (totalSeconds <= 0) break;

      const target = Math.min(
        Math.max(0, Math.round(payload.seekSeconds ?? 0)),
        Math.max(0, totalSeconds - 1)
      );

      let acc = 0;
      let levelIndex = levels.length - 1;
      let remainingInLevel = 1;
      for (let i = 0; i < levels.length; i++) {
        const durSec = levels[i].durationMinutes * 60;
        if (target < acc + durSec) {
          levelIndex = i;
          remainingInLevel = Math.max(1, acc + durSec - target);
          break;
        }
        acc += durSec;
      }

      update =
        tournament.status === "paused"
          ? { currentLevelIndex: levelIndex, remainingSeconds: remainingInLevel }
          : {
              currentLevelIndex: levelIndex,
              status: "running",
              levelEndsAt: new Date(now.getTime() + remainingInLevel * 1000),
            };
      break;
    }
  }

  await db
    .update(tournaments)
    .set({ ...update, updatedAt: now })
    .where(eq(tournaments.id, tournamentId));

  return fetchFull(tournamentId);
}

export async function addPlayer(
  tournamentId: string,
  adminToken: string,
  data: { name: string; email?: string | null }
) {
  const { tournament } = await fetchFull(tournamentId);
  assertAdmin(tournament.adminToken, adminToken);
  if (!data.name?.trim()) throw new ValidationError("El nombre del jugador es obligatorio.");

  const [player] = await db
    .insert(players)
    .values({
      tournamentId,
      name: data.name.trim(),
      email: data.email?.trim() || null,
      inviteToken: generateToken(12),
      status: "active",
      chipCount: tournament.startingStack,
    })
    .returning();

  return player;
}

export type PlayerPatch = {
  chipCount?: number | null;
  eliminate?: boolean;
  finishPosition?: number | null;
  reactivate?: boolean;
  rebuy?: boolean;
  addOn?: boolean;
  clearRebuyRequest?: boolean;
};

export async function updatePlayer(
  tournamentId: string,
  playerId: string,
  adminToken: string,
  patch: PlayerPatch
) {
  const { tournament } = await fetchFull(tournamentId);
  assertAdmin(tournament.adminToken, adminToken);

  const player = await db.query.players.findFirst({
    where: and(eq(players.id, playerId), eq(players.tournamentId, tournamentId)),
  });
  if (!player) throw new NotFoundError("Jugador no encontrado.");

  const updates: Record<string, unknown> = {};

  if (patch.chipCount !== undefined) updates.chipCount = patch.chipCount;
  if (patch.eliminate) {
    updates.status = "eliminated";
    updates.eliminatedAt = new Date();
    if (patch.finishPosition != null) updates.finishPosition = patch.finishPosition;
  }
  if (patch.reactivate) {
    updates.status = "active";
    updates.eliminatedAt = null;
    updates.finishPosition = null;
  }
  if (patch.rebuy) {
    updates.rebuysCount = (player.rebuysCount ?? 0) + 1;
    updates.chipCount = (player.chipCount ?? 0) + (tournament.rebuyStack ?? tournament.startingStack);
    updates.status = "active";
    updates.requestedRebuy = false;
  }
  if (patch.addOn) {
    updates.addOnsCount = (player.addOnsCount ?? 0) + 1;
    updates.chipCount = (player.chipCount ?? 0) + (tournament.addOnStack ?? tournament.startingStack);
  }
  if (patch.clearRebuyRequest) updates.requestedRebuy = false;

  await db.update(players).set(updates).where(eq(players.id, playerId));

  return db.query.players.findFirst({ where: eq(players.id, playerId) });
}

export async function removePlayer(tournamentId: string, playerId: string, adminToken: string) {
  const { tournament } = await fetchFull(tournamentId);
  assertAdmin(tournament.adminToken, adminToken);
  await db.delete(players).where(and(eq(players.id, playerId), eq(players.tournamentId, tournamentId)));
}

export async function getPlayerByToken(token: string) {
  const player = await db.query.players.findFirst({ where: eq(players.inviteToken, token) });
  if (!player) throw new NotFoundError("Invitación no encontrada.");

  if (!player.joinedAt) {
    await db.update(players).set({ joinedAt: new Date() }).where(eq(players.id, player.id));
    player.joinedAt = new Date();
  }

  const full = await tick(player.tournamentId);
  return { player, ...full };
}

export async function requestRebuy(token: string) {
  const player = await db.query.players.findFirst({ where: eq(players.inviteToken, token) });
  if (!player) throw new NotFoundError("Invitación no encontrada.");
  await db.update(players).set({ requestedRebuy: true }).where(eq(players.id, player.id));
}
