// Finds where the article-body newsletter CTA (components/article/
// ArticleNewsletterCta.tsx) can slot in right before the "Opinión de
// Playbook" callout. lib/product-hubs.ts's markOpinionCallout (and
// markCollabNote, for a guest-collaboration note) both wrap their text in
// `<aside class="shot-opinion">`, and by the B/C architecture
// (format-tiers.md §1) the Opinión is always the LAST block of the body
// when present — a collab note, when one also exists, sits earlier as
// context, not as the closer. Taking the LAST top-level <aside> rather
// than the first is what keeps this correct on a piece that carries both.
//
// Returns null when the body has no aside at all — a Tier A brief carries
// no Opinión by design (format-tiers.md §1), and a non-hub source never
// runs markOpinionCallout in the first place — so the caller can fall back
// to placing the CTA at the foot of the body instead of skipping it.
export function splitBeforeAside(html: string): [string, string] | null {
  const idx = html.lastIndexOf('<aside');
  if (idx <= 0) return null;
  return [html.slice(0, idx), html.slice(idx)];
}
