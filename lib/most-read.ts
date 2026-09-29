import { desc, gte, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from './db/client';
import { articleReads } from './db/schema';
import { topArticleIds } from './ga4';
import { getPublicArticles, type Article } from './data/articles';

// Backs components/home/MostReadColumn.tsx ("Lo más leído", the homepage
// top 5, in the left column under the hero). Two data sources, in order of preference (2026-08-06 — until
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

export async function getMostReadArticles(): Promise<MostReadItem[] | null> {
  // GA4 rows are [{ id, pageviews }]; null = not configured OR it failed.
  // An empty array from a configured-but-young property falls through to
  // first-party data rather than hiding a module we have real data for.
  const ga4 = await safely('GA4', () => topArticleIds({ days: 7, limit: 10 }));
  let ranked: { id: string; count: number }[] =
    ga4?.map(r => ({ id: r.id, count: r.pageviews })) ?? [];
  if (!ranked.length) {
    ranked = (await safely('el registro propio', () => queryFirstPartyReads())) ?? [];
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
    .slice(0, 5);
}
