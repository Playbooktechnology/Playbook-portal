import { cache } from 'react';
import { deals } from '../db/schema';
import type { Deal } from '../deals';
import { getAcuerdosPublicos, toLegacyDeal } from './marcador';

export const DEALS_CACHE_TAG = 'deals';

type DealRow = typeof deals.$inferSelect;

export function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    date: row.date,
    brand: row.brand,
    counterparty: row.counterparty,
    type: row.type,
    country: row.country,
    sport: row.sport,
    duration: row.duration,
    amountUsd: row.amountUsd,
    amountDisclosed: row.amountDisclosed,
    status: row.status,
    summary: row.summary,
    articleUrl: row.articleUrl,
    featured: row.featured,
    playbookRead: row.playbookRead,
    keyFigures: row.keyFigures ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Public reads (rail, /marcador, sitemap, /api/salud/portada) come from
// data/marcador.json since 2026-11-11, through lib/data/marcador.ts: only
// records with cumple_criterio: true, newest first. The `deals` table above
// stays for /admin until the weekly flow replaces it (docs/marcador.md).
export const getAllDeals = cache(
  async (): Promise<Deal[]> =>
    getAcuerdosPublicos()
      .map(toLegacyDeal)
      .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
);
