// Seeds the 2026-10-22 bridge database: the old Neon project was locked on
// quota, a fresh one was created with an empty schema (scripts/migrate-http.ts),
// and this fills it with what survived outside the old database:
//
//   - articles: the 454 rows of lib/data/articles-snapshot.json (every list
//     column, no body). Each row gets a placeholder body, a short notice
//     plus the excerpt, so the article page renders a real body instead of
//     the outage snapshot path. The body goes through the same
//     TipTap JSON -> generateHTML pipeline as every other write
//     (scripts/update-article.ts explains why body_json and body_html must
//     never drift), so an editor opening one of these rows in the CMS sees
//     the same text the page shows.
//   - site_content: scripts/data/site-content-bridge-2026-10-22.json, the
//     last committed content.json (deleted 2026-08-13, recovered from git)
//     with every field the live site showed differently on 2026-10-22
//     patched in from the live HTML and RSC payload. Fields the public site
//     never renders (video clips, Instagram reels, the testimonials heading,
//     the opinion fallback cards) keep their 2026-08-14 values.
//   - deals: scripts/data/deals-bridge-2026-10-22.json, El Marcador de
//     Negocios' 58 rows as the live /marcador RSC payload carried them
//     (every column but updated_at, which takes created_at). Same ids, so
//     the eventual merge with the old database matches row for row.
//
// Additive only: every insert is ON CONFLICT DO NOTHING, so a re-run (or a
// run against a database that already has real data) never overwrites a
// row. The one exception is an article whose body is still this script's
// placeholder: a re-run refreshes that body (and nothing else), so the
// placeholder's wording can change without touching real text. That is deliberate: when the old database comes back, its full rows
// have to win over these placeholders, and that merge is its own step.
// Placeholder rows are recognizable by BRIDGE_NOTE in body_html.
//
// Usage: npx tsx scripts/seed-bridge-db.ts [--dry-run]

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { articles, deals, siteContent } from '../lib/db/schema';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';

export const BRIDGE_NOTE =
  'Por ahora solo mostramos el resumen de esta nota. El texto completo estará disponible próximamente.';

const SNAPSHOT_PATH = 'lib/data/articles-snapshot.json';
const SITE_CONTENT_PATH = 'scripts/data/site-content-bridge-2026-10-22.json';
const DEALS_PATH = 'scripts/data/deals-bridge-2026-10-22.json';
const BATCH = 50;
const DRY_RUN = process.argv.includes('--dry-run');

type SnapshotRow = typeof articles.$inferSelect & { createdAt: string; updatedAt: string; heroPinnedUntil: string | null };

// One paragraph on purpose: the article page drops its newsletter box at
// the body's paragraph midpoint (lib/split-before-aside.ts), and with two
// paragraphs that box landed between the notice and the excerpt.
function placeholderBody(excerpt: string): { json: JSONContent; html: string } {
  const json: JSONContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', marks: [{ type: 'italic' }], text: BRIDGE_NOTE },
          ...(excerpt ? [{ type: 'hardBreak' }, { type: 'hardBreak' }, { type: 'text', text: excerpt }] : []),
        ],
      },
    ],
  };
  return { json, html: generateHTML(json, TIPTAP_EXTENSIONS) };
}

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is not set');
  const db = drizzle(neon(process.env.POSTGRES_URL), { schema: { articles, deals, siteContent } });
  console.log(`[seed-bridge] target: ${new URL(process.env.POSTGRES_URL).hostname}`);

  const rows = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as SnapshotRow[];
  const values = rows.map(r => {
    const body = placeholderBody(r.excerpt ?? '');
    return {
      ...r,
      bodyJson: body.json as Record<string, unknown>,
      bodyHtml: body.html,
      // 10 snapshot rows lost their teaser in capture; '' is the column default.
      teaser: r.teaser ?? '',
      // No editors from the old database exist here to point at.
      updatedBy: null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      heroPinnedUntil: r.heroPinnedUntil ? new Date(r.heroPinnedUntil) : null,
    };
  });
  const ids = new Set(values.map(v => v.id));
  if (ids.size !== values.length) throw new Error('snapshot has duplicate ids');
  console.log(`[seed-bridge] ${values.length} snapshot articles; sample body: ${values[0].bodyHtml.slice(0, 160)}…`);

  const content = JSON.parse(readFileSync(SITE_CONTENT_PATH, 'utf8')) as Record<string, unknown>;
  console.log(`[seed-bridge] site_content sections: ${Object.keys(content).join(', ')}`);

  const dealRows = (JSON.parse(readFileSync(DEALS_PATH, 'utf8')) as (typeof deals.$inferInsert & { createdAt: string })[]).map(
    d => ({ ...d, createdAt: new Date(d.createdAt), updatedAt: new Date(d.createdAt) }),
  );
  console.log(`[seed-bridge] ${dealRows.length} deals`);

  if (DRY_RUN) {
    console.log('[seed-bridge] dry run, nothing written.');
    return;
  }

  let inserted = 0;
  for (let i = 0; i < values.length; i += BATCH) {
    const res = await db
      .insert(articles)
      .values(values.slice(i, i + BATCH))
      .onConflictDoUpdate({
        target: articles.id,
        set: { bodyJson: sql`excluded.body_json`, bodyHtml: sql`excluded.body_html` },
        setWhere: sql`${articles.bodyHtml} LIKE ${`%${BRIDGE_NOTE}%`}`,
      })
      .returning({ id: articles.id });
    inserted += res.length;
  }
  console.log(`[seed-bridge] articles inserted or placeholder refreshed: ${inserted} (left untouched: ${values.length - inserted})`);

  const sc = await db
    .insert(siteContent)
    .values({ id: 1, data: content, version: 1 })
    .onConflictDoNothing()
    .returning({ id: siteContent.id });
  console.log(`[seed-bridge] site_content: ${sc.length ? 'inserted' : 'already present, left untouched'}`);

  const dl = await db.insert(deals).values(dealRows).onConflictDoNothing().returning({ id: deals.id });
  console.log(`[seed-bridge] deals inserted: ${dl.length} (skipped as already present: ${dealRows.length - dl.length})`);

  const [counts] = await db.execute(
    sql`select (select count(*) from articles)::int as articles, (select count(*) from site_content)::int as site_content, (select count(*) from deals)::int as deals`,
  ).then(r => r.rows);
  console.log('[seed-bridge] now in database:', counts);
}

main().catch(err => {
  console.error('[seed-bridge] failed:', err);
  process.exit(1);
});
