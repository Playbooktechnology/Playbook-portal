import { createHash } from 'node:crypto';
import { TransactionRollbackError, and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { put } from '@vercel/blob';
import { articles, imageRewrites, siteContent } from '../db/schema';

// Moves images served from other people's domains into Playbook's own
// storage (Vercel Blob, the store the TipTap uploads already use) and
// rewrites the URLs in place: an article's cover (`image_url`, which is also
// its og:image), the <img> tags in its body (`body_html` AND `body_json`, or
// the next editor save would regenerate the old URL), and site_content.
//
// Rules:
//   • Credits are never touched (`image_credit`, figcaptions): only URLs.
//   • Every rewrite is logged in `image_rewrites` BEFORE it is applied, so
//     revertBatch() can put each original URL back exactly where it was.
//   • An image that can't be downloaded (hotlink protection, 404, not an
//     image, too big) keeps its original URL and is reported, never guessed.
//   • playbook-portal-phi.vercel.app/assets/… are our own files on the old
//     deployment host: they already live in public/assets, so they are
//     rewritten to https://www.playbook.la/assets/… with no download.
//   • Updates are conditional on the row's updated_at, so an editor's save
//     that lands mid-run is never overwritten; that article is retried later.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, any>;

export const OWN_ORIGIN = 'https://www.playbook.la';
const OLD_DEPLOYMENT_HOST = 'playbook-portal-phi.vercel.app';
const MAX_BYTES = 15 * 1024 * 1024;
// YouTube thumbnails belong to the embeds they illustrate (the video
// section's CMS clips) and change with them; copying them would freeze a
// stale frame. Left as they are.
const SKIP_HOSTS = new Set(['i.ytimg.com']);

export type Scope = 'cover' | 'body' | 'cms';
export type RewriteItem = {
  articleId: string | null;
  location: string;
  oldUrl: string;
  newUrl?: string;
  error?: string;
};
export type RunReport = {
  batchId: string;
  dryRun: boolean;
  articlesScanned: number;
  articlesChanged: number;
  remaining: number;
  items: RewriteItem[];
};

export function imageHostKind(url: string): 'own' | 'old-deployment' | 'external' | 'skip' {
  if (!/^https?:\/\//i.test(url)) return 'own'; // relative: served by us
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return 'skip';
  }
  if (/^(www\.)?playbook\.la$/.test(host) || host.endsWith('.public.blob.vercel-storage.com')) return 'own';
  if (host === OLD_DEPLOYMENT_HOST) return 'old-deployment';
  if (SKIP_HOSTS.has(host)) return 'skip';
  return 'external';
}

function decodeAttr(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function bodyImageUrls(bodyHtml: string | null): string[] {
  const urls = new Set<string>();
  for (const m of (bodyHtml ?? '').matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/gi)) urls.add(decodeAttr(m[1]));
  return [...urls];
}

function extensionFor(contentType: string, url: string): string {
  const fromType = contentType.match(/^image\/(jpeg|jpg|png|webp|gif|avif|svg\+xml)/i)?.[1]?.toLowerCase();
  if (fromType) return fromType === 'jpeg' ? 'jpg' : fromType === 'svg+xml' ? 'svg' : fromType;
  return url.match(/\.(jpe?g|png|webp|gif|avif)(?:[?#]|$)/i)?.[1]?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
}

// Deterministic key: the same source URL always lands on the same blob
// path, so a retried run re-uploads in place instead of piling up copies.
function blobPath(folder: string, url: string, ext: string): string {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  return `${folder}/${hash}.${ext}`;
}

/** Copies one image into Blob (or maps an old-deployment asset) and
    returns its new URL. Throws a short Spanish reason on failure. */
export async function copyImage(url: string, folder: string): Promise<string> {
  if (imageHostKind(url) === 'old-deployment') {
    const { pathname, search } = new URL(url);
    return `${OWN_ORIGIN}${pathname}${search}`;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Falta BLOB_READ_WRITE_TOKEN en este entorno');
  let res: Response;
  try {
    res = await fetch(url, {
      // Several hosts (fcbarcelona.com, some CDNs) refuse requests without a
      // browser UA or with a foreign Referer — see the 2026-10-27 note in
      // .claude/playbook-editorial/images.md.
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        Referer: `${OWN_ORIGIN}/`,
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    throw new Error(`No se pudo descargar (${(err as Error).name === 'TimeoutError' ? 'tiempo agotado' : 'red'})`);
  }
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType && !/^image\//i.test(contentType) && !/octet-stream/i.test(contentType)) {
    throw new Error(`No es una imagen (${contentType.split(';')[0]})`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length === 0) throw new Error('Archivo vacío');
  if (bytes.length > MAX_BYTES) throw new Error('Pesa más de 15 MB');
  const ext = extensionFor(contentType, url);
  const blob = await put(blobPath(folder, url, ext), bytes, {
    access: 'public',
    addRandomSuffix: false,
    contentType: /^image\//i.test(contentType) ? contentType.split(';')[0] : `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });
  return blob.url;
}

function replaceAllUrls(text: string, map: Map<string, string>): string {
  let out = text;
  for (const [from, to] of map) {
    out = out.split(from).join(to);
    const escFrom = escapeAttr(from);
    if (escFrom !== from) out = out.split(escFrom).join(escapeAttr(to));
  }
  return out;
}

function articleNeedsWork(a: { imageUrl: string; bodyHtml: string | null }, scope: Scope[]): boolean {
  const covers = scope.includes('cover') && ['external', 'old-deployment'].includes(imageHostKind(a.imageUrl));
  const bodies =
    scope.includes('body') &&
    bodyImageUrls(a.bodyHtml).some(u => ['external', 'old-deployment'].includes(imageHostKind(u)));
  return covers || bodies;
}

type ArticleRow = typeof articles.$inferSelect;

// updated_at carries microseconds a JS Date can't hold, so compare at
// millisecond precision — same reason as lib/actions/admin.ts's
// sameMillisecond.
function sameMillisecond(expected: Date) {
  return sql`date_trunc('milliseconds', ${articles.updatedAt}) = date_trunc('milliseconds', ${expected.toISOString()}::timestamptz)`;
}

async function processArticle(
  db: Db,
  a: ArticleRow,
  scope: Scope[],
  batchId: string,
  dryRun: boolean,
): Promise<RewriteItem[]> {
  const wanted: { location: 'cover' | 'body'; url: string }[] = [];
  if (scope.includes('cover') && ['external', 'old-deployment'].includes(imageHostKind(a.imageUrl))) {
    wanted.push({ location: 'cover', url: a.imageUrl });
  }
  if (scope.includes('body')) {
    for (const url of bodyImageUrls(a.bodyHtml)) {
      if (['external', 'old-deployment'].includes(imageHostKind(url))) wanted.push({ location: 'body', url });
    }
  }
  const items: RewriteItem[] = [];
  const done = new Map<string, string>();
  for (const w of wanted) {
    const item: RewriteItem = { articleId: a.id, location: w.location, oldUrl: w.url };
    items.push(item);
    if (dryRun) continue;
    try {
      item.newUrl = done.get(w.url) ?? (await copyImage(w.url, `articulos/${a.id}`));
      done.set(w.url, item.newUrl);
    } catch (err) {
      item.error = (err as Error).message;
    }
  }
  if (dryRun || done.size === 0) return items;

  const imageUrl = done.get(a.imageUrl) ?? a.imageUrl;
  const bodyHtml = a.bodyHtml == null ? null : replaceAllUrls(a.bodyHtml, done);
  const bodyJson = a.bodyJson == null ? null : JSON.parse(replaceAllUrls(JSON.stringify(a.bodyJson), done));

  // Log first, then apply, in one transaction: a rewrite without its undo
  // record can't happen, and a failed update leaves no orphan log rows.
  const applied = await db.transaction(async tx => {
    await tx.insert(imageRewrites).values(
      items
        .filter(i => i.newUrl)
        .map(i => ({ batchId, articleId: a.id, location: i.location, oldUrl: i.oldUrl, newUrl: i.newUrl! })),
    );
    const updated = await tx
      .update(articles)
      .set({ imageUrl, bodyHtml, bodyJson })
      .where(and(eq(articles.id, a.id), sameMillisecond(a.updatedAt)))
      .returning({ id: articles.id });
    if (!updated.length) {
      tx.rollback();
    }
    return true;
  }).catch(err => {
    if (err instanceof TransactionRollbackError) return false;
    throw err;
  });
  if (!applied) {
    for (const i of items) if (i.newUrl) i.error = 'La nota cambió durante la migración; se reintenta en la siguiente corrida';
    for (const i of items) if (i.error) delete i.newUrl;
  }
  return items;
}

/** One batch over the articles (and site_content when scope has 'cms').
    `limit` bounds how many articles get images copied per call, so a run
    stays inside a serverless time limit; call again until remaining is 0. */
export async function runImageMigration(
  db: Db,
  opts: { scope: Scope[]; limit?: number; dryRun?: boolean; batchId?: string; sinceDate?: string; articleId?: string },
): Promise<RunReport> {
  const dryRun = !!opts.dryRun;
  const batchId = opts.batchId ?? `lote-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const limit = opts.limit ?? 20;

  // A run only proceeds when its undo log is writable. Probing the table
  // up front turns "migration 0014 not applied yet" into a clear error
  // instead of copies with nowhere to record them.
  if (!dryRun) await db.select({ id: imageRewrites.id }).from(imageRewrites).limit(1);

  const conditions = [];
  if (opts.articleId) conditions.push(eq(articles.id, opts.articleId));
  if (opts.sinceDate) conditions.push(gte(articles.date, opts.sinceDate));
  const rows = await db
    .select()
    .from(articles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(articles.date));
  const pending = rows.filter(a => articleNeedsWork(a, opts.scope));

  const report: RunReport = { batchId, dryRun, articlesScanned: rows.length, articlesChanged: 0, remaining: 0, items: [] };
  const slice = dryRun ? pending : pending.slice(0, limit);
  for (const a of slice) {
    const items = await processArticle(db, a, opts.scope, batchId, dryRun);
    if (items.some(i => i.newUrl)) report.articlesChanged++;
    report.items.push(...items);
  }
  report.remaining = dryRun ? pending.length : Math.max(0, pending.length - slice.length);

  if (opts.scope.includes('cms') && !opts.articleId) {
    report.items.push(...(await processSiteContent(db, batchId, dryRun)));
  }
  return report;
}

// site_content is one JSON document; image URLs sit at known-ish paths
// (about image, Infinitas cards, product cards…). Any string value that is
// an http(s) URL under an image-ish key, or ends in an image extension,
// counts.
function collectCmsImages(node: unknown, path: string, out: { path: string; url: string }[]) {
  if (typeof node === 'string') {
    const looksImage = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(node) || /image|img|photo|logo|thumb/i.test(path);
    if (looksImage && /^https?:\/\//i.test(node) && ['external', 'old-deployment'].includes(imageHostKind(node))) {
      out.push({ path, url: node });
    }
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => collectCmsImages(v, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) collectCmsImages(v, path ? `${path}.${k}` : k, out);
  }
}

async function processSiteContent(db: Db, batchId: string, dryRun: boolean): Promise<RewriteItem[]> {
  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  if (!row) return [];
  const found: { path: string; url: string }[] = [];
  collectCmsImages(row.data, '', found);
  const items: RewriteItem[] = found.map(f => ({ articleId: null, location: `site_content:${f.path}`, oldUrl: f.url }));
  if (dryRun || !items.length) return items;

  const done = new Map<string, string>();
  for (const item of items) {
    try {
      item.newUrl = done.get(item.oldUrl) ?? (await copyImage(item.oldUrl, 'sitio'));
      done.set(item.oldUrl, item.newUrl);
    } catch (err) {
      item.error = (err as Error).message;
    }
  }
  if (!done.size) return items;
  const data = JSON.parse(replaceAllUrls(JSON.stringify(row.data), done));
  await db.transaction(async tx => {
    await tx.insert(imageRewrites).values(
      items
        .filter(i => i.newUrl)
        .map(i => ({ batchId, articleId: null, location: i.location, oldUrl: i.oldUrl, newUrl: i.newUrl! })),
    );
    // Same optimistic version bump the CMS save uses (lib/actions/admin.ts),
    // so an editor holding the old version gets the usual conflict prompt.
    const updated = await tx
      .update(siteContent)
      .set({ data, version: sql`${siteContent.version} + 1`, updatedAt: new Date() })
      .where(and(eq(siteContent.id, 1), eq(siteContent.version, row.version)))
      .returning({ id: siteContent.id });
    if (!updated.length) tx.rollback();
  }).catch(err => {
    if (!(err instanceof TransactionRollbackError)) throw err;
    for (const i of items) if (i.newUrl) {
      i.error = 'El contenido del sitio cambió durante la migración; vuelve a correrla';
      delete i.newUrl;
    }
  });
  return items;
}

/** Puts every original URL of a batch back. Rows are matched by URL, so a
    batch reverts cleanly even if other batches ran after it. */
export async function revertImageBatch(db: Db, batchId: string): Promise<{ reverted: number; articles: number }> {
  const rows = await db
    .select()
    .from(imageRewrites)
    .where(and(eq(imageRewrites.batchId, batchId), isNull(imageRewrites.revertedAt)));
  const byArticle = new Map<string, Map<string, string>>();
  const cms = new Map<string, string>();
  for (const r of rows) {
    if (r.articleId) {
      if (!byArticle.has(r.articleId)) byArticle.set(r.articleId, new Map());
      byArticle.get(r.articleId)!.set(r.newUrl, r.oldUrl);
    } else {
      cms.set(r.newUrl, r.oldUrl);
    }
  }
  for (const [id, map] of byArticle) {
    const [a] = await db.select().from(articles).where(eq(articles.id, id));
    if (!a) continue;
    await db
      .update(articles)
      .set({
        imageUrl: map.get(a.imageUrl) ?? a.imageUrl,
        bodyHtml: a.bodyHtml == null ? null : replaceAllUrls(a.bodyHtml, map),
        bodyJson: a.bodyJson == null ? null : JSON.parse(replaceAllUrls(JSON.stringify(a.bodyJson), map)),
      })
      .where(eq(articles.id, id));
  }
  if (cms.size) {
    const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
    if (row) {
      await db
        .update(siteContent)
        .set({
          data: JSON.parse(replaceAllUrls(JSON.stringify(row.data), cms)),
          version: sql`${siteContent.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(siteContent.id, 1));
    }
  }
  await db
    .update(imageRewrites)
    .set({ revertedAt: new Date() })
    .where(and(eq(imageRewrites.batchId, batchId), isNull(imageRewrites.revertedAt)));
  return { reverted: rows.length, articles: byArticle.size };
}

export async function listImageBatches(db: Db) {
  return db
    .select({
      batchId: imageRewrites.batchId,
      count: sql<number>`count(*)::int`,
      reverted: sql<number>`count(${imageRewrites.revertedAt})::int`,
      createdAt: sql<string>`min(${imageRewrites.createdAt})::text`,
    })
    .from(imageRewrites)
    .groupBy(imageRewrites.batchId)
    .orderBy(desc(sql`min(${imageRewrites.createdAt})`));
}

/** Fire-and-forget hook for newly published articles (admin create/save,
    the Make.com webhook, the daily cron). Never throws. */
export async function localizeArticleImages(db: Db, articleId: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    await runImageMigration(db, { scope: ['cover', 'body'], articleId, batchId: `auto-${day}`, limit: 1 });
  } catch (err) {
    console.error(`[images] could not localize images for ${articleId}:`, err);
  }
}
