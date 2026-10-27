import { unstable_cache } from 'next/cache';
import { PLAYBOOK_CHANNEL_FEED, parseChannelFeed, type ChannelFeed } from '../youtube-feed';

// The channel's latest uploads for the homepage's Video Playbook band.
//
// Thirty minutes: the channel publishes about once a day, so a new upload
// shows up on the site within half an hour of going live on YouTube, and the
// homepage — force-dynamic, see app/(public)/layout.tsx — does not call
// YouTube on every visit.
const REVALIDATE_SECONDS = 1800;

// A feed that answers slowly must not hold the homepage hostage.
const TIMEOUT_MS = 4000;

const queryChannelFeed = unstable_cache(
  async (): Promise<ChannelFeed> => {
    const res = await fetch(PLAYBOOK_CHANNEL_FEED, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/atom+xml, application/xml;q=0.9' },
    });
    if (!res.ok) throw new Error(`feed de YouTube respondió ${res.status}`);
    const feed = parseChannelFeed(await res.text());
    // An empty parse is a failure, not "the channel has no videos": a format
    // change on YouTube's side would look exactly like this, and caching it
    // would blank the section for half an hour. Throwing keeps the last good
    // value out of the cache and lets the caller fall back to the CMS.
    if (!feed.longVideos.length && !feed.shorts.length) {
      throw new Error('feed de YouTube sin entradas legibles');
    }
    return feed;
  },
  ['youtube-channel-feed'],
  { revalidate: REVALIDATE_SECONDS, tags: ['youtube-feed'] },
);

/**
 * The parsed feed, or null when YouTube is unreachable or unreadable.
 * Never throws: null means "render the CMS-curated videos", which is what
 * the section showed before it read the feed at all.
 */
export async function getChannelFeed(): Promise<ChannelFeed | null> {
  try {
    return await queryChannelFeed();
  } catch (err) {
    console.error('[video] no se pudo leer el feed de YouTube, se usa el CMS:', err);
    return null;
  }
}
