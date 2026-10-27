// Refreshes lib/data/youtube-snapshot.json, the last-resort backup the video
// band falls back to when YouTube can't be read on a cold cache. Run it
// whenever convenient (it is not part of the build):
//
//   npx tsx scripts/refresh-youtube-snapshot.ts
import { writeFileSync } from 'node:fs';
import {
  PLAYBOOK_CHANNEL_FEED,
  PROGRAM_PLAYLISTS,
  mergeProgramFeeds,
  parseChannelFeed,
  playlistFeedUrl,
} from '../lib/youtube-feed';

async function read(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return parseChannelFeed(await res.text());
}

async function main() {
  const channel = await read(PLAYBOOK_CHANNEL_FEED);
  const programs = await Promise.all(PROGRAM_PLAYLISTS.map(async p => ({ series: p.series, feed: await read(playlistFeedUrl(p.id)) })));
  const feed = mergeProgramFeeds(channel, programs);
  writeFileSync('lib/data/youtube-snapshot.json', JSON.stringify(feed, null, 2) + '\n');
  console.log(`${feed.longVideos.length} videos largos, ${feed.shorts.length} shorts`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
