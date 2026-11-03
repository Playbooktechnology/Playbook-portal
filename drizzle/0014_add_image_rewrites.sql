-- IF NOT EXISTS, same pattern as 0010-0013: safe to apply ahead of the
-- deploy. A new table only lib/images/localize.ts writes and reads (the
-- undo log for images moved to Vercel Blob); nothing public touches it.
CREATE TABLE IF NOT EXISTS "image_rewrites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" text NOT NULL,
	"article_id" text,
	"location" text NOT NULL,
	"old_url" text NOT NULL,
	"new_url" text NOT NULL,
	"reverted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_rewrites_batch_idx" ON "image_rewrites" USING btree ("batch_id");