import type { Article } from './data/articles';
import { rankArticles, selectHero, daysSince, baseScore, bridgeScore, type Rankable } from './rank';
import { LIST_COUNT } from './constants';

// The homepage's first block — the hero, the list under it and "Lo que sigue
// importando" — computed in ONE place. Three surfaces need the same answer:
// the news package itself (NewsGrid), the ticker in the header (which must
// never repeat what the first block already shows) and the internal México/
// LATAM mix view (which counts its first ten positions). If each derived it
// on its own, the day one of them drifted the ticker would start repeating
// headlines again.

/** Hero + list for a pool, exactly as the news package renders it. */
export function newsPackage<T extends Rankable>(pool: T[], now: Date = new Date()) {
  const filtered = rankArticles(pool, now);
  // selectHero excludes editorial products outright; with a pool that has no
  // news-track story left (a La Lana filter) the top of the ranking leads.
  const hero = selectHero(filtered, now) ?? filtered[0] ?? null;
  const list = filtered.filter(a => a !== hero).slice(0, LIST_COUNT);
  return { filtered, hero, list };
}

/** What the unfiltered homepage pool is: news, plus opinion only when featured. */
export function homepagePool<T extends Pick<Article, 'source' | 'featured'>>(articles: T[]): T[] {
  return articles.filter(a => a.source !== 'opinion' || a.featured);
}

/** Hero first, then the list, in screen order. */
export function firstBlock(articles: Article[], now: Date = new Date()): Article[] {
  const { hero, list } = newsPackage(homepagePool(articles), now);
  return hero ? [hero, ...list] : list;
}

// "Lo que sigue importando" (moved from StillMattersSection, 2026-10-27).
// Window: brief proposes 10–14 days; 12 until editorial confirms.
const STILL_WINDOW_DAYS = 12;
const STILL_ITEM_COUNT = 4;
// Below three the column reads as a stub rather than a module — two leftover
// stories under a heading look like the end of a list, not a selection
// (publisher, 2026-10-01). It collapses instead, and the left column is just
// the hero, which is what it was before this module moved here.
const STILL_MIN_ITEMS = 3;
// 2026-08-20: this used to gate on the legacy `priority` field directly
// (≥4 stars), which the 0-99 boleta rewrite (lib/rank.ts) superseded.
// baseScore() already does the right thing for both graded and
// not-yet-graded rows (falling back to bridgeScore(priority) for the
// latter), so bridging the old 4-star cutoff through the same function
// keeps this module's editorial bar unchanged while pointing it at the
// real score once an article has one.
const STILL_MIN_SCORE = bridgeScore(4);

/** The starred stories the rotation no longer shows; [] when fewer than the minimum. */
export function stillMattersPicks(articles: Article[], now: Date = new Date()): Article[] {
  const shown = new Set(firstBlock(articles, now).map(a => a.id));
  const items = articles
    .filter(
      a =>
        !shown.has(a.id) &&
        (a.featured || baseScore(a) >= STILL_MIN_SCORE) &&
        daysSince(a.date, now) <= STILL_WINDOW_DAYS,
    )
    .sort((a, b) => baseScore(b) - baseScore(a) || (b.date || '').localeCompare(a.date || ''))
    .slice(0, STILL_ITEM_COUNT);
  return items.length < STILL_MIN_ITEMS ? [] : items;
}
