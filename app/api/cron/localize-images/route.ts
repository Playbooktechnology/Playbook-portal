// Vercel Cron target (vercel.json `crons`, daily): copies the external
// images of articles published in the last three days into Vercel Blob
// (lib/images/localize.ts). The admin save and the Make.com webhook already
// do this right after publishing; this sweep is the backstop for the paths
// that can't — scripts/publish-newsletter.ts runs outside Vercel without a
// Blob token — and for any copy that failed the first time.
//
// Auth: same Bearer CRON_SECRET check as app/api/cron/sync-readers-sheet.
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db/client';
import { ARTICLES_CACHE_TAG } from '@/lib/data/articles';
import { runImageMigration } from '@/lib/images/localize';

export const maxDuration = 300;

function constantTimeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';
  if (!secret || !constantTimeEqual(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ localized: false, reason: 'BLOB_READ_WRITE_TOKEN not set' });
  }

  const since = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const day = new Date().toISOString().slice(0, 10);
  const report = await runImageMigration(db, { scope: ['cover', 'body'], sinceDate: since, limit: 30, batchId: `auto-${day}` });
  if (report.articlesChanged) revalidateTag(ARTICLES_CACHE_TAG);
  return NextResponse.json({
    localized: true,
    articlesChanged: report.articlesChanged,
    failed: report.items.filter(i => i.error).map(i => ({ articleId: i.articleId, url: i.oldUrl, error: i.error })),
  });
}
