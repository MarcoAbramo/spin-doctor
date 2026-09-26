CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_token_hash" varchar(128) NOT NULL,
	"display_name" varchar(40),
	"save_version" integer DEFAULT 1 NOT NULL,
	"save" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_device_token_hash_unique" UNIQUE("device_token_hash")
);
