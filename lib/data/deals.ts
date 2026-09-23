import { cache } from 'react';
import { desc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '../db/client';
import { deals } from '../db/schema';
import type { Deal } from '../deals';

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
  };
}

// Same freshness contract as the articles pool (lib/data/articles.ts): shared
// across requests for up to 60s, invalidated immediately by revalidateTag when
// an editor saves a deal, so the rail and /marcador update without a deploy.
const queryDeals = unstable_cache(
  async () => {
    const rows = await db.select().from(deals).orderBy(desc(deals.date), desc(deals.createdAt));
    return rows.map(toDeal);
  },
  ['deals-all'],
  { revalidate: 60, tags: [DEALS_CACHE_TAG] },
);

export const getAllDeals = cache((): Promise<Deal[]> => queryDeals());
