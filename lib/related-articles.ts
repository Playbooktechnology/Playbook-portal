import { RELATED_COUNT } from './constants';
import type { Article } from './data/articles';

// "Sigue leyendo" (A9, 2026-10-27). Replaces the legacy port, which ranked by
// any tag overlap and then topped the row up with the most recent stories of
// any kind — so a thinly-tagged piece ended with three unrelated links, some
// of them weeks old. Selection now goes in strict order, and a slot that no
// tier can fill stays empty rather than fall back to a random story:
//
//   1. same case or main tag — the same coverage property (LFA, Infinitas…),
//      or the same main industry AND main sport. Any age: a related story is
//      worth reading however old it is.
//   2. same topic (any shared industry or sport) from the last 30 days.
//   3. "Más leídas" of the last 48 hours.
//
// Within a tier: most shared tags first, then the newest.

const TOPIC_WINDOW_DAYS = 30;

function topics(a: Article): Set<string> {
  return new Set([...a.tagsVertical.map(t => `v:${t}`), ...a.tagsSport.map(t => `s:${t}`)]);
}

function sharedTopicCount(a: Article, b: Article): number {
  const bt = topics(b);
  return [...topics(a)].filter(t => bt.has(t)).length;
}

function sameCaseOrMainTag(a: Article, b: Article): boolean {
  if (a.tagsProperty.some(p => b.tagsProperty.includes(p))) return true;
  return (
    !!a.tagsVertical[0] &&
    a.tagsVertical[0] === b.tagsVertical[0] &&
    !!a.tagsSport[0] &&
    a.tagsSport[0] === b.tagsSport[0]
  );
}

function daysBetween(a: string, b: string): number {
  return Math.abs(Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000;
}

export function relatedArticles(
  article: Article,
  pool: Article[],
  mostRecentlyRead: Article[] = [],
  today: string = new Date().toISOString().slice(0, 10),
): Article[] {
  const picked: Article[] = [];
  const used = new Set([article.id]);
  const take = (list: Article[]) => {
    for (const a of list) {
      if (picked.length >= RELATED_COUNT) return;
      if (used.has(a.id)) continue;
      used.add(a.id);
      picked.push(a);
    }
  };
  const byOverlap = (list: Article[]) =>
    list
      .map(a => ({ a, n: sharedTopicCount(article, a) }))
      .sort((x, y) => y.n - x.n || (y.a.date || '').localeCompare(x.a.date || ''))
      .map(x => x.a);

  const others = pool.filter(a => a.id !== article.id);
  take(byOverlap(others.filter(a => sameCaseOrMainTag(article, a))));
  take(
    byOverlap(
      others.filter(a => sharedTopicCount(article, a) > 0 && daysBetween(a.date, today) <= TOPIC_WINDOW_DAYS),
    ),
  );
  take(mostRecentlyRead);
  return picked;
}

// Same OR logic used by legacy/js/article-page.js, legacy/api/sitemap.js,
// and legacy/api/feed.js — a per-article opt-in or the site-wide switch is
// enough either way.
export function shouldShowAuthor(article: Pick<Article, 'mostrarAutor'>, mostrarAutorGlobal: boolean): boolean {
  return article.mostrarAutor === true || mostrarAutorGlobal === true;
}
