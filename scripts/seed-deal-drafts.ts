// Loads reviewed candidate deals into the Marcador review queue
// (`deal_drafts`) — never into `deals`. Each one then waits in
// /admin → Marcador → "Pendientes de aprobar" until an editor approves or
// discards it.
//
// Usage: tsx scripts/seed-deal-drafts.ts docs/marcador/candidatos-2026-10-27.json [--dry-run]
//
// The JSON is the candidate list built on 2026-10-27 for the notes
// published since 2026-09-21 (see docs/marcador/candidatos-2026-10-27.md):
// one object per article, `es_acuerdo` false ones are skipped. Re-running is
// safe: deal_drafts.article_id is unique and inserts do nothing on conflict,
// and an article that already has a deal is skipped.

import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { dealDrafts, deals } from '../lib/db/schema';
import type { DraftField, DraftFields } from '../lib/deal-draft';

type Candidate = {
  id: string;
  fecha_nota: string;
  es_acuerdo: boolean;
  fecha_acuerdo: string;
  marca: string;
  contraparte: string;
  tipo: string;
  pais: string;
  deporte: string;
  duracion: string;
  monto_texto: string;
  monto_usd: number | null;
  estatus: string;
  resumen: string;
  faltantes: string[];
  notas: string;
};

const FIELD: Record<string, DraftField> = {
  fecha_acuerdo: 'date',
  marca: 'brand',
  contraparte: 'counterparty',
  tipo: 'type',
  pais: 'country',
  deporte: 'sport',
  duracion: 'duration',
  monto: 'amount',
  estatus: 'status',
};

function toDraft(c: Candidate): { fields: DraftFields; missing: DraftField[] } {
  const missing = [...new Set(c.faltantes.map(f => FIELD[f]).filter(Boolean))];
  // A figure in another currency stays out of amountUsd (the methodology
  // converts with the ECB rate of the announcement day) but is kept in the
  // note so the editor doesn't have to reopen the article for it.
  const notes = [
    c.notas,
    c.monto_texto && c.monto_usd == null ? `Monto en la nota: ${c.monto_texto} (convertir con BCE).` : '',
    'Monto revelado: confírmalo antes de aprobar (por defecto queda como estimado).',
  ].filter(Boolean);
  return {
    fields: {
      date: c.fecha_acuerdo || c.fecha_nota,
      brand: c.marca,
      counterparty: c.contraparte,
      type: c.tipo,
      country: c.pais,
      sport: c.deporte,
      duration: c.duracion,
      amountUsd: Number.isInteger(c.monto_usd) ? c.monto_usd : null,
      amountDisclosed: false,
      status: c.estatus || 'reportado',
      summary: c.resumen,
      articleUrl: `/articulo/${c.id}`,
      featured: false,
      playbookRead: null,
      keyFigures: [],
      note: notes.join(' '),
    },
    missing,
  };
}

async function main() {
  const [file] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  if (!file) throw new Error('Usage: tsx scripts/seed-deal-drafts.ts <candidatos.json> [--dry-run]');
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is not set');
  const db = drizzle(neon(process.env.POSTGRES_URL));

  const candidates = (JSON.parse(await readFile(file, 'utf8')) as Candidate[]).filter(c => c.es_acuerdo);
  const linked = new Set((await db.select({ url: deals.articleUrl }).from(deals)).map(d => d.url));

  let created = 0;
  for (const c of candidates) {
    if (linked.has(`/articulo/${c.id}`)) {
      console.log(`skip (ya en el Marcador): ${c.id}`);
      continue;
    }
    const { fields, missing } = toDraft(c);
    if (dryRun) {
      console.log(`[dry-run] ${fields.brand} × ${fields.counterparty} (${c.id}) faltan: ${missing.join(', ') || '—'}`);
      continue;
    }
    const rows = await db
      .insert(dealDrafts)
      .values({ articleId: c.id, fields, missing })
      .onConflictDoNothing({ target: dealDrafts.articleId })
      .returning({ id: dealDrafts.id });
    if (rows.length) created++;
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}${candidates.length} candidatos, ${created} borradores nuevos.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
