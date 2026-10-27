import type { Article } from '@/lib/data/articles';
import { relativeLabel } from '@/lib/dates';

// The meta line under a story on cards and lists: "<when> · N min".
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
}: {
  article: Pick<Article, 'date' | 'dateFormatted' | 'createdAt' | 'readingTime'>;
  relative?: boolean;
}) {
  const when = relative ? relativeLabel(article) : article.dateFormatted;
  return (
    <div className="byline">
      <time dateTime={article.date} suppressHydrationWarning>
        {when}
      </time>{' '}
      · {article.readingTime || 1} min
    </div>
  );
}
