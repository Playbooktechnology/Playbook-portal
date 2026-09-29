import { desc, gte, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from './db/client';
import { articleReads } from './db/schema';
import { topArticleIds } from './ga4';
import { getPublicArticles, type Article } from './data/articles';
import { baseScore } from './rank';

// Backs components/home/MostReadSection.tsx ("Más leídas", the homepage
// top 5). Two data sources, in order of preference (2026-08-06 — until
// now this was GA4-ONLY, and since GA4 credentials were never configured
// in Vercel the module has rendered nothing since launch):
//
//   1. GA4 pageviews (last 7 days) when configured — the authoritative
//      count, it sees every visit including bot-exempt and cached ones.
//   2. The site's OWN metering log (article_reads, last 7 days) — the
//      rows lib/metering.ts already writes for every entitled read.
//      First-party, zero external setup, live from day one. Slightly
//      stricter than pageviews (bots and editors never log, and the
//      unique indexes mean one row per identity/article/month), which is
//      fine: it measures readers, not hits.
//
// Both are labeled "lecturas" in the UI. The module hides entirely only
// when NEITHER source has data (a truly fresh site) — same
// render-nothing degradation as before, just much rarer now.
export type MostReadItem = { article: Article; count: number };

// 5-minute shared cache: every homepage view reads this under a
// force-dynamic layout, and a GROUP BY over article_reads on each request
// is the exact class of repeated query the articles-list cache exists to
// avoid (see lib/data/articles.ts).
const queryFirstPartyReads = unstable_cache(
  async () => {
    const since = new Date(Date.now() - 7 * 86400000);
    return db
      .select({ id: articleReads.articleId, count: sql<number>`count(*)::int` })
      .from(articleReads)
      .where(gte(articleReads.readAt, since))
      .groupBy(articleReads.articleId)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
  },
  ['most-read-first-party'],
  { revalidate: 300 },
);

// Shared by both surfaces below: GA4 pageviews (7d) when configured, else
// the first-party article_reads fallback. Ranked once per request (React
// cache dedupes the underlying topArticleIds/queryFirstPartyReads calls),
// so a second consumer of the same ranking costs zero extra GA4 quota.
async function rankedReads(): Promise<{ id: string; count: number }[]> {
  const ga4 = await topArticleIds({ days: 7, limit: 10 });
  let ranked: { id: string; count: number }[] =
    ga4?.map(r => ({ id: r.id, count: r.pageviews })) ?? [];
  if (!ranked.length) {
    ranked = await queryFirstPartyReads();
  }
  return ranked;
}

export async function getMostReadArticles(): Promise<MostReadItem[] | null> {
  const ranked = await rankedReads();
  if (!ranked.length) return null;

  const pool = await getPublicArticles();
  const byId = new Map(pool.map(a => [a.id, a]));
  return ranked
    .map(r => {
      const article = byId.get(r.id);
      return article ? { article, count: r.count } : null;
    })
    .filter((item): item is MostReadItem => item !== null)
    .slice(0, 5);
}

// Backs components/home/MostReadRail.tsx ("Lo más leído", homepage left
// column, under the hero). Same ranking as getMostReadArticles above —
// same source, same 7-day window — just excludes whichever story is
// sitting in the hero slot right above it (no point resurfacing the story
// the reader is already looking at) and requires 3+ valid crossmatches
// before it renders at all: a thin rail reads worse than no rail.
export async function getMostReadRail(excludeId?: string): Promise<MostReadItem[] | null> {
  const ranked = await rankedReads();
  if (!ranked.length) return null;

  const pool = await getPublicArticles();
  const byId = new Map(pool.map(a => [a.id, a]));
  const items = ranked
    .map(r => {
      if (r.id === excludeId) return null;
      const article = byId.get(r.id);
      return article ? { article, count: r.count } : null;
    })
    .filter((item): item is MostReadItem => item !== null)
    .slice(0, 5);

  return items.length >= 3 ? items : null;
}

// Third rung, editorial rather than analytics — this is the one that
// actually keeps the column-1 gap closed (2026-09-28 feedback: a fresh
// environment with neither GA4 configured nor enough article_reads rows
// left "Lo más leído" empty and reopened the exact hueco this block
// exists to fill). No traffic signal required, so it's never really
// empty: ranks the whole pool by the same 0-99 boleta score
// StillMattersSection uses, excludes whatever's already on screen
// (`excludeIds` = hero + the visible list, passed in by the caller, which
// is the only place that knows what's currently shown), takes the top 5.
export async function getMostReadRailFallback(excludeIds: Set<string>): Promise<MostReadItem[] | null> {
  const pool = await getPublicArticles();
  const items = pool
    .filter(a => !excludeIds.has(a.id) && (a.source !== 'opinion' || a.featured))
    .sort((a, b) => baseScore(b) - baseScore(a) || (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5)
    .map(article => ({ article, count: 0 }));

  return items.length >= 3 ? items : null;
}
