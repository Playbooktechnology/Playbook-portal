import type { DeclaredFigures } from './data/articles';
import { FRESHNESS, ageInDays } from './freshness';
import { storyFigure } from './product-hubs';
import { rankArticles, selectHero, type Rankable } from './rank';

// "La cifra del día" (homepage rail, components/home/HomeSidebar.tsx) and the
// daily freshness alert (/api/salud/portada) choose the figure here, so the
// alert always checks exactly what readers see.

type FigureArticle = Rankable & { id: string; title: string; teaser?: string | null; source: string };

export type DailyFigurePick = {
  figure: string;
  caption?: string;
  id: string;
  title: string;
  /** The story's date (articles.date, CDMX): the figure's date. */
  date: string;
};

export const CIFRA_MAX_AGE_DAYS = FRESHNESS.cifraMaxAgeDays;

/**
 * The figure the rail shows, among stories at most `maxAgeDays` old (CDMX
 * calendar days). Pass Infinity to get the newest figure regardless of age,
 * which is what the alert reports as "the last one".
 */
export function selectDailyFigure(
  articles: FigureArticle[],
  declaredFigures: Record<string, DeclaredFigures>,
  now: Date = new Date(),
  maxAgeDays: number = CIFRA_MAX_AGE_DAYS,
): DailyFigurePick | null {
  const ranked = rankArticles(articles.filter(a => a.source !== 'opinion' || a.featured), now);
  const hero = selectHero(ranked, now);
  // ------------------------------------------------------ Choosing the figure
  // ONE RULE: the number only goes up if something says what it measures.
  //
  // Two sources satisfy that, and the order between them is the whole design.
  //
  //   1. A DECLARED "Cifra clave:" in the body. The editor picked the number
  //      AND wrote the line under it ("US$25 millones — lo que la FIFA ofrece
  //      por federación"), optionally with its source. This is the only path
  //      that can promote a figure living in the middle of a story, which is
  //      where the best ones live: a deal's value, a study's result, the size
  //      of a fine. It wins even over a higher-ranked story's headline figure
  //      — a human vouched for it, and the scrape below never does.
  //
  //   2. A figure in the HEADLINE. No caption needed: the headline is sitting
  //      right under the number and it IS the caption, by construction.
  //
  // What is NOT a source any more is the excerpt (publisher, 2026-10-21). The
  // excerpt is where a story keeps its CONTEXT numbers and nothing here can
  // tell one from the news. Siroko × Chicago Bulls is the case that settled
  // it: the deal's value was never disclosed, the excerpt closed on the
  // brand's €42 millones of 2024 revenue, and the rail printed "€42 millones"
  // over a headline about a sponsorship — every reader gets the same wrong
  // answer, that the deal is worth €42M. Five of that day's fourteen front-page
  // stories would have surfaced a context number the same way, among them a
  // jersey's €210 price as "La cifra del día".
  //
  // Deriving the caption from the excerpt automatically was tried before this
  // (2026-10-21) and rejected on its own output: "Facturación en 2024" came
  // out right for Siroko, but four of nine captions came out as severed
  // fragments — "Entregará al menos", "Netflix proyecta". A machine can find
  // the number; it cannot say what the number measures. So the rule stands at
  // declared-or-headline, and the way to bring an excerpt-grade figure back is
  // to declare it — which is what the publish skills now ask for
  // (.claude/playbook-editorial/dynamic-element-library.md, "Cifra clave").
  //
  // AGE (2026-11-11): only stories within `maxAgeDays` compete. The audit of
  // 28 oct–10 nov found the rail repeating a 3 nov figure for seven straight
  // days under "La cifra del día"; a figure older than the limit now hides the
  // block instead (and the alert says so), it never stands in for today's.
  let fallback: DailyFigurePick | null = null;
  for (const article of ranked) {
    if (article === hero) continue;
    if (ageInDays(article.date, now) > maxAgeDays) continue;
    // Per-story resolution is lib/product-hubs.ts's storyFigure — the same
    // rule every other figure surface uses. What stays HERE is the one thing
    // only this rail does: choosing ACROSS stories, where a declared figure
    // further down the ranking beats a headline figure higher up.
    const found = storyFigure(article, declaredFigures[article.id]);
    if (!found) continue;
    // The caption is what the figure MEANS, and the rail used to drop it:
    // "US$8,000 a US$20,000" over a headline about talent factories left the
    // reader with a number and no unit (user feedback, 2026-08-07). The
    // article page has always shown it under the pull-figure; showing the
    // same line here keeps the two surfaces explaining the number
    // identically.
    const pick = {
      figure: found.value,
      caption: found.caption || undefined,
      id: article.id,
      title: article.title,
      date: article.date,
    };
    if (found.declared) return pick;
    // Remembered, not taken: a declared figure further down the ranking still
    // outranks it, so the walk continues. A headline figure, or a labeled
    // Ecuación result for a story with neither (storyFigure's third tier),
    // which keeps its label as the caption.
    fallback ??= pick;
  }
  return fallback;
}

/** "La cifra del día" only when the figure's story is from today (CDMX); otherwise "La cifra". */
export function cifraHeading(date: string, now: Date = new Date()): string {
  return ageInDays(date, now) <= 0 ? 'La cifra del día' : 'La cifra';
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "Lunes 9 nov" for a YYYY-MM-DD date. */
export function cifraDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  const weekday = WEEKDAYS[d.getUTCDay()];
  return `${weekday[0].toUpperCase()}${weekday.slice(1)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
