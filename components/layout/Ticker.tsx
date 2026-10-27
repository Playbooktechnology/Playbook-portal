import { rankArticles } from '@/lib/rank';
import { TICKER_COUNT } from '@/lib/constants';
import type { Article } from '@/lib/data/articles';
import { firstBlock, stillMattersPicks } from '@/lib/home-blocks';
import { FRESHNESS, ageInDays, mexicoDay } from '@/lib/freshness';
import { headerDate } from '@/lib/dates';
import { TickerScramble } from './TickerScramble';

// Server component; the marquee scroll and hover-to-pause stay plain CSS
// (see styles/header.css's @keyframes scrollTicker). TickerScramble adds
// the one JS touch — the label flaps in split-flap style on load
// (La Portada, 2026-08-05) — width-locked so the track never shifts.
// The item list is duplicated with aria-hidden on the second copy,
// same as legacy/js/articles.js's renderTicker, to feed the CSS loop.
//
// Caducidad (2026-10-27, lib/freshness.ts): the ticker used to be the top of
// the same ranking as the news package, so its six headlines were the hero
// and the first five rows of the list right under it — the same stories twice
// on one screen. It now carries only what the first block (hero, list, "Lo que
// sigue importando") does NOT show, from the last few days. With fewer than
// the minimum it hides rather than scroll two leftovers in a loop.
export function Ticker({ articles }: { articles: Article[] }) {
  const now = new Date();
  const onHomepage = new Set([...firstBlock(articles, now), ...stillMattersPicks(articles, now)].map(a => a.id));
  const ranked = rankArticles(
    articles.filter(a => !onHomepage.has(a.id) && ageInDays(a.date, now) < FRESHNESS.tickerMaxAgeDays),
    now,
  ).slice(0, TICKER_COUNT);
  const showTicker = ranked.length >= FRESHNESS.tickerMinItems;

  // The day's date leads the bar (A4): "Martes 27 de octubre de 2026" in
  // Mexico City. It stays even on a day the ticker itself hides — the date is
  // what tells a reader the site is today's. Short form on phones.
  const date = (
    <time className="ticker-date" dateTime={mexicoDay(now)}>
      <span className="ticker-date-long">{headerDate(now)}</span>
      <span className="ticker-date-short" aria-hidden="true">
        {headerDate(now).replace(/ de \d{4}$/, '')}
      </span>
    </time>
  );

  if (!showTicker) {
    return <div className="ticker ticker--date-only">{date}</div>;
  }

  return (
    <div className="ticker">
      {date}
      <div className="ticker-label">
        <span className="dot" aria-hidden="true"></span>
        <span className="ticker-label-text">Playbook hoy</span>
        <TickerScramble />
      </div>
      <div className="ticker-track">
        <div className="ticker-content" aria-label="Titulares del día">
          {ranked.map(a => (
            <span className="ticker-item" key={a.id}>{a.title}</span>
          ))}
          {ranked.map(a => (
            <span className="ticker-item" aria-hidden="true" key={`dup-${a.id}`}>{a.title}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
