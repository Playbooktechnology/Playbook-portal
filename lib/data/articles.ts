import { cache } from 'react';
import { and, eq, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '../db/client';
import { articles } from '../db/schema';
import { rankArticles, selectHero } from '../rank';
import { LEAD_COUNT, LIST_COUNT, normalizeSource } from '../constants';
import { TOPIC_TIER_KEYS, articleInTopic, topicBySlug } from '../topics';
import type { TaxonomyTier } from '../taxonomy';
import { authorDisplayName } from '@/lib/author-name';
import { HUBS } from '../hubs';
import { equationFigure } from '../article-devices';
import snapshotRows from './articles-snapshot.json';

export type Article = typeof articles.$inferSelect;

export const ARTICLES_CACHE_TAG = 'articles';

// Outage fallback (2026-10-22). Neon's free plan locked the database on
// quota and every article page 500'd while the homepage kept serving from
// the cached list. articles-snapshot.json is that list (LIST_COLUMNS, no
// body) captured from the live homepage payload the same day, so when the
// database throws, listings and article pages degrade to title, image and
// excerpt instead of an error. It is a stale copy by design: only reached
// when a query fails, never when the database answers.
const SNAPSHOT: Article[] = (snapshotRows as Record<string, unknown>[]).map(row => ({
  ...row,
  createdAt: new Date(row.createdAt as string),
  updatedAt: new Date(row.updatedAt as string),
  heroPinnedUntil: row.heroPinnedUntil ? new Date(row.heroPinnedUntil as string) : null,
})) as unknown as Article[];
const SNAPSHOT_IDS = new WeakSet<object>(SNAPSHOT);

function snapshotArticle(id: string): Article | null {
  return SNAPSHOT.find(a => a.id === id) ?? null;
}

/** True when `article` came from the outage snapshot rather than the database. */
export function isSnapshotArticle(article: object): boolean {
  return SNAPSHOT_IDS.has(article);
}

// Every column except bodyJson/bodyHtml (the two heavy ones — full TipTap
// document + rendered HTML per article). Nothing that reads getAllArticles()
// ever needs the body: Header/sitemap/feed/most-read/related-articles all
// just need metadata to list, link, or rank. Fetching the body on every one
// of those call sites is what blew through Neon's monthly network-transfer
// allowance in 5 days (see postmortem) despite a ~30-row table — the fix is
// this query, not more caching alone. getArticleById below still selects
// everything, since the article page needs the real body for the one
// article it's rendering.
const LIST_COLUMNS = {
  id: articles.id,
  title: articles.title,
  excerpt: articles.excerpt,
  teaser: articles.teaser,
  wallTeaser: articles.wallTeaser,
  author: articles.author,
  date: articles.date,
  dateFormatted: articles.dateFormatted,
  publication: articles.publication,
  source: articles.source,
  tagsScope: articles.tagsScope,
  tagsSport: articles.tagsSport,
  tagsVertical: articles.tagsVertical,
      tagsProperty: articles.tagsProperty,
  priority: articles.priority,
  score: articles.score,
  confirmed: articles.confirmed,
  featured: articles.featured,
  mostrarAutor: articles.mostrarAutor,
  readingTime: articles.readingTime,
  substackUrl: articles.substackUrl,
  sourceUrl: articles.sourceUrl,
  imageUrl: articles.imageUrl,
  imageCredit: articles.imageCredit,
  status: articles.status,
  listed: articles.listed,
  heroPinnedUntil: articles.heroPinnedUntil,
  createdAt: articles.createdAt,
  updatedAt: articles.updatedAt,
  updatedBy: articles.updatedBy,
} as const;

// Also caches the query result itself for 60s across requests (tagged so an
// editor's publish/save/archive invalidates it immediately via
// revalidateTag) — every (public) route is force-dynamic (see that layout's
// comment for why), so without this every page view, sitemap crawl, and RSS
// fetch re-ran this query from scratch, with nothing shared between them.
const queryPublishedArticles = unstable_cache(
  async () => {
    // listed=false (Article's counterpart to Hub.listed, schema.ts) is the
    // same "undiscoverable, not unreachable" flag: this is the ONE function
    // every listing, hub pool, the archive, search and the sitemap read
    // (see getAllArticles below), so filtering it out here is what makes an
    // unlisted article vanish from all of them at once. getArticleById and
    // getArticleMetaById deliberately carry no such filter — the article
    // must still resolve at its own URL.
    const rows = await db
      .select(LIST_COLUMNS)
      .from(articles)
      .where(and(eq(articles.status, 'published'), eq(articles.listed, true)));
    // normalizeSource here — the single data boundary every public reader
    // goes through — so rows still carrying the legacy 'industry-shots'
    // key (until scripts/migrate-source-noticias.ts runs) file under
    // 'noticias' everywhere downstream: hubs, filters, CSS data-source
    // hooks, taxonomy. All source filtering happens in memory on this
    // result, so no SQL query needs to know the legacy key exists.
    // scoreBoleta joins bodyJson/bodyHtml as a deliberate omission from
    // LIST_COLUMNS (see above): the audit payload is only ever opened for one
    // article at a time in the CMS, so shipping it on every list query would
    // reintroduce exactly the per-row weight this query exists to remove.
    return rows.map(row => ({ ...row, source: normalizeSource(row.source), bodyJson: null, bodyHtml: null, scoreBoleta: null }));
  },
  ['articles-published-list'],
  { revalidate: 60, tags: [ARTICLES_CACHE_TAG] },
);

// Mirrors the legacy architecture on purpose: legacy/js/articles.js fetched
// the entire articles.json into memory and did all ranking/filtering
// client-side. At this corpus size (capped at 500 by the legacy webhook,
// 30 today) a single query + in-memory filtering is simpler and exactly as
// correct as hand-rolled SQL per filter combination — this is the one place
// all the page-level query helpers below read from, cached per request via
// React's cache() so multiple components (ticker, hero, list) don't each
// issue their own query.
export const getAllArticles = cache(async (): Promise<Article[]> => {
  let rows: Article[];
  try {
    rows = await queryPublishedArticles();
  } catch (err) {
    console.error('[articles] list query failed, serving outage snapshot:', err);
    rows = [...SNAPSHOT];
  }
  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
});

// An unlisted hub (Hub.listed — lib/hubs/types.ts, e.g. LFA_HUB) is
// "undiscoverable, not unreachable": the hub page itself keeps serving at
// its own URL, but nothing else on the site should surface the articles
// GATHERED into it (they're filed under a regular product's `source`, so
// they'd otherwise ride along in every general listing right next to it).
// `getAllArticles` stays the raw published+listed(article) pool that
// lib/hubs/pool.ts and getArticlesBySource/getArticlesByProperty read from
// — that's what keeps the hub page itself populated. Every OTHER public
// surface (homepage, archive, ticker, most-read, search, sitemap, feed,
// related articles, team page) should read this instead.
function isInUnlistedHub(article: Pick<Article, 'tagsProperty'>): boolean {
  const tags = article.tagsProperty || [];
  return HUBS.some(hub => !hub.listed && tags.includes(hub.tag));
}

export const getPublicArticles = cache(async (): Promise<Article[]> => {
  const all = await getAllArticles();
  return all.filter(a => !isInUnlistedHub(a));
});

// Shared across requests for 5 minutes (2026-10-22), same tag as the list
// so an editor's save/publish invalidates it at once. Before this, every
// article view — crawlers included — pulled the full body from Neon, which
// kept the compute awake around the clock and exhausted the free plan's
// monthly quota. A published piece almost never changes; edits made outside
// the CMS (scripts/update-article.ts) show up within the window.
const ARTICLE_REVALIDATE_SECONDS = 300;

function queryArticleById(id: string): Promise<Article | null> {
  return unstable_cache(
    async () => {
      const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
      return row ?? null;
    },
    ['article-by-id', id],
    { revalidate: ARTICLE_REVALIDATE_SECONDS, tags: [ARTICLES_CACHE_TAG] },
  )();
}

// The Data Cache stores JSON, so timestamps come back as strings.
function reviveDates(row: Article): Article {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    heroPinnedUntil: row.heroPinnedUntil ? new Date(row.heroPinnedUntil) : null,
  };
}

