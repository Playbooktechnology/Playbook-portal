import { decodeEntities } from './html-entities';

// The Playbook YouTube channel, read from its public Atom feed.
//
// Why the feed and not the Data API: the feed is free, needs no API key and
// no Google Cloud project, and has been stable for over a decade. The Data
// API would add a key to rotate and a quota to watch in exchange for things
// the homepage does not need (more than the latest 15 uploads, exact
// durations). The one real limit is that 15-item window — at the channel's
// pace in October 2026 (about four shorts per long video) that still holds
// three or four long videos at any moment, which is more than the section
// shows.
//
// This file is the pure half: types, parsing and title cleanup, no fetching,
// so the admin's live preview (a client component) can import the types
// without pulling server code. The fetch lives in lib/data/youtube.ts.

/** "Aldo Sales de Playbook" — @AldoSalesPlaybook. A channel id never changes,
 *  unlike the handle, which is why the feed is keyed on it. */
export const PLAYBOOK_CHANNEL_ID = 'UCFG7QAM8_aFM0MaX6g1SfTw';

export const PLAYBOOK_CHANNEL_FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${PLAYBOOK_CHANNEL_ID}`;

export type ChannelVideo = {
  id: string;
  /** Display title: hashtags and leading emoji removed, series suffix split off. */
  title: string;
  /** The series a long video belongs to, from a trailing " | Serie" — e.g. "Los Otros Once". */
  series: string | null;
  /** ISO timestamp from the feed. */
  published: string;
  isShort: boolean;
  url: string;
  /** hqdefault (480×360, ~15 KB). For a short it is the vertical frame centred on a
   *  blurred fill, so a 9:16 box with object-fit:cover shows exactly the short —
   *  at a tenth of the weight of the 1080×1920 original-aspect variant. */
  thumbnail: string;
};

export type ChannelFeed = {
  /** Newest first. */
  longVideos: ChannelVideo[];
  /** Newest first. */
  shorts: ChannelVideo[];
};

function pick(block: string, re: RegExp): string | null {
  const m = block.match(re);
  return m ? m[1] : null;
}

/**
 * Hashtags out, leading emoji out, whitespace collapsed.
 *
 * Shorts titles on this channel carry their discovery tags inline
 * ("…QUE SE LOS LLEVA LA FREGADA #valencia #laliga") and some open on emoji
 * ("🤝🏟️ Un Mundial no se construye…"). Both are for YouTube's search and
 * feed, not for a headline on someone else's page. Casing is left exactly as
 * the channel wrote it: lower-casing an all-caps title would also lower-case
 * NBA, ESPN and FIFA, and the channel's voice is its own call.
 */
export function cleanVideoTitle(raw: string): string {
  return decodeEntities(raw)
    .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, ' ')
    .replace(/^[^\p{L}\p{N}¿¡"'“]+/u, '')
    // "…un cierre emotivo.El equipo vio…" — a sentence glued to the next one,
    // as typed into YouTube's title box. Only after a LOWERCASE letter, so an
    // acronym like "E.U." is never pried apart.
    .replace(/(?<=\p{Ll})\.(?=\p{Lu})/gu, '. ')
    .replace(/\s+/g, ' ')
    .replace(/[\s|·—–-]+$/u, '')
    .trim();
}

/**
 * "Cómo se coordinó el Mundial 2026… | Los Otros Once" → title + series.
 * Only the LAST " | " splits, and only when what follows is short enough to be
 * a series name rather than the second half of a sentence.
 */
export function splitSeries(title: string): { title: string; series: string | null } {
  const at = title.lastIndexOf(' | ');
  if (at <= 0) return { title, series: null };
  const series = title.slice(at + 3).trim();
  const head = title.slice(0, at).trim();
  if (!series || series.length > 40 || !head) return { title, series: null };
  return { title: head, series };
}

/** Parses the channel's Atom feed. Entries that lack an id are skipped, never guessed. */
export function parseChannelFeed(xml: string): ChannelFeed {
  const longVideos: ChannelVideo[] = [];
  const shorts: ChannelVideo[] = [];

  for (const block of xml.split('<entry>').slice(1)) {
    const id = pick(block, /<yt:videoId>([\w-]{11})<\/yt:videoId>/);
    if (!id) continue;
    const rawTitle = pick(block, /<title>([\s\S]*?)<\/title>/) ?? '';
    const link = pick(block, /<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) ?? '';
    const published = pick(block, /<published>([^<]+)<\/published>/) ?? '';
    // The feed marks a short only through its link (/shorts/<id>); there is no
    // dedicated field. Checked against the live feed, 2026-10-27: 11 of 15
    // entries carried it, and every one was a vertical video.
    const isShort = link.includes('/shorts/');
    const cleaned = cleanVideoTitle(rawTitle);
    const { title, series } = isShort ? { title: cleaned, series: null } : splitSeries(cleaned);
    if (!title) continue;

    const video: ChannelVideo = {
      id,
      title,
      series,
      published,
      isShort,
      url: isShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
    (isShort ? shorts : longVideos).push(video);
  }

  const newestFirst = (a: ChannelVideo, b: ChannelVideo) => b.published.localeCompare(a.published);
  return { longVideos: longVideos.sort(newestFirst), shorts: shorts.sort(newestFirst) };
}

/** "27 oct" — the publish day in Mexico City, the audience's clock. */
export function videoDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' })
    .replace('.', '');
}
