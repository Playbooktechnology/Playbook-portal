// Inventario de imágenes servidas fuera de playbook.la (A8). SOLO LEE: no
// descarga, no mueve, no cambia nada. Lista cada imagen por host con la nota
// donde aparece y su crédito, para decidir qué se sube a almacenamiento propio.
//
//   POSTGRES_URL=… npx tsx scripts/inventory-external-images.ts > inventario.md
//   npx tsx scripts/inventory-external-images.ts --snapshot   # sin base: usa lib/data/articles-snapshot.json
//
// "Propio" = rutas relativas (/assets/…), playbook.la y el Blob de Vercel del
// proyecto (*.public.blob.vercel-storage.com). Todo lo demás es externo,
// incluido playbook-portal-phi.vercel.app: es el dominio de deploy del mismo
// proyecto, pero si ese alias cambia o se borra, las imágenes se rompen.
import { readFileSync } from 'node:fs';

type Row = { id: string; title: string; imageUrl: string; imageCredit: string | null; bodyHtml: string | null };

const OWN = (host: string) =>
  host === 'playbook.la' || host === 'www.playbook.la' || host.endsWith('.public.blob.vercel-storage.com');

async function load(): Promise<{ rows: Row[]; siteContent: unknown; source: string }> {
  if (process.argv.includes('--snapshot')) {
    const rows = JSON.parse(readFileSync('lib/data/articles-snapshot.json', 'utf8')) as Row[];
    const sc = JSON.parse(readFileSync('scripts/data/site-content-bridge-2026-10-22.json', 'utf8'));
    return { rows, siteContent: sc.data ?? sc, source: 'snapshot del repo (lib/data/articles-snapshot.json, hasta el 22 oct 2026)' };
  }
  const { db } = await import('../lib/db/client');
  const { articles, siteContent } = await import('../lib/db/schema');
  const rows = await db
    .select({ id: articles.id, title: articles.title, imageUrl: articles.imageUrl, imageCredit: articles.imageCredit, bodyHtml: articles.bodyHtml })
    .from(articles);
  const [sc] = await db.select({ data: siteContent.data }).from(siteContent);
  return { rows, siteContent: sc?.data ?? {}, source: 'base de producción' };
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null; // relative path: served by playbook.la
  }
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => collectStrings(v, out));
  return out;
}

async function main() {
  const { rows, siteContent, source } = await load();
  const byHost = new Map<string, { where: string; url: string; credit: string }[]>();
  const add = (url: string, where: string, credit: string) => {
    const host = hostOf(url);
    if (!host || OWN(host)) return;
    byHost.set(host, [...(byHost.get(host) ?? []), { where, url, credit }]);
  };
  for (const r of rows) {
    if (r.imageUrl) add(r.imageUrl, `portada · ${r.id}`, r.imageCredit ?? '');
    for (const m of (r.bodyHtml ?? '').matchAll(/<img[^>]+src="([^"]+)"/g)) add(m[1], `cuerpo · ${r.id}`, '');
  }
  for (const s of collectStrings(siteContent)) {
    if (/^https?:\/\/.+\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(s) || /substack-post-media|upload\.wikimedia/.test(s)) {
      add(s, 'CMS (site_content)', '');
    }
  }
  const hosts = [...byHost.entries()].sort((a, b) => b[1].length - a[1].length);
  const total = hosts.reduce((n, [, l]) => n + l.length, 0);
  console.log(`# Inventario de imágenes externas\n\nFuente: ${source}. ${total} imágenes en ${hosts.length} hosts.\n`);
  console.log('| Host | Imágenes |\n|---|---|');
  for (const [h, l] of hosts) console.log(`| ${h} | ${l.length} |`);
  for (const [h, l] of hosts) {
    console.log(`\n## ${h} (${l.length})\n`);
    for (const x of l) console.log(`- ${x.where}${x.credit ? ` — crédito: ${x.credit}` : ' — sin crédito registrado'}\n  ${x.url}`);
  }
}

main().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  },
);
