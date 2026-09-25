// Auth + query helper for the Google Analytics Data API (GA4), used by
// lib/most-read.ts to power the homepage "Más leídas" module with real
// pageview data — never hardcoded. Near-literal port of legacy/lib/ga4.js:
// signs its own service-account JWT with Node's built-in crypto instead of
// pulling in the googleapis package, same approach as this repo's other
// hand-rolled HMAC/JWT code (see auth.ts's Credentials provider).
//
// This is a SEPARATE credential from a client-side GA4 Measurement ID (the
// new app has no client-side GA4 tag at all yet — out of scope here, same
// as legacy's js/analytics.js). Reading aggregate data back *out* (what
// this file does) needs a Google Cloud service account with "Viewer"
// access on the GA4 property, plus that property's numeric ID:
//   GA4_PROPERTY_ID                  e.g. "123456789" (Admin → Property Settings)
//   GA4_SERVICE_ACCOUNT_EMAIL        the service account's client_email
//   GA4_SERVICE_ACCOUNT_PRIVATE_KEY  its private_key (from the downloaded
//                                    JSON key; paste with literal \n line
//                                    breaks into the env var value)
// The service account also needs to be added as a Viewer on the GA4
// property itself (Admin → Property Access Management), not just have the
// Analytics Data API enabled on its Google Cloud project.

import crypto from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

// legacy filtered on '/articulo.html' (its URL scheme); this app's article
// route is '/articulo' (no extension — next.config.ts permanently redirects
// the old .html URLs here), so GA4 pageviews recorded after the cutover use
// this path instead.
const ARTICLE_PATH_FRAGMENT = '/articulo';

// The slug out of a GA4 `pagePath`, in EITHER URL shape.
//
// This used to be a single `/[?&]id=([^&]+)/` match against the raw path,
// which silently stopped matching anything on 2026-09-02: that is the day
// article URLs moved from `/articulo?id=<slug>` to `/articulo/<slug>`
// (lib/article-url.ts). Every GA4 row recorded since then is the path form,
// so the regex found no `id=`, every row was filtered out, and
// topArticleIds() returned [] — which lib/most-read.ts reads as "configured
// but no data" and quietly falls through. The homepage module has therefore
// shown nothing from GA4 since the migration, with no error anywhere.
//
// Both shapes are parsed because GA4's 7-day window can still straddle old
// rows, and because middleware.ts keeps 301-ing the legacy URL permanently.
export function articleIdFromPagePath(pagePath: string): string | null {
  const [path, query = ''] = pagePath.split('?');
  const bySegment = path.match(/\/articulo\/([^/#]+)/);
  if (bySegment) return safeDecode(bySegment[1]);
  const byQuery = query.match(/(?:^|&)id=([^&#]+)/);
  if (byQuery) return safeDecode(byQuery[1]);
  return null;
}

// A malformed percent-escape in a crawled URL throws on decodeURIComponent
// and would take the whole module down with it; the raw value is still a
// usable key, it just won't match an article id, which is the same outcome
// as dropping the row.
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isConfigured() {
  return !!(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_EMAIL && process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY);
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: process.env.GA4_SERVICE_ACCOUNT_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const privateKey = (process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY as string).replace(/\\n/g, '\n');
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKey);
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`No se pudo obtener el token de GA4 (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

export type Ga4Row = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };

// Shared runReport call -- both this file's topArticleIds() (below) and
// lib/ga4-analytics.ts's KPI/breakdown queries (admin analytics panel) go
// through this, so the JWT signing + token exchange above happens the same
// way everywhere. `revalidateSeconds` opts into Next's per-fetch data cache
// (used by the homepage's "Más leídas" module, which reads under a
// force-dynamic layout and would otherwise hit the GA4 Data API on every
// request); omitted, the call is never cached -- what the admin panel's
// "Actualizar" button needs.
export async function runReport(
  body: Record<string, unknown>,
  { revalidateSeconds }: { revalidateSeconds?: number } = {}
): Promise<Ga4Row[]> {
  if (!isConfigured()) return [];

  const accessToken = await getAccessToken();
  const propertyId = process.env.GA4_PROPERTY_ID;

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...(revalidateSeconds ? { next: { revalidate: revalidateSeconds } } : { cache: 'no-store' as const }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`GA4 Data API respondió ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  return data.rows || [];
}

// Returns [{ id, pageviews }] for the top /articulo ids by pageviews over
// the last `days` days, or null when GA4 isn't configured yet — null is the
// "not set up" signal, distinct from an empty array (configured, genuinely
// no data), so callers (lib/most-read.ts) can tell the two apart.
export async function topArticleIds({ days = 7, limit = 10 }: { days?: number; limit?: number } = {}) {
  if (!isConfigured()) return null;

  // One article shows up under several pagePaths (trailing slash, utm_*
  // query strings, and both URL shapes across the 2026-09-02 migration), so
  // ask for more rows than we need and fold them together below — asking for
  // exactly `limit` rows would let one article's views split across variants
  // and rank below an article with fewer real readers.
  const rowLimit = Math.max(limit * 5, 50);

  // 30-minute freshness window via Next's per-fetch data cache — replaces
  // legacy's Cache-Control: max-age=1800 on its now-gone /api/top-articles
  // route, so the homepage (force-dynamic) doesn't hit the GA4 Data API on
  // every single request.
  const rows = await runReport(
    {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: ARTICLE_PATH_FRAGMENT } },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: rowLimit,
    },
    { revalidateSeconds: 3600 }
  );

  const byId = new Map<string, number>();
  for (const row of rows) {
    const id = articleIdFromPagePath(row.dimensionValues[0].value || '');
    if (!id) continue;
    byId.set(id, (byId.get(id) ?? 0) + (Number(row.metricValues[0].value) || 0));
  }

  return [...byId.entries()]
    .map(([id, pageviews]) => ({ id, pageviews }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, limit);
}
