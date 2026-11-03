// /admin → Imágenes: inventory, batch migration to Vercel Blob, and undo.
// Editor-only. See lib/images/localize.ts for the rules (credits untouched,
// every rewrite logged before it is applied, failures keep their URL).
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { ARTICLES_CACHE_TAG } from '@/lib/data/articles';
import { SITE_CONTENT_CACHE_TAG } from '@/lib/data/site-content';
import { listImageBatches, revertImageBatch, runImageMigration, type Scope } from '@/lib/images/localize';

// A batch downloads and uploads up to `limit` articles' images; keep it
// well inside the function time limit and let the editor click again.
export const maxDuration = 300;

const SCOPES: Scope[] = ['cover', 'body', 'cms'];

type Body =
  | { action: 'plan'; scope: Scope[] }
  | { action: 'migrate'; scope: Scope[]; limit?: number }
  | { action: 'revert'; batchId: string }
  | { action: 'batches' };

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  try {
    switch (body.action) {
      case 'plan':
      case 'migrate': {
        const scope = (body.scope ?? []).filter(s => SCOPES.includes(s));
        if (!scope.length) return NextResponse.json({ error: 'Elige qué migrar' }, { status: 400 });
        const report = await runImageMigration(db, {
          scope,
          dryRun: body.action === 'plan',
          limit: body.action === 'migrate' ? Math.min(Math.max(body.limit ?? 20, 1), 50) : undefined,
        });
        if (body.action === 'migrate') {
          revalidateTag(ARTICLES_CACHE_TAG);
          revalidateTag(SITE_CONTENT_CACHE_TAG);
        }
        return NextResponse.json(report);
      }
      case 'revert': {
        const result = await revertImageBatch(db, body.batchId);
        revalidateTag(ARTICLES_CACHE_TAG);
        revalidateTag(SITE_CONTENT_CACHE_TAG);
        return NextResponse.json(result);
      }
      case 'batches':
        return NextResponse.json({ batches: await listImageBatches(db) });
      default:
        return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
    }
  } catch (err) {
    const message = (err as Error).message ?? 'Error';
    const hint = /image_rewrites/.test(message) ? ' (falta aplicar la migración 0014: tabla image_rewrites)' : '';
    return NextResponse.json({ error: `${message}${hint}` }, { status: 500 });
  }
}
