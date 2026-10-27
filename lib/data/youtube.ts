import { unstable_cache } from 'next/cache';
import {
  PLAYBOOK_CHANNEL_FEED,
  PROGRAM_PLAYLISTS,
  mergeProgramFeeds,
  parseChannelFeed,
  playlistFeedUrl,
  type ChannelFeed,
} from '../youtube-feed';
import snapshot from './youtube-snapshot.json';

// The channel's latest uploads for the homepage's "Lo último en video" band.
//
// One hour (A3, 2026-10-27): the channel publishes about once a day, so a new
// upload is on the site within the hour, and the homepage — force-dynamic,
// see app/(public)/layout.tsx — does not call YouTube on every visit.
const REVALIDATE_SECONDS = 3600;

// A feed that answers slowly must not hold the homepage hostage.
const TIMEOUT_MS = 4000;

async function fetchFeed(url: string): Promise<ChannelFeed> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: 'application/atom+xml, application/xml;q=0.9' },
  });
  if (!res.ok) throw new Error(`feed de YouTube respondió ${res.status}`);
  return parseChannelFeed(await res.text());
}

const queryChannelFeed = unstable_cache(
  async (): Promise<ChannelFeed> => {
    const channel = await fetchFeed(PLAYBOOK_CHANNEL_FEED);
    // An empty parse is a failure, not "the channel has no videos": a format
    // change on YouTube's side would look exactly like this, and caching it
    // would blank the section for an hour. Throwing keeps the last good value
    // in the cache — on a failed revalidation Next keeps serving it.
    if (!channel.longVideos.length && !channel.shorts.length) {
      throw new Error('feed de YouTube sin entradas legibles');
    }
    // Program playlists only add labels and older episodes, so one that fails
    // is skipped rather than failing the whole band.
    const programs = await Promise.all(
      PROGRAM_PLAYLISTS.map(p =>
        fetchFeed(playlistFeedUrl(p.id))
          .then(feed => ({ series: p.series, feed }))
          .catch(() => null),
      ),
    );
    return mergeProgramFeeds(channel, programs.filter(p => p !== null));
  },
  ['youtube-channel-feed-v2'],
  { revalidate: REVALIDATE_SECONDS, tags: ['youtube-feed'] },
);

// Backups, in order, for when YouTube can't be read AND the data cache has
// nothing (a cold instance right after a deploy):
//   1. the last feed this server instance read successfully;
//   2. the snapshot committed with the code (lib/data/youtube-snapshot.json,
//      refreshed with `npx tsx scripts/refresh-youtube-snapshot.ts`).
// Either one still goes through the band's 14-day rule, so a stale backup
// hides the band instead of passing off old videos as new.
let lastGood: ChannelFeed | null = null;

/**
 * The parsed feed, or null when YouTube is unreachable and no backup exists.
 * Never throws.
 */
export async function getChannelFeed(): Promise<ChannelFeed | null> {
  try {
    lastGood = await queryChannelFeed();
    return lastGood;
  } catch (err) {
    console.error('[video] no se pudo leer el feed de YouTube, se usa el respaldo:', err);
    return lastGood ?? (snapshot as ChannelFeed);
  }
}
