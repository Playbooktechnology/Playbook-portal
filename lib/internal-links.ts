// Links that must stay on playbook.la (A8, 2026-10-27). Several homepage
// surfaces are CMS-edited and were still pointing readers to Substack —
// Infinitas to soninfinitas.substack.com, the opinion cards and TFBR to
// playbookmedia.substack.com — when the same content lives on the site.
// These helpers turn those URLs into the site's own pages at render time, so
// the fix holds no matter what is pasted in the CMS later.

export const INFINITAS_PATH = '/infinitas';
export const TFBR_PATH = '/futbol-business-review';

function isSubstack(host: string) {
  return host === 'substack.com' || host.endsWith('.substack.com');
}

function normalize(url: string) {
  return url.trim().replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
}

/**
 * The playbook.la page for a Substack URL:
 *   soninfinitas.substack.com/…                 → /infinitas
 *   a post we also publish (articles.substack_url) → /articulo/<id>
 *   anything about The Futbol Business Review   → /futbol-business-review
 *   any other Playbook Substack URL             → `fallback`
 * Non-Substack URLs come back unchanged.
 */
export function internalize(
  url: string,
  articles: { id: string; substackUrl: string }[],
  { hint = '', fallback = '/archivo' }: { hint?: string; fallback?: string } = {},
): string {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return url;
  }
  if (!isSubstack(host)) return url;
  if (host.startsWith('soninfinitas')) return INFINITAS_PATH;
  const target = normalize(url);
  const match = articles.find(a => a.substackUrl && normalize(a.substackUrl) === target);
  if (match) return `/articulo/${match.id}`;
  if (/futbol business review|tfbr/i.test(hint)) return TFBR_PATH;
  return fallback;
}

/** target/rel for an <a>: new tab only for a link that actually leaves the site. */
export function linkTarget(url: string) {
  return /^https?:/i.test(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}
