// Checks a draft's declared format tier (A/B/C/D) against two mechanical
// facts a router call can get wrong without anyone noticing: word count and
// Opinión de Playbook presence/absence. This is the deterministic half of
// Moat Check questions 7 ("¿elegimos correctamente A/B/C?") and 8 ("¿la
// longitud corresponde al valor disponible?") — it cannot judge whether the
// format choice was editorially right, only whether the draft matches the
// tier the router says it is. See .claude/playbook-editorial/moat-check.md.
//
// Usage: npx tsx scripts/check-format-tier.ts <draft.json> [--strict]
// Input: a JSON array where each item carries `bodyMarkdown` (or
// `tier`/`format` set explicitly) and a declared tier field — this script
// looks for `tier` or `format`, either one, case-insensitively, one of
// A/B/C/D. An item with no declared tier is skipped and reported as such,
// never guessed.
//
// This is a mirror, not a gate: it exits 0 by default so a deliberate,
// human-confirmed exception ("2026-08-07: split the Opinión into two
// paragraphs regardless of length") never gets blocked mechanically. Pass
// --strict to exit 1 on any flag.

import { readFileSync } from 'node:fs';

// A: 100-180 (format-tiers.md §1). B: 250-500 (the guide's floor/ceiling;
// the portal's practice runs 300-500, both inside this range). C: 700-1200.
// D is its own flow and never drafted from this pipeline (format-tiers.md
// §4) -- this script has nothing to check for it and skips it.
const RANGES: Record<string, [number, number] | null> = {
  A: [100, 180],
  B: [250, 500],
  C: [700, 1200],
  D: null,
};

// Same lead-in the render pipeline itself matches on (format-tiers.md §6,
// "The Opinión callout is a UI contract") plus La Lana's heading shape,
// which this script never expects to see coming through this pipeline but
// checks defensively anyway.
const OPINION_INLINE = /\*\*Opinión de Playbook:\*\*/;
const OPINION_HEADING = /^##\s+La Opinión de Playbook/m;

function hasOpinion(md: string): boolean {
  return OPINION_INLINE.test(md) || OPINION_HEADING.test(md);
}

// The render only fences the ONE block carrying the literal lead-in
// (format-tiers.md §6) -- a second paragraph written after it renders as
// plain text trailing the green callout, which is the exact 2026-09-13
// regression (format-tiers.md §3b) this checks for mechanically: a plain
// prose block sitting immediately after the Opinión block, with nothing
// structural (a device, a heading, the Fuentes footer) between them.
function hasTrailingParagraphAfterOpinion(md: string): boolean {
  const blocks = md
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);
  const i = blocks.findIndex(b => OPINION_INLINE.test(b));
  if (i === -1 || i === blocks.length - 1) return false;
  const next = blocks[i + 1];
  return !/^(!\[|##\s|Foto: Playbook$|Fuentes:|Ruta del dinero:)/.test(next);
}

function wordCount(md: string): number {
  // Strip device declaration lines, image blocks and headings -- same
  // structural exclusion check-voice.mjs applies -- so a devices-heavy
  // Deep Dive isn't penalized for words that aren't prose.
  const prose = md
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(b => b && !/^(!\[|##\s|Foto: Playbook$|Fuentes:|Ruta del dinero:)/.test(b))
    .join(' ');
  return prose.split(/\s+/).filter(Boolean).length;
}

type Draft = {
  title?: string;
  bodyMarkdown?: string;
  tier?: string;
  format?: string;
};

function analyse(d: Draft) {
  const tier = (d.tier || d.format || '').trim().toUpperCase();
  const md = d.bodyMarkdown || '';
  const words = wordCount(md);
  const opinionPresent = hasOpinion(md);
  const opinionHasTrailing = hasTrailingParagraphAfterOpinion(md);
  return { tier, words, opinionPresent, opinionHasTrailing };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: npx tsx scripts/check-format-tier.ts <draft.json> [--strict]');
    process.exitCode = 2;
    return;
  }
  const strict = process.argv.includes('--strict');
  const drafts = JSON.parse(readFileSync(path, 'utf8')) as Draft[];
  let flagged = 0;

  for (const d of drafts) {
    const { tier, words, opinionPresent, opinionHasTrailing } = analyse(d);
    const flags: string[] = [];

    if (!tier || !(tier in RANGES)) {
      flags.push(`sin tier declarado (o tier "${tier}" no es A/B/C/D) -- no se puede verificar`);
    } else {
      const range = RANGES[tier];
      if (range) {
        const [min, max] = range;
        if (words < min) flags.push(`${words} palabras, bajo el piso de ${tier} (${min}-${max})`);
        if (words > max)
          flags.push(
            `${words} palabras, sobre el techo de ${tier} (${min}-${max}) -- ¿de verdad es un ${tier}, o el router se quedó corto?`,
          );
      }
      const shouldHaveOpinion = tier === 'B' || tier === 'C';
      if (tier === 'A' && opinionPresent) flags.push(`tier A no lleva Opinión de Playbook y esta pieza sí tiene una`);
      if (shouldHaveOpinion && !opinionPresent) flags.push(`tier ${tier} debe llevar Opinión de Playbook y no se encontró`);
      if (tier === 'C' && opinionHasTrailing)
        flags.push(
          `hay un párrafo de prosa justo después de la Opinión de Playbook -- el Deep Dive la lleva en exactamente un párrafo (format-tiers.md §3b, 2026-09-13)`,
        );
    }

    console.log(`\n${flags.length ? '⚑' : '✓'} ${(d.title || '(sin título)').slice(0, 70)} [${tier || '?'}]`);
    console.log(`   ${words} palabras · Opinión ${opinionPresent ? 'sí' : 'no'}${opinionHasTrailing ? ' (+ párrafo trailing)' : ''}`);
    for (const f of flags) console.log(`   ⚑ ${f}`);
    if (flags.length) flagged++;
  }

  console.log(`\n${drafts.length - flagged}/${drafts.length} borradores calzan con su tier declarado.`);
  if (flagged && strict) process.exitCode = 1;
}

if (require.main === module) main();
