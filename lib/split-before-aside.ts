import { splitAfterParagraph } from './split-after-paragraph';

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
// runs markOpinionCallout in the first place — so the caller falls back to
// splitAtMidpoint below instead of skipping the CTA.
export function splitBeforeAside(html: string): [string, string] | null {
  const idx = html.lastIndexOf('<aside');
  if (idx <= 0) return null;
  return [html.slice(0, idx), html.slice(idx)];
}

const TRACKED = ['blockquote', 'ul', 'ol', 'li', 'aside'] as const;

function countTopLevelParagraphs(html: string): number {
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let depth = 0;
  let total = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const isClosing = match[0].startsWith('</');
    const name = match[1].toLowerCase();
    if ((TRACKED as readonly string[]).includes(name)) {
      depth += isClosing ? -1 : 1;
      if (depth < 0) depth = 0;
    } else if (isClosing && name === 'p' && depth === 0) {
      total += 1;
    }
  }
  return total;
}

// Fallback for a body with no Opinión at all (Aldo Sales bylines and other
// TFBR-style exceptions, format-tiers.md's "carries no Opinión de Playbook
// box" rule) — splitting at the halfway point of the remaining paragraphs
// instead of appending after the very last one. Team feedback 2026-09-22:
// stranding the CTA after the final paragraph put it somewhere almost
// nobody scrolls to on these longer, opinion-driven pieces.
//
// Returns null on a body too short to bother splitting (under 2 top-level
// paragraphs) — the caller's existing "append at the end" fallback is just
// as good when there's nowhere meaningfully earlier to put it.
export function splitAtMidpoint(html: string): [string, string] | null {
  const total = countTopLevelParagraphs(html);
  if (total < 2) return null;
  return splitAfterParagraph(html, Math.ceil(total / 2));
}
