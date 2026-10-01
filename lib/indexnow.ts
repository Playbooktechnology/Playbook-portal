// Notifies Bing/Yandex via the IndexNow protocol (https://www.indexnow.org)
// the moment a URL is published, instead of waiting for their next scheduled
// crawl. Google does not participate in IndexNow -- there is no equivalent
// low-risk push API for Google specifically (its Indexing API is documented
// as JobPosting/BroadcastEvent only; using it for articles risks the Search
// Console account). This covers what CAN be automated safely; Google still
// relies on a fresh sitemap (app/sitemap.ts) and normal crawl discovery.
//
// Requires INDEXNOW_KEY (any hex string) set in Vercel, with a matching
// verification file at public/<INDEXNOW_KEY>.txt containing just the key --
// see docs/ENCYCLOPEDIA.md's env var table. A missing key or a failed
// request are both non-fatal: this must never block a publish.

import { SITE_URL } from './site-url';

const ENDPOINT = 'https://api.indexnow.org/indexnow';

export async function submitToIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !urls.length) return;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: urls,
      }),
    });
    if (!res.ok) {
      console.warn(`[indexnow] respondió ${res.status} para ${urls.join(', ')}`);
    }
  } catch (err) {
    console.warn('[indexnow] fallo de red, no bloquea la publicación:', err);
  }
}
