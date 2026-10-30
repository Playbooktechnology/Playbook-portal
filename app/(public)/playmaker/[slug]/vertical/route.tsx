import { getPlaymakerProfile } from '@/lib/playmaker/profiles';
import { playmakerShareImage } from '@/lib/playmaker/share-image';

// 1080×1350 version of a Playmaker profile's share card (A6), for posting the
// image itself on LinkedIn or Instagram. Linked from the profile as a download.
export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPlaymakerProfile(slug);
  if (!p) return new Response('No encontrado', { status: 404 });
  const res = await playmakerShareImage(p, 'vertical');
  res.headers.set('Content-Disposition', `inline; filename="playmaker-${p.slug}.png"`);
  return res;
}
