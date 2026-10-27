// Parses the public YouTube channel feed
// (https://www.youtube.com/feeds/videos.xml?channel_id=…) — no API key, no
// quota. The feed is the channel's latest 15 uploads, Shorts included;
// Shorts are the entries whose alternate link is a /shorts/ URL.

export type ChannelVideo = {
  id: string;
  title: string;
  url: string;
  published: string;
  thumbnail: string;
};

function decode(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

export function parseChannelFeed(xml: string): ChannelVideo[] {
  const videos: ChannelVideo[] = [];
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const id = entry.match(/<yt:videoId>([\w-]{6,})<\/yt:videoId>/)?.[1];
    const url = entry.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? '';
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    if (!id || !title || /\/shorts\//.test(url)) continue;
    videos.push({
      id,
      title: decode(title).trim(),
      url: `https://www.youtube.com/watch?v=${id}`,
      published: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '',
      // hqdefault always exists (maxres doesn't for every upload).
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }
  return videos;
}
