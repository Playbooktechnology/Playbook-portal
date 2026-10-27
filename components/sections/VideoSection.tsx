import type { SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { LazyEmbed } from '@/components/LazyEmbed';
import { videoDate, withUtm, type ChannelFeed } from '@/lib/youtube-feed';
import { VideoFacade } from './VideoFacade';
import { FRESHNESS, ageInDays } from '@/lib/freshness';

// "Lo último en video", the dark band on the homepage (A3, 2026-10-27).
//
// It reads the channel's public feed (lib/data/youtube.ts): no API key, an
// hourly refresh, and a backup copy when YouTube can't be read. What it shows
// is deliberately narrow: the three newest LONG videos, each with its date in
// sight, and nothing else. Shorts are out — the band is for episodes, and a
// vertical clip next to them read as filler. The player loads only when a
// reader clicks a thumbnail (VideoFacade); every link that leaves for YouTube
// carries UTM tags.
//
// Freshness (lib/freshness.ts): when the newest long video is older than
// FRESHNESS.videoMaxAgeDays, or there is no feed and no backup at all, the band
// hides instead of passing off old videos as the latest.
//
// `feed` is undefined only in the admin's live preview (a client component
// that must not fetch), which keeps showing the CMS-curated layout editors are
// editing. On the public homepage it is a feed or null, never undefined.

const VIDEOS_SHOWN = 3;

export function VideoSection({
  data,
  feed,
}: {
  data: SiteContentData['videoSection'];
  feed?: ChannelFeed | null;
}) {
  if (feed === undefined) return <CmsBand data={data} />;

  const videos = feed?.longVideos.slice(0, VIDEOS_SHOWN) ?? [];
  const newest = videos[0];
  if (!newest || ageInDays(newest.published) > FRESHNESS.videoMaxAgeDays) return null;

  const channelUrl = withUtm(safeUrl(data.channelLinkUrl), 'canal');

  return (
    <section className="video-section" id="video">
      <div className="container" style={{ padding: '0 24px 46px' }}>
        <div className="section-head reveal">
          <div>
            <h2>Lo último en video</h2>
            <p className="sub">{data.sub}</p>
          </div>
        </div>

        <div className="video-grid">
          <ul className="video-latest3">
            {videos.map((v, i) => (
              <li key={v.id} className="video-latest3-item reveal">
                <div className="video-latest3-frame">
                  <VideoFacade id={v.id} title={v.title} thumbnail={v.thumbnail} position={i + 1} />
                </div>
                <div className="video-latest3-meta">
                  {v.series && <span className="video-series">{v.series}</span>}
                  <h3 className="video-latest3-title">{v.title}</h3>
                  <span className="video-latest3-foot">
                    <time className="video-date" dateTime={v.published}>
                      {videoDate(v.published)}
                    </time>
                    <a
                      className="video-latest3-yt"
                      href={withUtm(v.url, v.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-analytics="video_click"
                      data-item-id={v.id}
                      data-position={i + 1}
                    >
                      Ver en YouTube <span aria-hidden="true">↗</span>
                    </a>
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="video-cta reveal">
            <p>Análisis, entrevistas y series originales cada semana.</p>
            <a className="btn light on-dark" href={channelUrl} target="_blank" rel="noopener noreferrer">
              {data.channelLinkLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ From the CMS
// The band as it was before the feed: two curated embeds and a list of episode
// links. Rendered only in the admin's live preview now.

function CmsBand({ data }: { data: SiteContentData['videoSection'] }) {
  return (
    <section className="video-section" id="video">
      <div className="container" style={{ padding: '0 24px 46px' }}>
        <div className="section-head reveal">
          <div>
            <h2>{data.heading}</h2>
            <p className="sub">{data.sub}</p>
          </div>
        </div>
        <div className="video-grid">
          <FromCms data={data} />
          <div className="video-cta reveal">
            <p>Análisis, entrevistas y series originales cada semana.</p>
            <a className="btn light on-dark" href={safeUrl(data.channelLinkUrl)} target="_blank" rel="noopener noreferrer">
              {data.channelLinkLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FromCms({ data }: { data: SiteContentData['videoSection'] }) {
  return (
    <div className="video-top">
      <div className="video-feature-card reveal">
        <div className="frame">
          <LazyEmbed>
            <iframe
              src={`https://www.youtube.com/embed/${data.featured.embedId}`}
              title={data.featured.embedTitle}
              loading="lazy"
              allowFullScreen
            />
          </LazyEmbed>
        </div>
        <h3 className="video-card-title">{data.featured.title}</h3>
      </div>
      <div className="video-feature-copy reveal">
        <div className="frame">
          <LazyEmbed>
            <iframe
              src={`https://www.youtube.com/embed/${data.secondary.embedId}`}
              title={data.secondary.embedTitle}
              loading="lazy"
              allowFullScreen
            />
          </LazyEmbed>
        </div>
        <h3 className="video-card-title">{data.secondary.title}</h3>
        <div className="more-eps">
          {data.secondary.episodeLinks.map((ep, i) => (
            <a key={i} href={safeUrl(ep.url)} target="_blank" rel="noopener noreferrer">
              {ep.label} <span>Ver video</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
