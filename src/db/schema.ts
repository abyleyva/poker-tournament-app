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

  // "Dealer add-on": propina opcional para los dealers, ofrecida antes de
  // iniciar el torneo. A diferencia del rebuy/add-on normal, esto NO se
  // registra por jugador ni se descuenta de la bolsa de premios — es dinero
  // que se queda directamente con los dealers como agradecimiento por su
  // servicio, nunca del organizador ni de los jugadores que compiten por el
  // premio. Solo se usa para la pestaña "Chips Summary" (planeación de
  // cuántas fichas físicas llevar), ver src/lib/tournament-logic.ts.
  allowDealerAddOn: boolean("allow_dealer_addon").notNull().default(false),
  dealerAddOnPrice: doublePrecision("dealer_addon_price"),
  dealerAddOnStack: integer("dealer_addon_stack"),

  // Campos manuales de planeación para la pestaña "Chips Summary": cuántos
  // jugadores/recompras/add-ons/dealer add-ons se esperan en total, usados
  // solo para calcular cuántas fichas físicas de cada denominación hay que
  // llevar al torneo. Independientes de los jugadores reales ya registrados
  // (el torneo puede seguir en "draft" sin nadie inscrito todavía).
  expectedPlayers: integer("expected_players"),
  expectedRebuys: integer("expected_rebuys"),
  expectedAddOns: integer("expected_add_ons"),
  expectedDealerAddOns: integer("expected_dealer_add_ons"),

  // Cuánto retiene el organizador de cada buy-in (y, si feeAppliesToRebuyAddOn,
  // de cada recompra/add-on) como cuota de administración/gestión/logística,
  // antes de calcular la bolsa de premios. "none" por defecto — sin cambios
  // de comportamiento para torneos ya existentes. Ver src/lib/organizer-fee.ts.
  // Bloqueado (server-side) una vez que el torneo deja de estar en "draft".
  feeMode: text("fee_mode").notNull().default("none"), // "none" | "percentage" | "fixed"
  feeValue: doublePrecision("fee_value").notNull().default(0),
  feeAppliesToRebuyAddOn: boolean("fee_applies_to_rebuy_addon").notNull().default(false),

  status: text("status").notNull().default("draft"), // draft | running | paused | finished
  currentLevelIndex: integer("current_level_index").notNull().default(0),
  levelEndsAt: timestamp("level_ends_at", { withTimezone: true }),
  remainingSeconds: integer("remaining_seconds"),

  // Accent color applied across the tournament's clock/admin/player screens.
  // One of the ids in src/lib/theme.ts (THEME_COLORS) — "emerald" by default.
  themeColor: text("theme_color").notNull().default("emerald"),

  // Which sections show on the public clock display (/display). One of the
  // ids in src/lib/screen-layout.ts — "all_data" by default (shows
  // everything, matching the app's original display before this setting
  // existed).
  screenLayout: text("screen_layout").notNull().default("all_data"),

  // Per-tournament logo (data URL), shown on the public display and the
  // player invite screen alongside the app-wide logo (see appSettings).
  logoUrl: text("logo_url"),

  adminToken: text("admin_token").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Single-row table holding app-wide settings that apply across every
// tournament (currently just the app's own logo). Always read/written with
// id = "global".
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(),
  logoUrl: text("logo_url"),
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

// Physical chip denominations used to plan how many chips (per color/value)
// are needed for the tournament — purely a logistics/planning tool for the
// "Chips Summary" tab, with no effect on prize pool math or player chip
// counts. Rows are grouped by `phase` (which entry type they belong to:
// the initial stack, a rebuy, an add-on, or the dealer add-on) and replaced
// wholesale on save, the same pattern used for `levels` and `prizes`.
export const chipDenominations = pgTable("chip_denominations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  phase: text("phase").notNull(), // "initial" | "rebuy" | "addon" | "dealer_addon"
  order: integer("order").notNull(),
  value: doublePrecision("value").notNull(),
  color: text("color").notNull(),
  count: integer("count").notNull(),
});

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  blindLevels: many(blindLevels),
  players: many(players),
  prizes: many(prizes),
  chipDenominations: many(chipDenominations),
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

export const chipDenominationsRelations = relations(chipDenominations, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [chipDenominations.tournamentId],
    references: [tournaments.id],
  }),
}));
