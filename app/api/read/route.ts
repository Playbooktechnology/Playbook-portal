import { NextResponse } from 'next/server';
import { getArticleMetaById } from '@/lib/data/articles';
import { recordRead } from '@/lib/metering';

// Write side of the read log while the wall is off (lib/metering.ts,
// recordRead). components/article/ReadBeacon.tsx calls it once per browser
// per article per month, so crawlers that never run JavaScript no longer
// cost a database write on every article view.
//
// Always answers 204 for a well-formed request: the beacon has nothing to
// do with a failure, and a reader should never see one.
export async function POST(request: Request) {
  let articleId: unknown;
  try {
    ({ articleId } = await request.json());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof articleId !== 'string' || !articleId || articleId.length > 300) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    // Cached lookup, so an id that isn't an article costs no insert attempt.
    if (await getArticleMetaById(articleId)) await recordRead(articleId);
  } catch (err) {
    console.error('[api/read] could not log read:', err);
  }
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
