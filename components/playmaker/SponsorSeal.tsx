import { PLAYMAKER } from '@/lib/playmaker/config';

// "Presentado por Range Rover", always monochrome: the logo file (when it
// arrives) goes through a CSS filter, so the section never wears the
// sponsor's colours. Until then, the name in letterspaced caps.
export function SponsorSeal({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { sponsor } = PLAYMAKER;
  return (
    <p className={`pm-seal pm-seal--${size}`}>
      <span className="pm-seal-label">{sponsor.label}</span>
      {sponsor.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pm-seal-logo" src={sponsor.logo} alt={sponsor.name} height={18} />
      ) : (
        <span className="pm-seal-name">{sponsor.name}</span>
      )}
    </p>
  );
}
