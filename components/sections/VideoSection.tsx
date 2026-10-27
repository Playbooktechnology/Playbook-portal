import type { SiteContentData } from '@/lib/data/site-content';
import type { ChannelVideo } from '@/lib/youtube-feed';
import { safeUrl } from '@/lib/safe-url';
import { YouTubeFacade } from './YouTubeFacade';

// Video Playbook (2026-10-27): the channel's three latest long-form videos,
// read from its public feed (lib/data/youtube.ts, hourly, Shorts excluded),
// instead of the two embeds fixed in the CMS that had been showing the
// June "Los Otros Once" since the Mundial. Each card is a thumbnail until
// clicked (YouTubeFacade), so the homepage loads no YouTube player at all.
//
// The CMS Video tab still edits the heading, sub and the channel CTA, and
// its two embed ids are the fallback the page uses if the feed is down on
// a cold start (cmsVideos below), so the section never renders empty.
export function cmsVideos(data: SiteContentData['videoSection']): ChannelVideo[] {
  return [data.featured, data.secondary]
    .filter(v => v.embedId)
    .map(v => ({
      id: v.embedId,
      title: v.title || v.embedTitle,
      url: `https://www.youtube.com/watch?v=${v.embedId}`,
      published: '',
      thumbnail: `https://i.ytimg.com/vi/${v.embedId}/hqdefault.jpg`,
    }));
}

export function VideoSection({
  data,
  videos,
}: {
  data: SiteContentData['videoSection'];
  videos?: ChannelVideo[];
}) {
  const list = (videos?.length ? videos : cmsVideos(data)).slice(0, 3);
  const [lead, ...rest] = list;

  return (
    <section className="video-section" id="video">
      <div className="container" style={{ padding: '0 24px 46px' }}>
        {/* No .section-link here: the CTA strip below is the section's
            single conversion point (the head link duplicated it). */}
        <div className="section-head reveal">
          <div>
            <h2>{data.heading}</h2>
            <p className="sub">{data.sub}</p>
          </div>
        </div>

        <div className="video-grid">
          {lead && (
            <div className="yt-grid reveal">
              <YouTubeFacade video={lead} featured />
              {rest.length > 0 && (
                <div className="yt-side">
                  {rest.map(v => (
                    <YouTubeFacade key={v.id} video={v} />
                  ))}
                </div>
              )}
            </div>
          )}

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
