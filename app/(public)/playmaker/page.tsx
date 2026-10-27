import type { Metadata } from 'next';
import Link from 'next/link';
import { PLAYMAKER } from '@/lib/playmaker/config';
import { getPlaymakerProfiles, playmakerPath } from '@/lib/playmaker/profiles';
import { PlaymakerPortrait } from '@/components/playmaker/PlaymakerPortrait';
import { SponsorSeal } from '@/components/playmaker/SponsorSeal';
import { SITE_URL } from '@/lib/site-url';
import { shortDate } from '@/lib/deals';

// /playmaker — portada de sección y archivo (A6). El perfil más reciente al
// frente; los anteriores, en archivo. Nombre, logotipo y patrocinio salen de
// lib/playmaker/config.ts.

export const metadata: Metadata = {
  title: PLAYMAKER.name,
  description: PLAYMAKER.tagline,
  alternates: { canonical: `${SITE_URL}${PLAYMAKER.path}` },
};

export default function PlaymakerSectionPage() {
  const [latest, ...archive] = getPlaymakerProfiles();

  return (
    <main className="container pm-page" id="playmaker-main">
      <header className="pm-section-head">
        <div className="pm-section-brand">
          {PLAYMAKER.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="pm-section-logo" src={PLAYMAKER.logo} alt={PLAYMAKER.name} height={56} />
          ) : (
            <h1 className="pm-section-name">{PLAYMAKER.name}</h1>
          )}
          <p className="pm-section-tagline">{PLAYMAKER.tagline}</p>
        </div>
        <SponsorSeal />
      </header>

      {!latest ? (
        <p className="empty-state pm-empty">El primer perfil se publica el jueves 5 de noviembre.</p>
      ) : (
        <>
          <Link className="pm-lead" href={playmakerPath(latest.slug)}>
            <PlaymakerPortrait name={latest.name} src={latest.portrait} priority />
            <div className="pm-lead-copy">
              <span className="pm-kicker">Playmaker de la semana · {shortDate(latest.publishedAt)}</span>
              <h2 className="pm-lead-name">{latest.name}</h2>
              <p className="pm-lead-role">
                {latest.role} · {latest.organization}
              </p>
              <p className="pm-lead-dek">{latest.dek}</p>
              <span className="pm-lead-read">Leer el perfil →</span>
            </div>
          </Link>

          {archive.length > 0 && (
            <section className="pm-archive" aria-labelledby="pm-archive-title">
              <h2 className="pm-archive-title" id="pm-archive-title">
                Archivo
              </h2>
              <ul className="pm-grid">
                {archive.map(p => (
                  <li key={p.slug}>
                    <Link className="pm-card" href={playmakerPath(p.slug)}>
                      <PlaymakerPortrait name={p.name} src={p.portrait} />
                      <span className="pm-card-date">{shortDate(p.publishedAt)}</span>
                      <span className="pm-card-name">{p.name}</span>
                      <span className="pm-card-role">
                        {p.role} · {p.organization}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
