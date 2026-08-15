CREATE TABLE "blind_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"is_break" boolean DEFAULT false NOT NULL,
	"small_blind" integer,
	"big_blind" integer,
	"ante" integer,
	"duration_minutes" integer DEFAULT 15 NOT NULL,
	"break_label" text
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"invite_token" text NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"chip_count" integer,
	"rebuys_count" integer DEFAULT 0 NOT NULL,
	"addons_count" integer DEFAULT 0 NOT NULL,
	"requested_rebuy" boolean DEFAULT false NOT NULL,
	"finish_position" integer,
	"eliminated_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"percentage" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"language" text DEFAULT 'es' NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"buy_in" double precision DEFAULT 0 NOT NULL,
	"starting_stack" integer DEFAULT 10000 NOT NULL,
	"allow_rebuy" boolean DEFAULT false NOT NULL,
	"rebuy_price" double precision,
	"rebuy_stack" integer,
	"max_rebuys" integer,
	"allow_addon" boolean DEFAULT false NOT NULL,
	"addon_price" double precision,
	"addon_stack" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_level_index" integer DEFAULT 0 NOT NULL,
	"level_ends_at" timestamp with time zone,
	"remaining_seconds" integer,
	"admin_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_admin_token_unique" UNIQUE("admin_token")
);
--> statement-breakpoint
ALTER TABLE "blind_levels" ADD CONSTRAINT "blind_levels_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;