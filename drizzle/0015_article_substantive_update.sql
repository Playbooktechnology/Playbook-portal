-- IF NOT EXISTS, same pattern as 0010-0014: safe to apply ahead of the
-- deploy. Two nullable columns on articles for "Actualizado" (a change of
-- substance, written from the CMS's "Actualización de fondo" note). Nothing
-- is renamed or dropped; existing rows stay NULL and render exactly as before.
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "substantive_update_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "substantive_update_note" text;
