// Applies drizzle/ migrations over Neon's HTTP driver, for environments
// whose egress only permits HTTPS (Claude Code on the web, some CI), where
// `npm run db:migrate` can't open a TCP connection to port 5432.
//
// Written for the 2026-10-22 bridge database (the old Neon project was
// locked on quota and a fresh one had to be built from an empty schema),
// but safe to run anywhere: it reads and writes drizzle's own journal table
// (drizzle.__drizzle_migrations) with the same hash and created_at that
// drizzle-orm/node-postgres/migrator uses, so scripts/predeploy-migrate.ts
// sees every migration applied here as already done and skips it.
//
// Differences from drizzle-orm/neon-http/migrator, which exists but runs
// each statement as its own HTTP request with no transaction: here each
// migration file plus its journal row goes in ONE sql.transaction() batch,
// so a statement that fails rolls back its whole file and the journal never
// records a half-applied migration.
//
// Usage: npx tsx scripts/migrate-http.ts [--dry-run]

import { neon } from '@neondatabase/serverless';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is not set');
  const sql = neon(process.env.POSTGRES_URL);
  console.log(`[migrate-http] target: ${new URL(process.env.POSTGRES_URL).hostname}`);

  const migrations = readMigrationFiles({ migrationsFolder: './drizzle' });

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`;
  const [last] = await sql`SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1`;
  const lastMillis = last ? Number(last.created_at) : -1;

  // Same pending rule as drizzle's own migrators: anything newer than the
  // newest recorded migration.
  const pending = migrations.filter(m => m.folderMillis > lastMillis);
  console.log(`[migrate-http] ${migrations.length} migrations in drizzle/, ${pending.length} pending.`);

  for (const m of pending) {
    const statements = m.sql.map(s => s.trim()).filter(Boolean);
    console.log(`[migrate-http] ${m.folderMillis}: ${statements.length} statements${DRY_RUN ? ' (dry run, not applied)' : ''}`);
    if (DRY_RUN) continue;
    await sql.transaction([
      ...statements.map(s => sql(s)),
      sql('INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES ($1, $2)', [m.hash, m.folderMillis]),
    ]);
  }
  console.log('[migrate-http] done.');
}

main().catch(err => {
  console.error('[migrate-http] failed:', err);
  process.exit(1);
});
