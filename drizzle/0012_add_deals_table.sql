-- IF NOT EXISTS, matching 0010/0011: this table is applied directly against
-- production Postgres ahead of the deploy so the branch's Vercel preview
-- (which shares the production database but never runs migrations) can read
-- it. The production build's predeploy-migrate then no-ops on it.
CREATE TABLE IF NOT EXISTS "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" text NOT NULL,
	"brand" text NOT NULL,
	"counterparty" text NOT NULL,
	"type" text NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"sport" text DEFAULT '' NOT NULL,
	"duration" text DEFAULT '' NOT NULL,
	"amount_usd" bigint,
	"amount_disclosed" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'reportado' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"article_url" text DEFAULT '' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"playbook_read" text,
	"key_figures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
