import type { Article } from '@/lib/data/articles';
import { hubForSource, storyFigure, type StoryDeclarations } from '@/lib/product-hubs';
import { articlePath } from '@/lib/article-url';

// La Lectura's "Sigue leyendo" card (article redesign, 2026-08-05) —
// replaces the plain NewsRow list at the article foot. Each card previews
// its product's identity instead of reading as a generic link: the hub
// concept as the eyebrow ("El Expediente · La Lana del Deporte"), the
// story's figure pulled out when it has one, and a source-colored top rule
// with a per-product hover skin (styles/lectura.css). Non-product sources
// (opinion) fall back to the publication name alone.
//
// The figure follows lib/product-hubs.ts's storyFigure — a declared Cifra
// clave, else a figure in the headline, never the excerpt — the same rule as
// the homepage rail, so a story can't show one number on the homepage and
// another at the foot of the article you just read. `declared` comes
// from the page (one getDeclaredCifras() for the whole row, not one per card).
export function RelatedCard({ article, declared }: { article: Article; declared?: StoryDeclarations }) {
  const hub = hubForSource(article.source);
  const figure = storyFigure(article, declared);
  return (
    <a
      className="lect-related-card reveal"
      data-source={article.source}
      href={articlePath(article.id)}
    >
      <span className="lect-related-eyebrow">
        {hub ? `${hub.concept} · ${article.publication}` : article.publication}
      </span>
      {figure && <span className="lect-related-figure">{figure.value}</span>}
      {/* A declared figure (Cifra clave or Ecuación) may come from anywhere
          in the story, so the line saying what it measures has to travel
          with it. A headline figure needs none: the headline is printed
          right below. */}
      {figure?.caption && <span className="lect-related-figure-caption">{figure.caption}</span>}
      <h3>{article.title}</h3>
      <span className="lect-related-meta">
        {article.dateFormatted} · {article.readingTime || 1} min
        <span className="lect-related-arrow" aria-hidden="true">
          →
        </span>
      </span>
    </a>
  );
}
