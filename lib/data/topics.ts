import { unstable_cache } from 'next/cache';
import { getPublicArticles } from './articles';
import { daysSince } from '../rank';
import { FALLBACK_TOP_TOPICS, topTopics, type Topic, type TopicTier } from '../topics';

// What the homepage's Temas row promotes: the allow-listed topics with the
// most coverage in the last 30 days.
//
// 30 days rather than all-time because the row's job is "what is Playbook
// on right now", and an all-time count would freeze into the same six
// forever — Fútbol and Gobernanza have a four-year head start and would
// never move. Thirty days is long enough that one quiet week does not
// reshuffle it and short enough that a genuine shift in coverage shows up.
const WINDOW_DAYS = 30;

// Daily. The row changes on the scale of weeks, so recomputing it per
// request would be a GROUP BY over the whole pool for a result that is
// almost always identical to yesterday's. The homepage is force-dynamic, so
// without this cache that cost lands on every single visit.
const REVALIDATE_SECONDS = 86400;

export type PromotedTopic = { tier: TopicTier; topic: Topic };

const queryTopTopics = unstable_cache(
  async (): Promise<PromotedTopic[]> => {
    const all = await getPublicArticles();
    const now = new Date();
    const recent = all.filter(a => daysSince(a.date, now) <= WINDOW_DAYS);
    return topTopics(recent).map(({ tier, topic }) => ({ tier, topic }));
  },
  ['home-top-topics'],
  { revalidate: REVALIDATE_SECONDS, tags: ['articles'] },
);

/**
 * Never throws and never returns an empty row: a quiet month, or a failure
 * in the pool query, falls back to the fixed six (lib/topics.ts). An empty
 * Temas row would read as a broken component rather than as "no topics this
 * month", which is not a state this row has.
 */
export async function getPromotedTopics(): Promise<PromotedTopic[]> {
  try {
    const topics = await queryTopTopics();
    return topics.length ? topics : FALLBACK_TOP_TOPICS;
  } catch (err) {
    console.error('[topics] no se pudo calcular la fila de temas, se usa la lista fija:', err);
    return FALLBACK_TOP_TOPICS;
  }
}
