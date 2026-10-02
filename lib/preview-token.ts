// Private preview links for UNLISTED articles (2026-10-02).
//
// Since 2026-09-02 an unlisted article (`articles.listed = false`) is
// editor-only: anyone without an editor session gets a 404. That is the
// right default — it is how a not-yet-public partnership piece stays
// unpublished — but it left no way to show a draft to the people outside
// Playbook who have a stake in it (the publisher's ask: "un link para
// mostrarle este preview a los de la LFA, pero que no sea público"). Editor
// accounts are the wrong tool for that: they can publish.
//
// So: a per-article token, `?preview=<token>`, that opens THAT article and
// nothing else. It is an HMAC of the article id under AUTH_SECRET, which
// makes it
//   • unguessable without the server's secret,
//   • scoped — a leaked link exposes one article, never the rest,
//   • stateless — no schema change, nothing stored, nothing to clean up,
//   • moot once the article is listed (the gate below it no longer runs).
// Revocation is coarse by design: rotating AUTH_SECRET kills every preview
// link at once (and every session with it). If per-link revocation is ever
// needed, that is a stored-token design and a migration, not this file.
//
// The page still answers `robots: noindex` for an unlisted article
// regardless of how it was opened (generateMetadata reads `listed`, never
// the token), and unlisted rows stay out of every listing, the sitemap and
// search — a preview link grants reading, not discoverability.
import { createHmac, timingSafeEqual } from 'node:crypto';

// Versioned so the derivation can change later without colliding with
// tokens minted under this one.
const SCOPE = 'article-preview:v1:';

/** The preview token for an article id, or null when the server has no secret. */
export function previewTokenFor(articleId: string): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(SCOPE + articleId).digest('base64url').slice(0, 32);
}

/** Constant-time check of a `?preview=` value against the article's token. */
export function isValidPreviewToken(articleId: string, token: unknown): boolean {
  if (typeof token !== 'string' || token.length === 0) return false;
  const expected = previewTokenFor(articleId);
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
