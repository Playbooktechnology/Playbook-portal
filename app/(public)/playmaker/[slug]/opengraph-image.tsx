import { getPlaymakerProfile } from '@/lib/playmaker/profiles';
import { playmakerShareImage } from '@/lib/playmaker/share-image';

// og:image of a Playmaker profile, 1200×627 (A6). Next wires the meta tags.
export const runtime = 'nodejs';
export const size = { width: 1200, height: 627 };
export const contentType = 'image/png';
export const alt = 'Playmaker, perfil de Playbook';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPlaymakerProfile(slug);
  if (!p) return new Response('No encontrado', { status: 404 });
  return playmakerShareImage(p, 'og');
}
