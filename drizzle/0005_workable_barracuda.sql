CREATE TABLE "chip_denominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"phase" text NOT NULL,
	"order" integer NOT NULL,
	"value" double precision NOT NULL,
	"color" text NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "allow_dealer_addon" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "dealer_addon_price" double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "dealer_addon_stack" integer;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "expected_players" integer;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "expected_rebuys" integer;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "expected_add_ons" integer;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "expected_dealer_add_ons" integer;--> statement-breakpoint
ALTER TABLE "chip_denominations" ADD CONSTRAINT "chip_denominations_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;