import { getMostReadRail, getMostReadRailFallback } from '@/lib/most-read';
import { getPublicArticles } from '@/lib/data/articles';
import { rankArticles, selectHero } from '@/lib/rank';
import { LIST_COUNT } from '@/lib/constants';
import { hubForArticle } from '@/lib/hubs';
import { articlePath } from '@/lib/article-url';

// "Lo más leído" — left column of the homepage news package, right under
// the hero (see components/home/NewsGrid.tsx's .lead-col). Rescues stories
// from earlier days that still carry traffic but have already scrolled
// off the chronological list. Same GA4/first-party ranking as
// components/home/MostReadSection.tsx's "Más leídas" band — see
// lib/most-read.ts's shared rankedReads() — just excludes whatever's in
// the hero slot right above it and requires 3+ valid crossmatches.
//
// Self-contained and unfiltered by design, same convention as
// HomeSidebar: the source chips in NewsGrid re-rank the visible stories
// client-side, but this block (like "La cifra del día") stays fixed to
// the site-wide, all-sources ranking — it's about surfacing overlooked
// traffic, not mirroring whatever filter is currently active.
//
// Falls back to getMostReadRailFallback() (editorial ranking, no
// analytics needed) when neither GA4 nor article_reads has 3+ valid
// stories yet — a fresh environment or one without GA4 configured found
// this out 2026-09-28: without a fallback the block just hides, and the
// hueco under the hero it exists to close comes right back. The sub-label
// changes with it ("Recomendado" instead of "Últimos 7 días") so the
// block never claims a traffic signal it doesn't have.
export async function MostReadRail() {
  const articles = await getPublicArticles();
  const news = articles.filter(a => a.source !== 'opinion' || a.featured);
  const ranked = rankArticles(news);
  const hero = selectHero(ranked);
  const list = ranked.filter(a => a !== hero).slice(0, LIST_COUNT);

  let items = await getMostReadRail(hero?.id);
  let sub = 'Últimos 7 días';
  if (!items) {
    const shown = new Set([hero, ...list].filter((a): a is NonNullable<typeof a> => a !== null).map(a => a.id));
    items = await getMostReadRailFallback(shown);
    sub = 'Recomendado';
  }
  if (!items) return null;

  return (
    <section className="lmr" aria-labelledby="lmr-title">
      <div className="lmr-head">
        <h2 id="lmr-title">Lo más leído</h2>
        <span className="lmr-sub">{sub}</span>
      </div>
      <ol className="lmr-list">
        {items.map(({ article }, i) => (
          <li key={article.id}>
            <a className="lmr-item" href={articlePath(article.id)}>
              <span className="lmr-rank" aria-hidden="true">{i + 1}</span>
              <span className="lmr-body">
                <h3 className="lmr-title">{article.title}</h3>
                <span className="lmr-meta">
                  {hubForArticle(article.tagsProperty)?.name ?? article.publication} · {article.dateFormatted}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
