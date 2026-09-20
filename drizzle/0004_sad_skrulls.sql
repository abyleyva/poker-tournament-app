ALTER TABLE "tournaments" ADD COLUMN "fee_mode" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "fee_value" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "fee_applies_to_rebuy_addon" boolean DEFAULT false NOT NULL;