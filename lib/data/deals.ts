import { deals } from '../db/schema';
import type { Deal } from '../deals';

// The `deals` table is /admin's legacy Marcador tab only: since 2026-11-11 the
// public site reads data/marcador.json (lib/data/marcador.ts).
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
