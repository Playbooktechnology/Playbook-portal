'use client';

import { useState } from 'react';
import type { ChannelVideo } from '@/lib/youtube-feed';

// Thumbnail + title until the reader clicks; only then the YouTube player
// (and its ~1MB of scripts and cookies) loads, from www.youtube.com, the
// frame-src next.config.ts's CSP already allows.
// It's a real link to the video first: without JS, or with a modifier key
// (new tab), it just opens YouTube. `data-analytics` makes the delegated
// listener in components/analytics/SiteEvents.tsx send hp_click_video with
// the video URL and title, same mechanism as the other homepage modules.
export function YouTubeFacade({ video, featured = false }: { video: ChannelVideo; featured?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const Heading = featured ? 'h3' : 'h4';

  return (
    <div className={`yt-card${featured ? ' yt-card-featured' : ''}`}>
      <div className="yt-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <a
            className="yt-thumb"
            href={video.url}
            data-analytics="hp_click_video"
            aria-label={`Reproducir: ${video.title}`}
            onClick={e => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setPlaying(true);
            }}
          >
            {/* i.ytimg.com is YouTube's own thumbnail CDN, the same one the
                player would load; next/image would only proxy it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={video.thumbnail} alt="" width={480} height={360} loading="lazy" decoding="async" />
            <span className="yt-play" aria-hidden="true" />
            <span className="visually-hidden">{video.title}</span>
          </a>
        )}
      </div>
      <Heading className="video-card-title">{video.title}</Heading>
    </div>
  );
}
