import { PLAYMAKER } from '@/lib/playmaker/config';

// The framed portrait. The frame is the section's signature: Majo's PNG
// overlay when PLAYMAKER.frame is set, a provisional double green rule in CSS
// until then. A profile without its photo yet shows the person's initials, so
// a preview never renders a broken image.
export function PlaymakerPortrait({
  name,
  src,
  credit,
  priority = false,
}: {
  name: string;
  src: string;
  credit?: string;
  priority?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('');
  return (
    <figure className={`pm-portrait${PLAYMAKER.frame ? ' has-frame' : ''}`}>
      <div className="pm-portrait-box">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="pm-portrait-photo"
            src={src}
            alt={name}
            width={1080}
            height={1350}
            {...(priority ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
          />
        ) : (
          <span className="pm-portrait-initials" aria-hidden="true">
            {initials}
          </span>
        )}
        {PLAYMAKER.frame && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pm-portrait-frame" src={PLAYMAKER.frame} alt="" aria-hidden="true" />
        )}
      </div>
      {credit && <figcaption className="pm-portrait-credit">Foto: {credit}</figcaption>}
    </figure>
  );
}
