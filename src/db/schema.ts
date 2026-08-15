import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  language: text("language").notNull().default("es"),
  currency: text("currency").notNull().default("MXN"),
  buyIn: doublePrecision("buy_in").notNull().default(0),
  startingStack: integer("starting_stack").notNull().default(10000),

  allowRebuy: boolean("allow_rebuy").notNull().default(false),
  rebuyPrice: doublePrecision("rebuy_price"),
  rebuyStack: integer("rebuy_stack"),
  maxRebuys: integer("max_rebuys"),

  allowAddOn: boolean("allow_addon").notNull().default(false),
  addOnPrice: doublePrecision("addon_price"),
  addOnStack: integer("addon_stack"),

  status: text("status").notNull().default("draft"), // draft | running | paused | finished
  currentLevelIndex: integer("current_level_index").notNull().default(0),
  levelEndsAt: timestamp("level_ends_at", { withTimezone: true }),
  remainingSeconds: integer("remaining_seconds"),

  adminToken: text("admin_token").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blindLevels = pgTable("blind_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  isBreak: boolean("is_break").notNull().default(false),
  smallBlind: integer("small_blind"),
  bigBlind: integer("big_blind"),
  ante: integer("ante"),
  durationMinutes: integer("duration_minutes").notNull().default(15),
  breakLabel: text("break_label"),
});

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  inviteToken: text("invite_token").notNull().unique(),
  status: text("status").notNull().default("invited"), // invited | joined | active | eliminated
  chipCount: integer("chip_count"),
  rebuysCount: integer("rebuys_count").notNull().default(0),
  addOnsCount: integer("addons_count").notNull().default(0),
  requestedRebuy: boolean("requested_rebuy").notNull().default(false),
  finishPosition: integer("finish_position"),
  eliminatedAt: timestamp("eliminated_at", { withTimezone: true }),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prizes = pgTable("prizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  percentage: doublePrecision("percentage").notNull(),
});

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  blindLevels: many(blindLevels),
  players: many(players),
  prizes: many(prizes),
}));

export const blindLevelsRelations = relations(blindLevels, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [blindLevels.tournamentId],
    references: [tournaments.id],
  }),
}));

export const playersRelations = relations(players, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [players.tournamentId],
    references: [tournaments.id],
  }),
}));

export const prizesRelations = relations(prizes, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [prizes.tournamentId],
    references: [tournaments.id],
  }),
}));