// cache()-wrapped so a request that reads the full article (body included)
// after already resolving it another way within the same render doesn't
// issue the same by-id lookup twice.
export const getArticleById = cache(async (id: string): Promise<Article | null> => {
  let row: Article | null;
  try {
    row = await queryArticleById(id);
    if (row) row = reviveDates(row);
  } catch (err) {
    const snap = snapshotArticle(id);
    if (!snap) throw err;
    console.error(`[articles] by-id query failed for ${id}, serving outage snapshot:`, err);
    return snap;
  }
  return row ? { ...row, source: normalizeSource(row.source) } : null;
});

// ------------------------------------------------- Declared "Cifra clave"
// Which published articles declare a pull-figure, and the fragment that
// declares it — for the homepage's La cifra del día, which needs to know
// BEFORE choosing a story whether that story carries an editor-declared
// figure (components/home/HomeSidebar.tsx explains why that order matters).
//
// The body is the only place the declaration lives, and the body is exactly
// what LIST_COLUMNS refuses to ship (see its comment: fetching bodies on
// list queries is what burned Neon's monthly transfer allowance in five
// days). So this neither widens that query nor fetches N bodies one by one:
// one query, only the rows that contain the convention, and `substring`
// trims each to the ~600 characters around the declaration. Dozens of rows
// of a few hundred bytes, not a table of full bodies.
//
// It returns the FRAGMENT, not a parsed figure, on purpose: parsing stays
// with extractCifraFromBody in lib/product-hubs.ts, which is also what the
// article page itself runs. A second parser in SQL would be the same rule
// in two dialects, drifting the first time the convention changes.
const queryDeclaredCifras = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const rows = await db
      .select({
        id: articles.id,
        // Plain string functions rather than `substring(... from '<regex>')`:
        // the parser's own matching is case-insensitive, and the regex form
        // of that in Postgres is a leading `(?i)`, whose parentheses collide
        // with the rule that a pattern "containing parentheses" returns its
        // first subexpression instead of the whole match. position()+substr()
        // has no such corner, and lower() makes the search case-insensitive
        // the same way the WHERE's ilike does.
        fragment: sql<string | null>`substr(
          ${articles.bodyHtml},
          position('cifra clave' in lower(${articles.bodyHtml})),
          600
        )`,
      })
      .from(articles)
      .where(
        and(
          eq(articles.status, 'published'),
          eq(articles.listed, true),
          sql`${articles.bodyHtml} ilike '%Cifra clave%'`,
        ),
      );
    const out: Record<string, string> = {};
    for (const row of rows) {
      // Re-wrapped in a <p> because the substring starts AT the convention,
      // past the paragraph's opening tag; the parser matches on the
      // paragraph shape. The closing </p> comes from the fragment itself,
      // and a declaration too long to close inside 600 characters simply
      // fails to parse — the same inert outcome as a malformed one.
      if (row.fragment) out[row.id] = `<p>${row.fragment}`;
    }
    return out;
  },
  ['articles-declared-cifras'],
  { revalidate: 60, tags: [ARTICLES_CACHE_TAG] },
);

