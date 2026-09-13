// Deterministic check: does a draft's word count sit inside its declared
// tier's range? This is the one piece of Moat Playbook (docs/EDITORIAL_SYSTEM.md)
// that is genuinely mechanical — everything else in the Moat Check is editorial
// judgment, validated by the ten narrative cases in tests/moat-playbook/, not by
// an assert. Word count is not: check-voice.mjs's paragraph-rhythm numbers stay
// a sanity check on purpose (voice-and-style.md §2), but a tier range is a hard
// contract stated in format-tiers.md §1's own table, so this one DOES exit 1.
//
// Ranges, from format-tiers.md §1 (A/B/C) — D (La Lana) has no fixed range,
// "own flow", and is deliberately excluded here.
//
// Usage:
//   node tests/moat-playbook/check-tier-length.mjs <draft.json> <A|B|C>
// Input: an ArticleInput-shaped JSON object or array (same shape
// scripts/publish-newsletter.ts and scripts/check-voice.mjs take). When the
// input is an array, every item must declare its own `tier`.

import { readFileSync } from 'node:fs';

export const TIER_RANGES = {
  A: { min: 100, max: 180 },
  B: { min: 250, max: 500 },
  C: { min: 700, max: 1200 },
};

export function countWords(markdown) {
  if (!markdown) return 0;
  const stripped = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/[*_#>`]/g, ' ') // markdown chrome
    .replace(/^Fuentes:.*$/m, ' '); // credit line is excluded, format-tiers.md §6
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function checkTierLength(tier, wordCount) {
  const range = TIER_RANGES[tier];
  if (!range) {
    return { ok: false, reason: `unknown tier "${tier}" — only A/B/C have a fixed range (D is "own flow")` };
  }
  if (wordCount < range.min) {
    return { ok: false, reason: `${wordCount} words is below ${tier}'s floor of ${range.min}` };
  }
  if (wordCount > range.max) {
    return { ok: false, reason: `${wordCount} words is above ${tier}'s ceiling of ${range.max}` };
  }
  return { ok: true, reason: `${wordCount} words is inside ${tier}'s ${range.min}-${range.max} range` };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node tests/moat-playbook/check-tier-length.mjs <draft.json> [A|B|C]');
    process.exit(2);
  }
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const items = Array.isArray(raw) ? raw : [raw];
  const overrideTier = process.argv[3];

  let failures = 0;
  for (const item of items) {
    const tier = overrideTier || item.tier;
    const words = countWords(item.bodyMarkdown ?? '');
    const result = checkTierLength(tier, words);
    const label = item.title ?? '(untitled)';
    console.log(`${result.ok ? 'OK  ' : 'FAIL'} [${tier ?? '?'}] ${label} — ${result.reason}`);
    if (!result.ok) failures++;
  }

  if (failures > 0) {
    console.error(`\n${failures} of ${items.length} item(s) outside their declared tier's range.`);
    process.exit(1);
  }
  console.log(`\nAll ${items.length} item(s) inside range.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
