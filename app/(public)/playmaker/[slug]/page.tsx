import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLAYMAKER } from '@/lib/playmaker/config';
import { getPlaymakerProfile, getPlaymakerProfiles, playmakerPath } from '@/lib/playmaker/profiles';
import { PlaymakerPortrait } from '@/components/playmaker/PlaymakerPortrait';
import { SponsorSeal } from '@/components/playmaker/SponsorSeal';
import { ShareRow } from '@/components/article/ShareRow';
import { SITE_URL } from '@/lib/site-url';
import { shortDate } from '@/lib/deals';
import { jsonLdScript } from '@/lib/json-ld';

// Un perfil de Playmaker (A6): retrato con marco, ficha, cuerpo, frases
// citables, compartir, "Más Playmakers" y la nota de independencia al pie.
// La imagen para compartir 1200×627 la genera ./opengraph-image.tsx; la
// vertical 1080×1350 (LinkedIn/Instagram), ./vertical/route.tsx.

type Props = { params: Promise<{ slug: string }> };

const MORE_COUNT = 3;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPlaymakerProfile(slug);
  if (!p) return { title: PLAYMAKER.name };
  const url = `${SITE_URL}${playmakerPath(p.slug)}`;
  return {
    title: `${p.name} · ${PLAYMAKER.name}`,
    description: p.dek,
    alternates: { canonical: url },
    robots: p.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      url,
      title: `${p.name} · ${PLAYMAKER.name}`,
      description: p.dek,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function PlaymakerProfilePage({ params }: Props) {
  const { slug } = await params;
  const p = getPlaymakerProfile(slug);
  if (!p) notFound();
  const more = getPlaymakerProfiles()
    .filter(x => x.slug !== p.slug)
    .slice(0, MORE_COUNT);
  const url = `${SITE_URL}${playmakerPath(p.slug)}`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: `${p.name}: ${p.role}, ${p.organization}`,
    description: p.dek,
    datePublished: `${p.publishedAt}T00:00:00-06:00`,
    dateModified: `${p.publishedAt}T00:00:00-06:00`,
    articleSection: PLAYMAKER.name,
    inLanguage: 'es-MX',
    image: [`${url}/opengraph-image`],
    author: {
      '@type': 'Organization',
      name: p.author || 'Playbook',
      url: SITE_URL,
    },
    publisher: { '@id': `${SITE_URL}#organization` },
    about: {
      '@type': 'Person',
      name: p.name,
      jobTitle: p.role,
      worksFor: { '@type': 'Organization', name: p.organization },
    },
    mainEntityOfPage: url,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <main className="container pm-page pm-profile" id="playmaker-profile">
        <div className="pm-bar">
          <Link className="pm-bar-name" href={PLAYMAKER.path}>
            {PLAYMAKER.name}
          </Link>
          <SponsorSeal size="sm" />
        </div>

        <article>
          <header className="pm-profile-head">
            <PlaymakerPortrait name={p.name} src={p.portrait} credit={p.portraitCredit} priority />
            <div className="pm-profile-id">
              <span className="pm-kicker">
                {PLAYMAKER.name} · {shortDate(p.publishedAt)}
              </span>
              <h1 className="pm-profile-name">{p.name}</h1>
              <p className="pm-profile-role">
                {p.role} · {p.organization}
              </p>
              <dl className="pm-facts">
                <div>
                  <dt>En el cargo desde</dt>
                  <dd>{p.inRoleSince}</dd>
                </div>
                <div>
                  <dt>Mandato</dt>
                  <dd>{p.mandate}</dd>
                </div>
                <div>
                  <dt>Cargo anterior</dt>
                  <dd>{p.previousRole}</dd>
                </div>
              </dl>
            </div>
          </header>

          <div className="pm-col">
            <p className="pm-dek">{p.dek}</p>
            <p className="byline pm-byline">Por {p.author || 'Redacción Playbook'}</p>

            <div className="pm-body">
              {p.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {p.quotes.length > 0 && (
              <section className="pm-quotes" aria-label="Frases">
                {p.quotes.map((q, i) => (
                  <blockquote key={i} className="pm-quote">
                    <p>“{q}”</p>
                    <cite>{p.name}</cite>
                  </blockquote>
                ))}
              </section>
            )}

            <div className="pm-share">
              <ShareRow url={url} title={`${p.name} · ${PLAYMAKER.name}`} placement="playmaker" />
              <a
                className="pm-share-download"
                href={`${playmakerPath(p.slug)}/vertical`}
                download={`playmaker-${p.slug}.png`}
              >
                Descargar imagen para LinkedIn e Instagram (1080×1350)
              </a>
            </div>
          </div>
        </article>

        {more.length > 0 && (
          <section className="pm-more" aria-labelledby="pm-more-title">
            <h2 className="pm-archive-title" id="pm-more-title">
              Más Playmakers
            </h2>
            <ul className="pm-grid">
              {more.map(m => (
                <li key={m.slug}>
                  <Link className="pm-card" href={playmakerPath(m.slug)}>
                    <PlaymakerPortrait name={m.name} src={m.portrait} />
                    <span className="pm-card-date">{shortDate(m.publishedAt)}</span>
                    <span className="pm-card-name">{m.name}</span>
                    <span className="pm-card-role">
                      {m.role} · {m.organization}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="pm-footer">
          <SponsorSeal size="sm" />
          <p className="pm-disclaimer">{PLAYMAKER.sponsor.disclaimer}</p>
        </footer>
      </main>
    </>
  );
}