// Ecuación (2026-10-27): the third source of a story's figure, for stories
// with no Cifra clave and no number in the headline (every La Lana
// expediente: their titles are questions). Same bounded shape as the query
// above, a few hundred characters per row, never a body.
//
// Two differences, each with a reason:
// - It is PARSED here, server-side, because its parser lives in
//   lib/article-devices.ts, which client components must not pull in through
//   lib/product-hubs.ts. Still one parser: the same parseEquation the article
//   runs, behind equationFigure.
// - It is located with a regex, not position(): "ecuación" is an ordinary
//   word in prose ("la ecuación de la liga"), and the first hit would often
//   be a sentence, not the device. regexp_match takes the case-insensitive
//   flag as an ARGUMENT, so the (?i) corner above doesn't come up, and every
//   group is non-capturing so element [1] is the whole match.
//
// The tail is `(?:.{0,200}){3}`, not `.{0,600}`: a Postgres bound tops out at
// 255 (RE_DUP_MAX). The first preview of this change used `.{0,600}`, the
// pattern failed to compile, and because the Ecuación then shared the Cifra
// query, every declared Cifra clave vanished with it. Hence also the separate
// query: a failure here costs the Ecuación tier only.
const EQUATION_PARAGRAPH_PATTERN =
  '<p[^>]*>\\s*(?:<strong>)?\\s*(?:la\\s+|el\\s+)?ecuaci[óo]n\\s*(?:</strong>)?\\s*:(?:.{0,200}){3}';

