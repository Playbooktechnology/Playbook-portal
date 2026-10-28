import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicArticles, type Article } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { NewsRow } from '@/components/article/NewsRow';
import { SITE_URL } from '@/lib/site-url';
import { authorDisplayName, hasAuthorMarkup, isIndexableAuthorName } from '@/lib/author-name';
import { authorPath, authorSlug, profileFor, type AuthorProfile } from '@/lib/authors';
import { shouldShowAuthor } from '@/lib/related-articles';
import { jsonLdScript } from '@/lib/json-ld';

// /autor/<slug> — the author page (A5, 2026-10-27). Replaces /autor?nombre=,
// which now redirects here. Profile data (photo, role, "Qué cubro",
// "Trayectoria", LinkedIn) comes from lib/authors.ts; the notes are the
// author's published stories whose byline is actually shown — a story
// published without a visible byline is not listed under anyone's name.

type Props = { params: Promise<{ slug: string }> };

const RECENT_COUNT = 12;

async function resolveAuthor(slug: string): Promise<{
  name: string;
  profile: AuthorProfile | null;
  articles: Article[];
} | null> {
  const [pool, content] = await Promise.all([getPublicArticles(), getSiteContent()]);
  const profile = profileFor(slug);
  const names = new Set(profile ? [profile.name, ...(profile.aliases ?? [])].map(authorSlug) : [slug]);
  const articles = pool
    .filter(a => a.author && !hasAuthorMarkup(a.author) && names.has(authorSlug(a.author)) && shouldShowAuthor(a, content.siteSettings.mostrarAutorGlobal))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const name = profile?.name ?? (articles[0] ? authorDisplayName(articles[0].author) : '');
  if (!name) return null;
  return { name, profile, articles };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await resolveAuthor(slug);
  if (!author) return { title: 'Autor', robots: { index: false, follow: true } };
  const indexable = isIndexableAuthorName(author.name) && (author.profile !== null || author.articles.length > 0);
  return {
    title: author.name,
    description: author.profile?.covers || `Notas de ${author.name} en Playbook.`,
    alternates: { canonical: `${SITE_URL}${authorPath(author.name)}` },
    robots: { index: indexable, follow: true },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = await resolveAuthor(slug);
  if (!author) notFound();
  const { name, profile, articles } = author;
  const { siteSettings } = await getSiteContent();
  const url = `${SITE_URL}${authorPath(name)}`;

  // ProfilePage + Person: every bylined NewsArticle's author.url points here.
  const profileLd = isIndexableAuthorName(name)
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        '@id': `${url}#profile`,
        url,
        mainEntity: {
          '@type': 'Person',
          '@id': `${url}#person`,
          name,
          url,
          jobTitle: profile?.role || undefined,
          description: profile?.covers || undefined,
          image: profile?.photo ? `${SITE_URL}${profile.photo}` : undefined,
          sameAs: profile?.linkedin ? [profile.linkedin] : undefined,
          worksFor: { '@id': `${SITE_URL}#organization` },
        },
      }
    : null;

  return (
    <>
      {profileLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(profileLd) }} />}
      <main className="container news-section archive-page author-page" id="autor-main">
        <header className="author-hero">
          {profile?.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="author-photo" src={profile.photo} alt={name} width={160} height={160} />
          )}
          <div className="author-hero-copy">
            <span className="eyebrow">Autor</span>
            <h1>{name}</h1>
            {profile?.role && <p className="author-role">{profile.role}</p>}
            {profile?.linkedin && (
              <a className="author-linkedin" href={profile.linkedin} target="_blank" rel="noopener noreferrer me">
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </header>

        {profile && (
          <div className="author-about">
            {profile.covers && (
              <section>
                <h2>Qué cubro</h2>
                <p>{profile.covers}</p>
              </section>
            )}
            {profile.career.length > 0 && (
              <section>
                <h2>Trayectoria</h2>
                {profile.career.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            )}
          </div>
        )}

        <section className="author-notes" aria-labelledby="author-notes-title">
          <div className="section-head">
            <h2 id="author-notes-title">Sus notas más recientes</h2>
          </div>
          {articles.length ? (
            <div className="news-list">
              {articles.slice(0, RECENT_COUNT).map(a => (
                <NewsRow key={a.id} article={a} heading="h3" showAuthorsGlobal={siteSettings.mostrarAutorGlobal} />
              ))}
            </div>
          ) : (
            <p className="empty-state">Todavía no hay notas firmadas.</p>
          )}
          <p className="author-more">
            <Link href="/equipo">Conoce al equipo de Playbook →</Link>
          </p>
        </section>
      </main>
    </>
  );
}
