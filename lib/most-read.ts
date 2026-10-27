import { desc, gte, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from './db/client';
import { articleReads } from './db/schema';
import { topArticleIds } from './ga4';
import { getPublicArticles, type Article } from './data/articles';

// Backs components/home/MostReadSection.tsx ("Más leídas", the homepage
// top 5 band under the news package). Two data sources, in order of preference (2026-08-06 — until
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

// Hourly shared cache: every homepage view reads this under a
// force-dynamic layout, and a GROUP BY over article_reads on each request
// is the exact class of repeated query the articles-list cache exists to
// avoid (see lib/data/articles.ts). One hour matches the GA4 side's own
// revalidate window (lib/ga4.ts) so the two sources can't disagree about
// how fresh the ranking is — a top 5 does not need to move faster.
// The window is an argument since 2026-10-27 ("Sigue leyendo" asks for the
// last 48 hours, the opinion slot's substitute for the last 30 days);
// unstable_cache folds arguments into the cache key, so each window caches
// on its own.
const queryFirstPartyReads = unstable_cache(
  async (days: number) => {
    const since = new Date(Date.now() - days * 86400000);
    return db
      .select({ id: articleReads.articleId, count: sql<number>`count(*)::int` })
      .from(articleReads)
      .where(gte(articleReads.readAt, since))
      .groupBy(articleReads.articleId)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
  },
  ['most-read-first-party'],
  { revalidate: 3600 },
);

// Neither source may take the homepage down with it. This module is one
// block in a rail; the page renders without it.
//
// That was not true until 2026-09-29, and it cost a live 500: lib/ga4.ts
// THROWS on a rejected token exchange or a non-2xx Data API response, and
// nothing here caught it. While GA4 was unconfigured isConfigured() returned
// null before any network call, so the throw was unreachable and the gap
// invisible — the first deploy that actually carried GA4 credentials turned
// the whole homepage into an error page. A degradation path that has never
// run is a guess, not a fallback.
async function safely<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (err) {
    // Logged, not swallowed: a silently empty module is how the GA4 parser
    // stayed broken for three weeks (see lib/ga4.ts).
    console.error(`[most-read] ${label} falló, se degrada sin romper la página:`, err);
    return null;
  }
}

export async function getMostReadArticles(
  { days = 7, limit = 5 }: { days?: number; limit?: number } = {},
): Promise<MostReadItem[] | null> {
  // GA4 rows are [{ id, pageviews }]; null = not configured OR it failed.
  // An empty array from a configured-but-young property falls through to
  // first-party data rather than hiding a module we have real data for.
  const ga4 = await safely('GA4', () => topArticleIds({ days, limit: Math.max(10, limit * 2) }));
  let ranked: { id: string; count: number }[] =
    ga4?.map(r => ({ id: r.id, count: r.pageviews })) ?? [];
  if (!ranked.length) {
    ranked = (await safely('el registro propio', () => queryFirstPartyReads(days))) ?? [];
  }
  if (!ranked.length) return null;

  const pool = await getPublicArticles();
  const byId = new Map(pool.map(a => [a.id, a]));
  return ranked
    .map(r => {
      const article = byId.get(r.id);
      return article ? { article, count: r.count } : null;
    })
    .filter((item): item is MostReadItem => item !== null)
    .slice(0, limit);
}
