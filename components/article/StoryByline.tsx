import type { Article } from '@/lib/data/articles';
import { relativeLabel } from '@/lib/dates';
import { bylineName } from '@/lib/authors';

// The meta line under a story on cards and lists: "Por <firma> · <when> · N min".
//
// The firma (A5) is always there: the author when the article or the site
// shows bylines, "Redacción Playbook" otherwise (lib/authors.ts). Plain text,
// never a link — every card is already one big link, and an <a> inside an <a>
// is invalid HTML. The article page links the byline.
//
// `relative` (A4, 2026-10-27) is for "Último en Playbook" only: "hace 12 min"
// / "hace 3 h" the same day, the date from the next one on. Everywhere else a
// list is an archive and reads the date. The label is computed at render,
// which on the homepage happens on the server and again on hydration; the
// minute can tick over between the two, so the <time> opts out of React's
// text-mismatch warning instead of flashing a different value.
export function StoryByline({
  article,
  relative = false,
  showAuthorsGlobal = false,
}: {
  article: Pick<Article, 'date' | 'dateFormatted' | 'createdAt' | 'readingTime' | 'author' | 'mostrarAutor'>;
  relative?: boolean;
  /** siteSettings.mostrarAutorGlobal, from the page that renders the list. */
  showAuthorsGlobal?: boolean;
}) {
  const when = relative ? relativeLabel(article) : article.dateFormatted;
  const firma = bylineName(article, showAuthorsGlobal);
  return (
    <div className="byline">
      <span className="byline-author">Por {firma.name}</span> ·{' '}
      <time dateTime={article.date} suppressHydrationWarning>
        {when}
      </time>{' '}
      · {article.readingTime || 1} min
    </div>
  );
}
