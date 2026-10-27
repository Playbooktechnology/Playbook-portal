import type { SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { LazyEmbed } from '@/components/LazyEmbed';
import { videoDate, type ChannelFeed, type ChannelVideo } from '@/lib/youtube-feed';

// Video Playbook, the dark band on the homepage.
//
// Since 2026-10-27 it reads the channel's own feed (lib/data/youtube.ts)
// instead of waiting for someone to paste video ids into the CMS. The
// hand-curated version had frozen on two World Cup episodes from the summer
// while the channel kept publishing almost daily — eleven shorts and four long
// videos in the eighteen days before this change, none of them on the site.
//
// The feed also changed WHAT the band shows, not just how fresh it is. The
// channel's shorts outdraw its long videos by one to two orders of magnitude
// (30,318 views on the Leagues Cup trophy short against 35–165 for the long
// videos of the same weeks), and the band showed none. Now: the newest long
// video embedded, the next ones as a list, and a rail of the latest shorts.
// View counts are read by nothing here on purpose — printing "35 vistas" next
// to a long video would advertise the weak number.
//
// `feed` is null when YouTube can't be read, and the CMS fields take over —
// the exact layout this band had before. The admin's live preview never
// passes a feed (it is a client component and must not fetch), so editors
// keep seeing the curated fallback they are editing.

const MORE_LONG_VIDEOS = 3;
const SHORTS_SHOWN = 6;

export function VideoSection({
  data,
  feed = null,
}: {
  data: SiteContentData['videoSection'];
  feed?: ChannelFeed | null;
}) {
  return (
    <section className="video-section" id="video">
      <div className="container" style={{ padding: '0 24px 46px' }}>
        {/* No .section-link here, unlike every other section head: the
            .video-cta strip below is the section's single channel link
            (it used to render twice, same label, same href). */}
        <div className="section-head reveal">
          <div>
            <h2>{data.heading}</h2>
            <p className="sub">{data.sub}</p>
          </div>
        </div>

        <div className="video-grid">
          {feed ? <FromFeed data={data} feed={feed} /> : <FromCms data={data} />}

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

// ------------------------------------------------------------ From the feed

function FromFeed({ data, feed }: { data: SiteContentData['videoSection']; feed: ChannelFeed }) {
  const [lead, ...rest] = feed.longVideos;
  const more = rest.slice(0, MORE_LONG_VIDEOS);
  const shorts = feed.shorts.slice(0, SHORTS_SHOWN);

  return (
    <>
      <div className={`video-top${more.length ? '' : ' is-single'}`}>
        <div className="video-feature-card reveal">
          <div className="frame">
            <LazyEmbed>
              <iframe
                src={`https://www.youtube.com/embed/${lead ? lead.id : data.featured.embedId}`}
                title={lead ? lead.title : data.featured.embedTitle}
                loading="lazy"
                allowFullScreen
              />
            </LazyEmbed>
          </div>
          {lead ? (
            <div className="video-lead-meta">
              {lead.series && <span className="video-series">{lead.series}</span>}
              <h3 className="video-card-title">{lead.title}</h3>
              <span className="video-date">{videoDate(lead.published)}</span>
            </div>
          ) : (
            // A window of fifteen uploads that happens to be all shorts: the
            // curated long video stays up rather than leaving a hole.
            <h3 className="video-card-title">{data.featured.title}</h3>
          )}
        </div>

        {more.length > 0 && (
          <div className="video-latest reveal">
            <p className="video-latest-head">Más videos</p>
            <ul className="video-latest-list">
              {more.map(v => (
                <li key={v.id}>
                  <VideoRow video={v} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {shorts.length > 0 && (
        <div className="video-shorts reveal">
          <div className="video-shorts-head">
            <h3>Shorts</h3>
            <a href={shortsUrl(data.channelLinkUrl)} target="_blank" rel="noopener noreferrer">
              Ver todos <span aria-hidden="true">→</span>
            </a>
          </div>
          {/* A list, because it is one: six of the same thing, in order. On
              phones it scrolls sideways with snap points instead of stacking
              six tall tiles down the page. */}
          <ul className="video-shorts-rail">
            {shorts.map(v => (
              <li key={v.id}>
                <a className="video-short" href={v.url} target="_blank" rel="noopener noreferrer">
                  <span className="video-short-frame">
                    {/* Plain <img>: an i.ytimg.com thumbnail, decorative next
                        to its own title (alt=""), same reasoning as every
                        other editorial <img> in this repo. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail} alt="" width={480} height={360} loading="lazy" decoding="async" />
                  </span>
                  <span className="video-short-title">{v.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function VideoRow({ video }: { video: ChannelVideo }) {
  return (
    <a className="video-row" href={video.url} target="_blank" rel="noopener noreferrer">
      <span className="video-row-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.thumbnail} alt="" width={480} height={360} loading="lazy" decoding="async" />
      </span>
      <span className="video-row-copy">
        {video.series && <span className="video-series">{video.series}</span>}
        <span className="video-row-title">{video.title}</span>
        <span className="video-date">{videoDate(video.published)}</span>
      </span>
    </a>
  );
}

/** The channel's Shorts tab, when the CMS link is a YouTube channel; else the link as given. */
function shortsUrl(channelUrl: string): string {
  const url = safeUrl(channelUrl);
  return /^https:\/\/(www\.)?youtube\.com\/@[\w.-]+\/?$/i.test(url) ? `${url.replace(/\/+$/, '')}/shorts` : url;
}

// ------------------------------------------------------------ From the CMS
// The band exactly as it was before the feed: two curated embeds and a list of
// episode links. Rendered when YouTube can't be read, and in the admin's live
// preview.

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
