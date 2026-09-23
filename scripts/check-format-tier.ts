// Checks a draft's declared format tier (A/B/C/D) against two mechanical
// facts a router call can get wrong without anyone noticing: word count and
// Opinión de Playbook presence/absence. This is the deterministic half of
// Moat Check questions 7 ("¿elegimos correctamente A/B/C?") and 8 ("¿la
// longitud corresponde al valor disponible?") — it cannot judge whether the
// format choice was editorially right, only whether the draft matches the
// tier the router says it is. See .claude/playbook-editorial/moat-check.md.
//
// Usage: npx tsx scripts/check-format-tier.ts <draft.json>
// Input: a JSON array where each item carries `bodyMarkdown` and a declared
// `tier` (or `format`) field, case-insensitively, one of A/B/C/D. An item
// with no declared tier is skipped and reported as such, never guessed.
//
// SEVERITY (2026-09-13, added after a real gap was caught: this file existed
// but nothing ever called it -- a draft could carry any of these mismatches
// and publish untouched). Two levels, not one flat mirror:
//
// - STRUCTURAL findings are always `severe`: an A carrying an Opinión, a B/C
//   missing one, or a Deep Dive's Opinión with a trailing paragraph after it
//   (the exact 2026-09-13 CBF/Copa do Brasil regression). These are binary
//   -- either the shape is right or it isn't -- so there is no "marginal"
//   version of getting them wrong.
// - WORD COUNT findings are `severe` only past a 30% buffer outside the
//   tier's range (i.e. below 0.7x the floor, or above 1.3x the ceiling);
//   inside that buffer they are `marginal`. A B at 240 words against a
//   250-word floor is marginal -- close enough that "never take away
//   length, only add" (voice-and-style.md §2) plausibly explains it. A B at
//   156 words is severe -- that is not a rounding gap, it is a tier with no
//   real content behind it.
//
// `severe` findings BLOCK the publish in scripts/publish-newsletter.ts
// (see checkFormatTiers there), the same way an overlap block does --
// override with --allow-tier-mismatch only after a human has looked.
// `marginal` findings print as warnings and never block, same as
// check-voice.mjs's default mode. An item with no declared `tier` is not
// checked (skipped, not scored) -- this field is new and optional, so an
// older draft that never sets it publishes exactly as before, unblocked.

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

// How far outside [min, max] is still "close enough to be a rounding gap,
// not a substance problem". 0.3 means severe kicks in below 70% of the
// floor or above 130% of the ceiling.
const SEVERE_BUFFER = 0.3;

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

export type Draft = {
  title?: string;
  bodyMarkdown?: string;
  tier?: string;
  format?: string;
};

export type Severity = 'severe' | 'marginal';
export type Finding = { severity: Severity; message: string };

export type TierReport = {
  tier: string; // '' if undeclared/unrecognized
  words: number;
  opinionPresent: boolean;
  opinionHasTrailing: boolean;
  findings: Finding[];
};

/** Pure, DB-free analysis -- reused by the CLI below and by
 * scripts/publish-newsletter.ts's real blocking gate. */
export function analyseTier(d: Draft): TierReport {
  const tier = (d.tier || d.format || '').trim().toUpperCase();
  const md = d.bodyMarkdown || '';
  const words = wordCount(md);
  const opinionPresent = hasOpinion(md);
  const opinionHasTrailing = hasTrailingParagraphAfterOpinion(md);
  const findings: Finding[] = [];

  if (!tier || !(tier in RANGES)) {
    // Not an error -- the field is new and optional. Nothing to check.
    return { tier, words, opinionPresent, opinionHasTrailing, findings };
  }

  const range = RANGES[tier];
  if (range) {
    const [min, max] = range;
    const severeMin = min * (1 - SEVERE_BUFFER);
    const severeMax = max * (1 + SEVERE_BUFFER);
    if (words < min) {
      findings.push({
        severity: words < severeMin ? 'severe' : 'marginal',
        message: `${words} palabras, bajo el piso de ${tier} (${min}-${max})`,
      });
    }
    if (words > max) {
      findings.push({
        severity: words > severeMax ? 'severe' : 'marginal',
        message: `${words} palabras, sobre el techo de ${tier} (${min}-${max}) -- ¿de verdad es un ${tier}, o el router se quedó corto?`,
      });
    }
  }

  const shouldHaveOpinion = tier === 'B' || tier === 'C';
  if (tier === 'A' && opinionPresent) {
    findings.push({ severity: 'severe', message: 'tier A no lleva Opinión de Playbook y esta pieza sí tiene una' });
  }
  if (shouldHaveOpinion && !opinionPresent) {
    findings.push({ severity: 'severe', message: `tier ${tier} debe llevar Opinión de Playbook y no se encontró` });
  }
  if (tier === 'C' && opinionHasTrailing) {
    findings.push({
      severity: 'severe',
      message:
        'hay un párrafo de prosa justo después de la Opinión de Playbook -- el Deep Dive la lleva en exactamente un párrafo (format-tiers.md §3b, 2026-09-13)',
    });
  }

  return { tier, words, opinionPresent, opinionHasTrailing, findings };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: npx tsx scripts/check-format-tier.ts <draft.json>');
    process.exitCode = 2;
    return;
  }
  const drafts = JSON.parse(readFileSync(path, 'utf8')) as Draft[];
  let severeCount = 0;
  let marginalCount = 0;

  for (const d of drafts) {
    const { tier, words, opinionPresent, opinionHasTrailing, findings } = analyseTier(d);
    const severe = findings.filter(f => f.severity === 'severe');
    const marginal = findings.filter(f => f.severity === 'marginal');
    const mark = severe.length ? '✗' : marginal.length ? '⚑' : '✓';

    console.log(`\n${mark} ${(d.title || '(sin título)').slice(0, 70)} [${tier || '?'}]`);
    console.log(`   ${words} palabras · Opinión ${opinionPresent ? 'sí' : 'no'}${opinionHasTrailing ? ' (+ párrafo trailing)' : ''}`);
    for (const f of severe) console.log(`   ✗ SEVERO (bloquearía el publish): ${f.message}`);
    for (const f of marginal) console.log(`   ⚑ marginal (solo aviso): ${f.message}`);
    if (severe.length) severeCount++;
    else if (marginal.length) marginalCount++;
  }

  const clean = drafts.length - severeCount - marginalCount;
  console.log(
    `\n${clean}/${drafts.length} borradores calzan sin observaciones, ${marginalCount} con avisos marginales, ` +
      `${severeCount} con hallazgos severos (bloquearían el publish real).`,
  );
  if (severeCount) process.exitCode = 1;
}

if (require.main === module) main();