type DeclaredEquation = { value: string; caption: string; source: string };

const queryDeclaredEquations = unstable_cache(
  async (): Promise<Record<string, DeclaredEquation>> => {
    const rows = await db
      .select({
        id: articles.id,
        paragraph: sql<string | null>`(regexp_match(${articles.bodyHtml}, ${EQUATION_PARAGRAPH_PATTERN}, 'i'))[1]`,
      })
      .from(articles)
      .where(
        and(
          eq(articles.status, 'published'),
          eq(articles.listed, true),
          sql`${articles.bodyHtml} ~* 'ecuaci[óo]n'`,
        ),
      );
    const out: Record<string, DeclaredEquation> = {};
    for (const row of rows) {
      const equation = row.paragraph ? equationFigure(row.paragraph) : null;
      if (equation) out[row.id] = equation;
    }
    return out;
  },
  ['articles-declared-equations'],
  { revalidate: 60, tags: [ARTICLES_CACHE_TAG] },
);

export type DeclaredFigures = {
  /** The HTML fragment declaring the story's `Cifra clave`, for storyFigure to parse. */
  cifra?: string;
  /** The story's labeled `Ecuación:` result, already parsed. */
  equation?: DeclaredEquation;
};

/** Article id → what the story declares about its own figure: a `Cifra clave` fragment and/or a labeled `Ecuación` result. */
export async function getDeclaredCifras(): Promise<Record<string, DeclaredFigures>> {
  // Settled independently: either source failing leaves the other standing,
  // and the surfaces keep their headline-figure fallback. None of them may be
  // the reason a page 500s (the "Más leídas" incident, 2026-09-30).
  const [cifras, equations] = await Promise.allSettled([queryDeclaredCifras(), queryDeclaredEquations()]);
  if (cifras.status === 'rejected') console.error('[cifra] no se pudieron leer las cifras declaradas:', cifras.reason);
  if (equations.status === 'rejected') console.error('[cifra] no se pudieron leer las ecuaciones declaradas:', equations.reason);
  const out: Record<string, DeclaredFigures> = {};
  if (cifras.status === 'fulfilled') {
    for (const [id, cifra] of Object.entries(cifras.value)) out[id] = { cifra };
  }
  if (equations.status === 'fulfilled') {
    for (const [id, equation] of Object.entries(equations.value)) out[id] = { ...out[id], equation };
  }
  return out;
}

export type ArticleMeta = {
  /** Coverage tier, so the kicker can badge by hub destination. */
  tagsProperty: string[];
  id: string;
  title: string;
  excerpt: string;
  wallTeaser: string | null;
  imageUrl: string;
  imageCredit: string | null;
  /** See schema.ts articles.listed — gates the article page's robots meta. */
  listed: boolean;
  dateFormatted: string;
  date: string;
  readingTime: number;
  publication: string;
  source: string;
  author: string;
  mostrarAutor: boolean;
  tagsScope: string[];
  tagsSport: string[];
  tagsVertical: string[];
  substackUrl: string;
};

