-- IF NOT EXISTS, same pattern as 0010-0012: applied directly against
-- production Postgres ahead of the deploy so the branch's Vercel preview
-- (shared database, never runs migrations) can use the review queue. A new
-- empty table nothing public reads: production code is unaffected until the
-- deploy, and predeploy-migrate then no-ops on it.
CREATE TABLE IF NOT EXISTS "deal_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"missing" text[] DEFAULT '{}' NOT NULL,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deal_drafts_article_id_unique" UNIQUE("article_id")
);
