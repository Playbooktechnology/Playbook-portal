import Link from 'next/link';
import type { Article } from '@/lib/data/articles';
import { stillMattersPicks } from '@/lib/home-blocks';
import { articlePath } from '@/lib/article-url';

// Homepage module "Lo que sigue importando" (design brief, 2026-08-05).
// The main rotation ranks by recency, so a story that's still important
// but no longer brand new falls out of view even though nothing displaced
// its relevance. This module is that story's second window:
//
//   - Separate selection from the "Último en Playbook" package: important
//     (score ≥ MIN_SCORE, the 0-99 boleta — see below) or featured
//     articles inside a rolling window.
//   - Excludes whatever the top rotation is currently showing in its
//     default view (hero + 5-row list), so there are never duplicates on
//     first paint. The client-side source filters can reshuffle the 1+5
//     after hydration, but the default "Todo" view is what both first
//     paint and this module agree on — same reference getArchiveArticles
//     already uses for "what is on the homepage".
//   - kicker "Sigue siendo noticia" per item — editorial judgment, not a
//     generic "featured" label or a second archive.
//
// 2026-10-01: moved OUT of a full-width band under "Más noticias" and INTO
// the news package's left column, under the lead story, as compact rows. It
// is the same module and the same selection — only its placement and its row
// shape changed — because the rail (newsletter + La cifra + El Marcador) runs
// far taller than the other two columns and left a visible hole under the
// hero. Filling it with this module costs no new query and no new editorial
// work: these articles were already being chosen, just further down the page.
// It renders nowhere else; do not also mount it below, or the same four
// stories appear twice on one screen.
//
// Window, minimum and score bar: see lib/home-blocks.ts.

export function StillMattersSection({ articles }: { articles: Article[] }) {
  // Selection lives in lib/home-blocks.ts, next to the first block it must
  // never repeat — the ticker reads the same two functions. Quiet weeks
  // (fewer than the minimum) come back empty and collapse the module: an
  // empty "still matters" module would say the opposite of what it means.
  const items = stillMattersPicks(articles);
  if (!items.length) return null;

  return (
    <section className="still-matters" aria-labelledby="still-matters-title">
      <div className="still-matters-head">
        <h2 className="side-title" id="still-matters-title">Lo que sigue importando</h2>
      </div>
      <div className="still-matters-list">
        {items.map(article => (
          <Link
            className="still-matters-row"
            data-source={article.source}
            data-analytics="hp_click_sigue"
            href={articlePath(article.id)}
            key={article.id}
          >
            <span className="still-matters-kicker">Sigue siendo noticia</span>
            <h3>{article.title}</h3>
            <div className="byline">
              {article.dateFormatted} · {article.readingTime || 1} min
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