// Selects only the columns safe to expose to a reader who hasn't been
// granted full access yet — explicitly NOT teaser/bodyJson/bodyHtml. This
// is what makes "article body must not be present in any response sent to
// an unentitled reader" (see the brief) literally true: the walled render
// path in app/(public)/articulo/page.tsx calls only this function, so the
// body is never fetched into that request at all, not just fetched-and-
// hidden. generateMetadata also uses this exclusively (og:description etc.
// only ever need excerpt, never body, same as legacy behavior).
//
// cache()-wrapped: generateMetadata and the page component both call this
// with the same id during the same request (Next runs both per navigation)
// — without this, every article view ran the identical lookup twice.
export const getArticleMetaById = cache(async (id: string): Promise<ArticleMeta | null> => {
  try {
    // Same shared cache and window as getArticleById, for the same reason.
    return await unstable_cache(() => queryArticleMeta(id), ['article-meta-by-id', id], {
      revalidate: ARTICLE_REVALIDATE_SECONDS,
      tags: [ARTICLES_CACHE_TAG],
    })();
  } catch (err) {
    const snap = snapshotArticle(id);
    if (!snap) throw err;
    console.error(`[articles] meta query failed for ${id}, serving outage snapshot:`, err);
    return snap;
  }
});

async function queryArticleMeta(id: string): Promise<ArticleMeta | null> {
  const [row] = await db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      wallTeaser: articles.wallTeaser,
      imageUrl: articles.imageUrl,
      imageCredit: articles.imageCredit,
      listed: articles.listed,
      dateFormatted: articles.dateFormatted,
      date: articles.date,
      readingTime: articles.readingTime,
      publication: articles.publication,
      source: articles.source,
      author: articles.author,
      mostrarAutor: articles.mostrarAutor,
      tagsScope: articles.tagsScope,
      tagsSport: articles.tagsSport,
      tagsVertical: articles.tagsVertical,
      tagsProperty: articles.tagsProperty,
      substackUrl: articles.substackUrl,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return row ? { ...row, source: normalizeSource(row.source) } : null;
}

