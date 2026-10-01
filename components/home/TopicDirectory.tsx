import Link from 'next/link';
import { TemaIcon, TEMA_ICON_BY_TOPIC } from '@/components/icons/tema';
import { INDUSTRY_TOPICS, SPORT_TOPICS, topicHref } from '@/lib/topics';

// Homepage entry point into the archive (Fase 7 UX), from the v23
// prototype's topic-directory pattern: a bordered grid of topic links
// (three columns on mobile, see styles/sections.css), hover in brand green.
//
// 2026-10-01: the twelve hardcoded topics here included Liga MX, NFL, NBA
// and F1. Leagues are no longer offered as topics anywhere on the site
// (publisher) — they are reached through "Alianzas" — so this block now
// reads the same allow-list as the Temas row and the nav panel
// (lib/topics.ts). One list, three surfaces: a topic added or retired moves
// all three at once, and a new league tag in the CMS reaches none of them.
const TOPICS: { label: string; href: string }[] = [
  ...SPORT_TOPICS.map(t => ({ label: t.label, href: topicHref('deporte', t.slug) })),
  ...INDUSTRY_TOPICS.map(t => ({ label: t.label, href: topicHref('industria', t.slug) })),
];

export function TopicDirectory() {
  return (
    <section className="container topic-dir-section" aria-labelledby="topic-dir-title">
      <div className="section-head reveal" style={{ paddingTop: 0 }}>
        <div>
          <h2 id="topic-dir-title">Explora por tema</h2>
        </div>
        <Link className="section-link" href="/archivo">
          Ver el archivo completo
        </Link>
      </div>
      <nav className="topic-directory reveal" aria-label="Temas del archivo">
        {TOPICS.map(t => (
          <Link key={t.label} href={t.href}>
            {/* Icon first in source order AND in the box: it sits left of
                the label on desktop and above it on mobile, both from the
                same markup (styles/sections.css). Decorative — the label
                is the accessible name, so the glyph is aria-hidden and a
                topic with no glyph simply renders the label alone. */}
            <TemaIcon name={TEMA_ICON_BY_TOPIC[t.label]} />
            <span className="topic-directory-label">{t.label}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
