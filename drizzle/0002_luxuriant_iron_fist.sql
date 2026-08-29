CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"logo_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "logo_url" text;