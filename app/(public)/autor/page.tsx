import { permanentRedirect } from 'next/navigation';
import { authorDisplayName, hasAuthorMarkup } from '@/lib/author-name';
import { authorPath } from '@/lib/authors';

// /autor?nombre=<name> was the author page until 2026-10-27 (A5). It moved to
// /autor/<slug>; this keeps every old link, sitemap entry and backlink working
// with a permanent redirect. A byline with brackets or URLs (raw markdown)
// goes to /equipo: it never gets an /autor page (lib/author-name.ts).
type Props = { searchParams: Promise<{ nombre?: string }> };

export default async function LegacyAutorPage({ searchParams }: Props) {
  const { nombre } = await searchParams;
  const name = authorDisplayName(nombre);
  // A raw markdown/URL byline never had a legitimate author page: send it to
  // the team page instead of minting a slug from it.
  permanentRedirect(name && !hasAuthorMarkup(nombre) ? authorPath(name) : '/equipo');
}
