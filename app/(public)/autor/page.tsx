import { permanentRedirect } from 'next/navigation';
import { authorDisplayName } from '@/lib/author-name';
import { authorPath } from '@/lib/authors';

// /autor?nombre=<name> was the author page until 2026-10-27 (A5). It moved to
// /autor/<slug>; this keeps every old link, sitemap entry and backlink working
// with a permanent redirect. A raw markdown byline in the URL still resolves:
// authorPath() slugs the clean display name (lib/author-name.ts).
type Props = { searchParams: Promise<{ nombre?: string }> };

export default async function LegacyAutorPage({ searchParams }: Props) {
  const { nombre } = await searchParams;
  const name = authorDisplayName(nombre);
  permanentRedirect(name ? authorPath(name) : '/equipo');
}
