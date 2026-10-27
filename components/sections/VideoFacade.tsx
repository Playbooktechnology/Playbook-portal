'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics-events';

// A YouTube thumbnail that becomes the player only when clicked. Until then
// the band costs one ~15 KB image per video and zero requests to YouTube's
// player (≈1 MB of script per embed): the iframe, and every cookie that comes
// with it, exists only for the reader who asked to watch. The embed is the
// privacy-enhanced youtube-nocookie.com host and starts playing on mount,
// since the click that created it already said "play".
export function VideoFacade({
  id,
  title,
  thumbnail,
  position,
}: {
  id: string;
  title: string;
  thumbnail: string;
  /** 1-based slot in the band, sent with video_click. */
  position: number;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        className="video-facade-frame"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="video-facade"
      aria-label={`Reproducir: ${title}`}
      onClick={() => {
        trackEvent('video_click', { item_id: id, position, link_text: title.slice(0, 100), placement: 'portada' });
        // The homepage-module twin of video_click (hp_ family, see
        // lib/analytics-events.ts): "which homepage module earns its space"
        // reads hp_click_video; the site-wide act stays video_click.
        trackEvent('hp_click_video', { item_id: id, position, link_text: title.slice(0, 100), product: 'unknown' });
        setPlaying(true);
      }}
    >
      {/* Plain <img>: an i.ytimg.com thumbnail, decorative next to its own
          title (alt=""), same reasoning as every other editorial <img> here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnail} alt="" width={480} height={360} loading="lazy" decoding="async" />
      <span className="video-facade-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
