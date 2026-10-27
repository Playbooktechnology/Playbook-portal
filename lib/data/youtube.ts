import { unstable_cache } from 'next/cache';
import { parseChannelFeed, type ChannelVideo } from '../youtube-feed';

// Aldo Sales de Playbook (youtube.com/@AldoSalesPlaybook). The handle page
// resolves to this channel id; the feed only takes the id.
export const PLAYBOOK_CHANNEL_ID = 'UCFG7QAM8_aFM0MaX6g1SfTw';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${PLAYBOOK_CHANNEL_ID}`;

// Revalidated hourly. The fetch THROWS on any failure (network, non-200,
// a feed with no long-form video), and unstable_cache never stores a
// thrown result: when an hourly refresh fails, the last good list keeps
// being served. Only a cold start with the feed down reaches the caller's
// fallback (the CMS videos) — the page never breaks over it.
const cachedFeed = unstable_cache(
  async (): Promise<ChannelVideo[]> => {
    const res = await fetch(FEED_URL, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`YouTube feed HTTP ${res.status}`);
    const videos = parseChannelFeed(await res.text());
    if (!videos.length) throw new Error('YouTube feed: no long-form videos');
    return videos;
  },
  ['youtube-feed', PLAYBOOK_CHANNEL_ID],
  { revalidate: 3600 },
);

/** The latest `limit` long-form videos, topped up with `fallback` (deduped)
    when the feed is down or holds fewer than `limit` non-Shorts. */
export async function getChannelVideos(fallback: ChannelVideo[], limit = 3): Promise<ChannelVideo[]> {
  let feed: ChannelVideo[] = [];
  try {
    feed = await cachedFeed();
  } catch (err) {
    console.error('[youtube] feed unavailable, using fallback videos:', err);
  }
  const seen = new Set<string>();
  return [...feed, ...fallback].filter(v => v.id && !seen.has(v.id) && seen.add(v.id)).slice(0, limit);
}
