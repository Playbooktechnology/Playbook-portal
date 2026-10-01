import Link from 'next/link';
import { getPromotedTopics } from '@/lib/data/topics';
import { topicHref } from '@/lib/topics';
import { NavMenu } from '@/components/layout/NavMenu';
import { TopicsPanel } from './TopicsPanel';

// The "Temas" row under the homepage's source filters: the six topics
// Playbook has covered most in the last 30 days, plus the full panel behind
// "Todos los temas ▾".
//
// Every entry comes from the allow-list in lib/topics.ts, so no league can
// appear here — not Liga MX, not the NFL, not whatever gets added to the CMS
// next week. League coverage has its own front door in "Alianzas", and the
// allow-list is what keeps that boundary from eroding by accident: a new
// league tag is simply not a topic until someone makes it one.
//
// Server component: the ranking is a cached read (lib/data/topics.ts). Only
// the disclosure is interactive, and that is NavMenu's job — reused rather
// than reimplemented so this button gets the same Escape-closes-and-returns-
// focus behaviour as the header menus, for free and in one place.
export async function TopicsBar() {
  const promoted = await getPromotedTopics();

  return (
    <div className="topics-bar">
      <span className="topics-bar-label">Temas</span>
      <div className="topics-bar-chips">
        {promoted.map(({ tier, topic }) => (
          <Link
            className="topics-chip"
            data-analytics="hp_click_temas"
            href={topicHref(tier, topic.slug)}
            key={`${tier}-${topic.slug}`}
          >
            {topic.label}
          </Link>
        ))}
      </div>
      <NavMenu label="Todos los temas" align="end" wide panelClassName="is-temas">
        <TopicsPanel analyticsEvent="hp_click_temas" />
      </NavMenu>
    </div>
  );
}
