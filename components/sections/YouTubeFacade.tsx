'use client';

import { useState } from 'react';

// Thumbnail + play button until the reader clicks; only then the YouTube
// player (and its ~1MB of scripts and cookies) loads, from www.youtube.com,
// the frame-src next.config.ts's CSP already allows. It's a real link to the
// video first: without JS, or with a modifier key (new tab), it just opens
// YouTube. `data-analytics` makes the delegated listener in
// components/analytics/SiteEvents.tsx send hp_click_video with the video URL
// and title, same mechanism as the other homepage modules.
export function YouTubeFacade({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const url = `https://www.youtube.com/watch?v=${id}`;

  return (
    <div className="yt-frame">
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <a
          className="yt-thumb"
          href={url}
          data-analytics="hp_click_video"
          aria-label={`Reproducir: ${title}`}
          onClick={e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            setPlaying(true);
          }}
        >
          {/* i.ytimg.com is YouTube's own thumbnail CDN, the same one the
              player would load; next/image would only proxy it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width={480} height={360} loading="lazy" decoding="async" />
          <span className="yt-play" aria-hidden="true" />
          <span className="visually-hidden">{title}</span>
        </a>
      )}
    </div>
  );
}
