import type { Article } from '@/lib/data/articles';
import { TagPillRow } from './TagPillRow';
import { hubForArticle } from '@/lib/hubs';
import { articlePath } from '@/lib/article-url';
import { industryLabel } from '@/lib/topics';
import { normalizeSource } from '@/lib/constants';

type Heading = 'h3' | 'h4';

// What a row badges when no hub tag claims it.
//
// A generic "NOTICIAS" on 307 of 362 published articles says nothing the
// reader did not already know from the section they are standing in, so the
// news track badges its INDUSTRY instead (publisher, 2026-10-01) — Derechos
// de TV, Patrocinios, Gobernanza. Never the sport: the sport tier mixes
// sports with leagues ('NFL', 'Liga MX'), and leagues are deliberately kept
// off these surfaces.
//
// The editorial products keep their own name: "La Lana del Deporte" and
// "Infinitas" (which also keeps its purple, from .tag-mini.infinitas) are the
// product, not a category, and swapping either for an industry would hide
// which thing the reader is about to open.
function rowBadge(article: Article): string {
  if (normalizeSource(article.source) !== 'noticias') return article.publication;
  return industryLabel(article.tagsVertical) ?? article.publication;
}

// Ported from legacy/js/articles.js's rowTemplate() (used by the homepage
// list, related articles, author/tema pages, most-read — none of those
// show tag pills, so a plain <a> is safe there) and
// legacy/js/archive-page.js's rowTemplate() (the archive page DOES show tag
// pills per row, so it needs the same div + stretched .card-link pattern as
// LeadStory to avoid nesting an <a> inside an <a> — see that component's
// comment). `withTagPills` switches between the two shapes.
export function NewsRow({
  article,
  heading = 'h3',
  withTagPills = false,
  analyticsEvent,
}: {
  article: Article;
  heading?: Heading;
  withTagPills?: boolean;
  /** Set only by the homepage; every other call site sends nothing. */
  analyticsEvent?: string;
}) {
  const Heading = heading;
  const href = articlePath(article.id);
  const inner = (
    <>
      {/* Hub coverage is badged by destination, matching the article
          page's own kicker — otherwise the same piece reads "Noticias"
          here and "LFA" there. */}
      <span className={`tag-mini ${article.source}`}>
        {hubForArticle(article.tagsProperty)?.name ?? rowBadge(article)}
      </span>
      <Heading>{article.title}</Heading>
      <div className="byline">
        {article.dateFormatted} · {article.readingTime || 1} min
      </div>
    </>
  );

  if (!withTagPills) {
    return (
      <a className="news-row reveal" data-analytics={analyticsEvent} data-source={article.source} href={href}>
        {inner}
      </a>
    );
  }

  return (
    <div className="news-row reveal" data-source={article.source}>
      <a className="card-link" data-analytics={analyticsEvent} href={href}>
        {inner}
      </a>
      <TagPillRow article={article} />
    </div>
  );
}
