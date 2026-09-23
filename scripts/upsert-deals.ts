// Writes deals for El Marcador de Negocios from a JSON file, the scripted
// counterpart to the /admin "Marcador de Negocios" tab. Same validation as
// the tab (lib/deals.ts normalizeDealInput), so both paths enforce one set
// of rules.
//
// Usage: npx tsx scripts/upsert-deals.ts <path-to-json> [--dry-run]
// Input: a JSON array of deals. An entry with `id` updates that row; without
// one, a row with the same date + brand + counterparty is updated, and
// otherwise a new row is inserted, so re-running a file never duplicates.
//
// A script can't call revalidateTag (it runs outside Next), so the public
// rail and /marcador pick the change up when their 60s cache expires.

import { readFile } from 'node:fs/promises';
import { and, eq, sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { deals } from '../lib/db/schema';
import { dealTitle, normalizeDealInput, type DealInput } from '../lib/deals';

// HTTP driver, same rationale as scripts/update-article.ts: these scripts run
// from environments whose egress only permits HTTPS.
const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { deals } });
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('usage: upsert-deals.ts <path-to-json> [--dry-run]');
  const entries = JSON.parse(await readFile(path, 'utf8')) as (Partial<DealInput> & { id?: string })[];

  // Validate everything before writing anything.
  const normalized = entries.map((entry, i) => {
    try {
      return { id: entry.id, values: normalizeDealInput(entry) };
    } catch (err) {
      throw new Error(`entrada ${i + 1}: ${(err as Error).message}`);
    }
  });

  let inserted = 0;
  let updated = 0;
  for (const { id, values } of normalized) {
    const [existing] = id
      ? await db.select({ id: deals.id }).from(deals).where(eq(deals.id, id)).limit(1)
      : await db
          .select({ id: deals.id })
          .from(deals)
          .where(
            and(eq(deals.date, values.date), eq(deals.brand, values.brand), eq(deals.counterparty, values.counterparty)),
          )
          .limit(1);

    if (existing) {
      if (!dryRun) await db.update(deals).set({ ...values, updatedAt: sql`now()` }).where(eq(deals.id, existing.id));
      updated++;
      console.log(`[${dryRun ? 'dry' : 'ok'}] update ${values.date} ${dealTitle(values)}`);
    } else {
      if (!dryRun) await db.insert(deals).values(values);
      inserted++;
      console.log(`[${dryRun ? 'dry' : 'ok'}] insert ${values.date} ${dealTitle(values)}`);
    }
  }
  console.log(`\n${inserted} nuevos, ${updated} actualizados${dryRun ? ' (dry run, nada escrito)' : ''}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