// Matched on the DISPLAY name, not the raw column, so an author whose byline
// carries markdown links resolves the same whether the incoming `name` is the
// clean form (what the site links to and the sitemap publishes now) or the raw
// stored string (what old URLs and any existing backlinks still carry).
// See lib/author-name.ts for why the column is not a clean name.
export async function getArticlesByAuthor(name: string): Promise<Article[]> {
  const all = await getPublicArticles();
  const target = authorDisplayName(name);
  return all
    .filter(a => authorDisplayName(a.author) === target)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

const TAG_COLUMN: Record<TaxonomyTier, keyof Article> = {
  scope: 'tagsScope',
  sport: 'tagsSport',
  vertical: 'tagsVertical',
  property: 'tagsProperty',
};

export async function getArticlesByTag(tier: TaxonomyTier, value: string): Promise<Article[]> {
  const all = await getPublicArticles();
  const column = TAG_COLUMN[tier];
  const ranked = rankArticles(all.filter(a => (a[column] as string[]).includes(value)));
  return ranked;
}

export type ArchiveFilters = {
  source?: string;
  scope?: string;
  sport?: string;
  vertical?: string;
  // Grouped topic slugs (lib/topics.ts), added 2026-10-01 alongside the raw
  // tiers above rather than replacing them. A topic covers SEVERAL taxonomy
  // values — ?deporte=futbol is Fútbol plus Liga MX, ?deporte=futbol-americano
  // is NFL, which no article is tagged 'Fútbol americano' for — so it cannot
  // be expressed as ?sport=. Both forms stay valid: every ?sport=Liga%20MX
  // link in the wild keeps filtering to exactly Liga MX.
  deporte?: string;
  industria?: string;
  ambito?: string;
};

// Same definition as legacy/js/archive-page.js's overflowArticles(): the
// ranked pool minus whatever the homepage currently shows (hero + list),
// always computed against the FULL unfiltered pool so "what's in the
// archive" matches reality regardless of which filters are active — then
// filters are applied on top of that overflow set.
export async function getArchiveArticles(filters: ArchiveFilters): Promise<Article[]> {
  const all = await getPublicArticles();
  // Mirrors NewsGrid's own pool exactly: the homepage news band excludes
  // source='opinion' (those have their own live section further down the
  // page), so the "what is already on the homepage" subtraction has to
  // exclude them too. Computing the hero/list from a pool the homepage
  // doesn't actually use would let an opinion piece occupy one of the six
  // shown slots here and get subtracted out of the archive while never
  // appearing on the homepage at all — i.e. reachable from neither page.
  const newsRanked = rankArticles(all.filter(a => a.source !== 'opinion'));
  const hero = selectHero(newsRanked);
  const list = newsRanked.filter(a => a !== hero).slice(0, LIST_COUNT);
  const shownIds = new Set([hero, ...list].filter(Boolean).map(a => (a as Article).id));
  // Subtract from the FULL ranked pool, not from the news-only one: opinion
  // pieces are never on the homepage news band, so they belong in the
  // archive from the moment they're published — including behind
  // /archivo?source=opinion, which is where the homepage's Opinión section
  // sends readers.
  const overflow = rankArticles(all).filter(a => !shownIds.has(a.id));

  return overflow.filter(a => {
    if (filters.source && filters.source !== 'all' && a.source !== filters.source) return false;
    if (filters.scope && filters.scope !== 'all' && !a.tagsScope.includes(filters.scope)) return false;
    if (filters.sport && filters.sport !== 'all' && !a.tagsSport.includes(filters.sport)) return false;
    if (filters.vertical && filters.vertical !== 'all' && !a.tagsVertical.includes(filters.vertical)) return false;
    // A slug that matches no topic filters nothing, rather than returning an
    // empty archive: a mistyped or retired topic in an old link should land
    // the reader on the full archive, not on a dead end.
    for (const tier of TOPIC_TIER_KEYS) {
      const slug = filters[tier];
      if (!slug || slug === 'all') continue;
      const topic = topicBySlug(tier, slug);
      if (topic && !articleInTopic(a, tier, topic)) return false;
    }
    return true;
  });
}

// Product hubs (Roadmap Agosto 2026, Fase 1 — carpetas internas por
// producto): a hub is the product's OWN archive, so unlike
// getArchiveArticles it does NOT subtract what the homepage currently
// shows — a reader on /la-lana should see every Expediente, including one
// that happens to be today's homepage hero. Plain reverse-chronological
// order on purpose: these are editions/cases of a publication, not a
// ranked news feed, and e.g. El Expediente's case numbering depends on
// publication order staying stable.
export async function getArticlesBySource(source: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter(a => a.source === source);
}

/**
 * A product hub's pool, keyed on its `property` tag rather than on `source`.
 *
 * Deliberately NOT `getArticlesByTag('property', …)`: that one re-ranks, and
 * this exists to be an exact swap for `getArticlesBySource` on a hub page —
 * same rows, same order, one field over. `source` also decides the ranking
 * track (`lib/rank.ts`'s `trackFor`), so a hub reading it was one string
 * carrying two unrelated decisions; the tag separates them
 * (`lib/taxonomy.ts` REQUIRED_PROPERTY_BY_SOURCE).
 */
export async function getArticlesByProperty(tag: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter(a => (a.tagsProperty || []).includes(tag));
}

// Admin-only: includes drafts (archived articles), unlike getAllArticles()
// above which the public site uses and which filters to status='published'.
// Not cache()-wrapped — the admin dashboard is the only caller, once per
// page load, so there's nothing to dedupe.
export async function getAllArticlesForAdmin(): Promise<Article[]> {
  const rows = await db.select().from(articles);
  return rows
    .map(row => ({ ...row, source: normalizeSource(row.source) }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export { rankArticles, selectHero };
export { LEAD_COUNT };
