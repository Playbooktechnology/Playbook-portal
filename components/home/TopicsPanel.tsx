import Link from 'next/link';
import { TOPIC_TIERS, TOPIC_TIER_KEYS, topicHref } from '@/lib/topics';

// The three-column topic panel, rendered in two places from this one
// definition: behind "Todos los temas ▾" on the homepage and behind
// "Temas ▾" in the header nav. One component because the two must not drift
// — a topic added in lib/topics.ts has to appear in both or the nav starts
// promising a different taxonomy than the page.
//
// Pure markup, no hooks: the disclosure behaviour (open/close, Escape
// returning focus to the trigger, roving focus between links) belongs to
// NavMenu, which wraps this in both call sites.
export function TopicsPanel() {
  return (
    <>
      {TOPIC_TIER_KEYS.map(tier => (
        <div className="navmenu-group topics-panel-group" key={tier}>
          <p className="navmenu-group-head">{TOPIC_TIERS[tier].label}</p>
          {TOPIC_TIERS[tier].topics.map(topic => (
            <Link
              className="navmenu-item navmenu-item-plain topics-panel-link"
              data-analytics="hp_click_temas"
              href={topicHref(tier, topic.slug)}
              key={topic.slug}
            >
              {topic.label}
            </Link>
          ))}
        </div>
      ))}
      <div className="topics-panel-foot">
        <Link className="topics-panel-all" data-analytics="hp_click_temas" href="/archivo">
          Ver el archivo completo <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
