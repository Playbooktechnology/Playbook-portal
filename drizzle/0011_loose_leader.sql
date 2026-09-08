-- IF NOT EXISTS, matching 0010's pattern: this session applies the column
-- directly against production Postgres (via the HTTP driver, ahead of any
-- deploy) so the hero pin can be set immediately, rather than waiting for
-- this migration to run through the normal predeploy-migrate step on the
-- next production build. Idempotent either way.
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "hero_pinned_until" timestamp with time zone;
