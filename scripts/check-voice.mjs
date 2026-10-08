// Checks a draft against the house style the portal actually publishes in,
// before it goes live.
//
// Retuned 2026-08-11 (round 2 of the skill restructure) to the researched
// rhythm rule that REPLACED the old 80-100-word block directive: a paragraph
// is 2-3 sentences, roughly 40-80 words, opening sentence carrying the point.
// The range is Nielsen Norman Group's web-scannability finding (2-4 sentences
// / ~40-70 words for a scanning reader) adjusted up for Spanish's longer
// words and sentences and for Playbook's business-brief register. The single
// rule applies to every format tier; there is deliberately no per-tier range.
// See .claude/playbook-editorial/voice-and-style.md §2, shared by both
// publish skills, which is the only home for this rule.
//
// The counts below are a SANITY CHECK, not the gate. The gate is editorial:
// "is this paragraph doing two things? If yes, cut." A paragraph inside the
// range that does two things still gets cut; one slightly outside that does
// exactly one thing survives. So the thresholds sit above the top of the
// range — they exist to point at a paragraph whose seam is worth hunting for,
// not to push prose to a number.
//
// What is strict regardless of length: the em-dash ban and the
// one-antithesis-per-piece cap. As of 2026-08-11 that cap has NO exemption —
// "no solo X, sino Y" counts like any other member of the family (it is on
// the editorial guide's own watch-list of fórmulas bajo vigilancia), and the
// pattern below detects it.
//
// Usage: node scripts/check-voice.mjs <path-to-draft.json> [--strict]
// Input: the same JSON array scripts/publish-newsletter.ts takes.
//
// This is a mirror, not a gate: it exits 0 by default so it can never block a
// deliberate editorial choice. Pass --strict to exit 1 on any flag (useful if
// it ever gets wired into a check).

import { readFileSync } from 'node:fs';

const TARGETS = {
  medianParagraphWords: 85, // range tops out at 80; flag a median past it
  p75ParagraphWords: 95, // one long paragraph is fine, a quartile of them is drift
  medianSentenceWords: 32, // 2-3 sentences inside 40-80 words lands ~20-27
  medianParagraphSentences: 3, // the other half of the rule: 2-3 sentences
  minHammerParagraphs: 0, // the hammer line lands INSIDE the paragraph, not as its own
  longParagraphWords: 110, // past here a paragraph has usually fused two movements
  maxLongShare: 0.25, // tolerate one in four; more means the movements are fusing
  maxNegativeParallelism: 1, // ~1 per piece, spent at the thesis. No exemptions.
};

// Declared devices, image blocks and their captions are structural, not prose —
// counting them would drag every median toward zero and hide real paragraphs.
// Keep this list in step with lib/article-devices.ts. The eight devices
// built on 2026-08-14 (Contrato, Calendario, Votación, Ranking, Cascada,
// Perfil, Escenarios, Tablero) were missing here until 2026-08-15, so a
// piece declaring one had its device line counted as a paragraph: it
// dragged the median, and the ` — ` that is the devices' own key/value
// syntax was reported as an em dash in prose. Both are false alarms that
// cost a rewrite of text that was already correct.
//
// It happened again, identically, on 2026-08-27 with the round-7 five
// (Control, Alcance, Condiciones, Precedentes, Contraste): three drafts
// that had passed clean came back flagged for a prose em dash the moment
// their Jugada was rerouted to a new device. Same false alarm, same cause,
// eleven days apart — so treat updating this list as PART of adding a
// device, not as follow-up work. The failure is quiet in the wrong
// direction: it pushes an editor to "fix" correct syntax.
const STRUCTURAL =
  /^(!\[|Foto: Playbook$|Cifra clave:|Jugada:|Cronología:|Recibo:|Ecuación:|Salto:|Reparto:|Alineación:|Cotización:|Resultados:|Duelo:|Serie:|Mapa:|Venta:|Cadena:|Contrato:|Calendario:|Votación:|Ranking:|Cascada:|Perfil:|Escenarios:|Tablero:|Pirámide:|Control:|Alcance:|Condiciones:|Precedentes:|Contraste:|Fuentes:|Ruta del dinero:|## )/;

// The negative-parallelism family, counted against one budget.
//
// voice-and-style.md §2 says "the whole family counts against the one cap" and
// enumerates four shapes. Until 2026-08-11 this file only detected two of them:
// the first pattern hard-coded a list of copular and auxiliary verbs
// (es|son|fue|viene|está|estaba|se trata de), so any member built on a lexical
// verb slipped through uncounted. All three articles published that day closed
// on one — "Disney no compró carreras, compró fechas fijas", "Trump no defendió
// una gestión, cambió la pregunta", "El tope no dejó fuera al capital privado,
// le cambió el instrumento" — and the checker reported `antítesis 0` on every
// one. Each was within budget, so nothing shipped wrong, but the number the
// reviewer reads was not the number the rule defines, and a piece carrying two
// would have passed silently.
//
// Spanish has no POS tagger here, so the general shape is matched structurally:
// a negated clause whose verb is followed by a comma and a second clause that
// also opens on a verb. VERB below is deliberately conservative — unambiguous
// finite endings (-ó, -ió, -aron, -ieron, -aba, -ía, -ará, -aría) plus the
// common irregulars — because a false positive here costs a rewrite the rule
// does not actually demand.
const CLITIC = '(?:me|te|se|le|les|lo|la|los|las|nos)\\s+';
// JS \b is ASCII-only, so it does NOT fire after an accented letter: "compró "
// is non-word followed by non-word, i.e. no boundary at all. Every lexical
// preterite in Spanish ends in a vowel with an accent, so a trailing \b here
// would silently fail on exactly the forms this is meant to catch. Use an
// explicit "no more letters follow" lookahead instead.
const NOT_LETTER = '(?![a-zñáéíóúü])';
const VERB =
  '(?:' +
  // unambiguous finite morphology
  '[a-zñáéíóú]{2,}?(?:ó|ió|aron|ieron|aba|abas|aban|ábamos|ía|ías|ían|íamos|ará|erá|irá|arán|erán|irán|aría|ería|iría)' +
  // high-frequency irregulars and present forms that carry this construction
  '|es|son|era|eran|fue|fueron|será|serán|está|están|estaba|estaban|hay|tiene|tienen' +
  '|va|van|viene|vienen|vino|vinieron|deja|dejan|hace|hacen|sigue|siguen|puede|pueden' +
  '|quiere|quieren|busca|buscan|gana|ganan|pierde|pierden|cambia|cambian|compra|compran' +
  '|vende|venden|mueve|mueven|pone|ponen|dice|dicen|sabe|saben|vale|valen|toca|tocan' +
  ')';

// The USD parenthetical (voice-and-style.md §7, publisher directive
// 2026-09-17, scope narrowed 2026-09-29). A non-USD figure carries its USD
// equivalent in parentheses ONCE PER ZONE: the excerpt, the lede before the
// first `##`, each `##` section, the Opinión, and a Cifra clave caption. Only
// the first figure of each zone needs it; the rest stay in their own currency.
//
// Added 2026-09-28 after the Brazil betting-ban piece published with 2 of 11
// conversions. The rule had been written for eleven days and read at drafting
// time, but it lived only in §7 prose: nothing in the checklist and nothing
// here asked for it at the gate, so it depended on the drafter remembering.
// The mechanical flags in this file — em dash, antithesis — never get missed
// for exactly that reason.
//
// The zone scope replaced a per-figure one the next day: read literally, the
// original wording asked for 43 parentheticals in the Manchester United
// FY2026 piece. A check that fires 37 times on an article a reader would call
// correct is a check everyone learns to scroll past, which is worse than no
// check at all.
//
// Bare `$` is deliberately absent: it would match the `US$` this rule is
// about. A device's own VALUE slot is exempt (dynamic-element-library.md caps
// it at 24 characters, with no room for a conversion), which falls out of
// STRUCTURAL filtering the device lines out of prose; the one device the rule
// names explicitly, `Cifra clave`, is checked separately because its
// conversion belongs in the caption.
const NON_USD = /(?:R\$|MX\$|A\$|C\$|CHF\s?|£|€|¥)\s?\d[\d.,]*(?:\s?(?:mil\s+millones|millones|mil|[MBK]\b))?/;
const USD_AFTER = /^\s*\(US\$/;

// The first non-USD figure in `text`, when it is not followed by its
// conversion. null means the zone is clean — either no foreign figure at all,
// or the one that opens it is already converted.
function firstUnconverted(text) {
  const m = text.match(NON_USD);
  if (!m) return null;
  return USD_AFTER.test(text.slice(m.index + m[0].length)) ? null : m[0].trim();
}

// Body zones, in reading order. Headings and device declarations are dropped
// from the prose but `## ` still opens a new zone, and the Opinión gets its
// own because it restates the piece's figures for a reader who may have
// jumped straight to it.
function bodyZones(md) {
  const zones = [];
  let current = { label: 'la entrada', text: [] };
  const close = () => {
    if (current.text.length) zones.push(current);
  };
  for (const block of md.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)) {
    if (/^## /.test(block)) {
      close();
      current = { label: `la sección "${block.replace(/^##\s*/, '').slice(0, 38)}"`, text: [] };
      continue;
    }
    if (/^\*\*Opini[oó]n de Playbook:\*\*/i.test(block)) {
      close();
      current = { label: 'la Opinión', text: [] };
    }
    if (STRUCTURAL.test(block)) continue;
    current.text.push(block);
  }
  close();
  return zones;
}

function missingUsdZones(md) {
  return bodyZones(md)
    .map(z => ({ zone: z.label, figure: firstUnconverted(z.text.join('\n\n')) }))
    .filter(z => z.figure);
}

// `Cifra clave: R$268.5M — lo que Betano paga al año… (Globo)`. The value slot
// keeps its own currency; the conversion goes in the caption's prose, not in
// the trailing parenthetical, which credits a source rather than a currency.
function cifraClaveMissingUsd(md) {
  const out = [];
  for (const line of md.split(/\n{2,}/)) {
    const decl = line.trim().match(/^Cifra clave:\s*(.+)$/);
    if (!decl) continue;
    const [value, ...rest] = decl[1].split(' — ');
    if (!NON_USD.test(value)) continue;
    const caption = rest.join(' — ').replace(/\s*\([^)]*\)\s*$/, '');
    if (!/US\$/.test(caption)) out.push(value.trim());
  }
  return out;
}

const NEGATIVE_PARALLELISM = [
  // 1. "no es X, es Y" / "el golpe no vino de A, vino de B" / "no compró X,
  //    compró Y" / "no defendió X, cambió Y". Optional "sino (que)" or "pero"
  //    on the second clause, optional clitic before either verb.
  new RegExp(
    `\\bno\\s+(?:${CLITIC})?${VERB}${NOT_LETTER}[^.;:!?]{2,80},\\s*(?:sino\\s+(?:que\\s+)?|pero\\s+)?(?:${CLITIC})?${VERB}${NOT_LETTER}`,
    'gi',
  ),
  // 2. "no es X, SINO Y" — second clause led by sino with no finite verb of
  //    its own ("no es una regla, sino un contrato").
  new RegExp(`\\bno\\s+(?:${CLITIC})?${VERB}${NOT_LETTER}[^.;:!?]{2,80},?\\s*sino\\b`, 'gi'),
  // 3. "no solo X, sino Y" — un-exempted 2026-08-11. The comma is optional in
  //    practice ("no solo cambia el precio sino quién lo fija").
  /\bno s[oó]l(?:o|amente)\b[^.;:!?]{2,80}[,;]?\s*sino\b/gi,
  // 4. "deja de ser A y se convierte en B" — named in the guide, never detected.
  /\bdeja(?:n)? de (?:ser|estar)\b[^.;:!?]{2,80}\by se (?:convierte|convierten|vuelve|vuelven|transforma|transforman)\b/gi,
];

// The patterns overlap by design (shape 1 and shape 2 both fire on "no es X,
// sino Y"), so count distinct spans rather than raw matches or the same
// sentence is charged twice against a budget of one.
export function findNegatives(md) {
  const spans = [];
  for (const re of NEGATIVE_PARALLELISM) {
    re.lastIndex = 0;
    for (const m of md.matchAll(re)) spans.push([m.index, m.index + m[0].length, m[0]]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] < last[1]) {
      last[1] = Math.max(last[1], s[1]);
      if (s[2].length > last[2].length) last[2] = s[2];
    } else merged.push(s.slice());
  }
  return merged.map(s => s[2]);
}

const countNegatives = md => findNegatives(md).length;

const words = s => s.split(/\s+/).filter(Boolean).length;
const median = a => {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const pct = (a, p) => {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  return s[Math.floor((s.length * p) / 100)];
};

// The renderer boxes exactly one <p>: whichever one opens with the literal
// `**Opinión de Playbook:**` lead-in. Anything non-structural after it in the
// paragraph list ships as plain text sitting below the callout — the exact
// bug voice-and-style.md §2 and format-tiers.md §3 warn about. Detected
// against the STRUCTURAL-filtered list so device/heading/caption lines never
// count as the trailing paragraph.
function findOpinionSplit(paragraphs) {
  const idx = paragraphs.findIndex(p => /^\*\*Opini[oó]n de Playbook:\*\*/i.test(p));
  if (idx === -1 || idx === paragraphs.length - 1) return null;
  return { trailing: paragraphs.length - 1 - idx, preview: paragraphs[idx + 1].slice(0, 60) };
}

// "Que no huela a IA" (voice-and-style.md §7, team directive 2026-10-08): the
// Opinión closes on a statement, never on a rhetorical question. Looks at the
// Opinión paragraph, or at the last prose paragraph when the piece has none
// (tier A), and flags a final sentence that is a question or opens "La
// pregunta es / ya no es / de fondo es…". Soft flag, like the rest.
const CLOSING_QUESTION = /\bla pregunta (?:es|ya no es|sigue siendo|de fondo es|que queda es|ahora es)\b/i;
export function findClosingQuestion(paragraphs) {
  const idx = paragraphs.findIndex(p => /^\*\*Opini[oó]n de Playbook:\*\*/i.test(p));
  const target = idx === -1 ? paragraphs[paragraphs.length - 1] : paragraphs[idx];
  if (!target) return null;
  const sentences = target.replace(/^\*\*[^*]+:\*\*\s*/, '').split(/(?<=[.!?])\s+/).filter(Boolean);
  const last = sentences[sentences.length - 1] || '';
  if (/[?]\s*$/.test(last) || CLOSING_QUESTION.test(last)) return last.slice(0, 70);
  return null;
}

// Drafting scaffolding that must never reach the published text (§7).
const WORKING_LABELS =
  /\b(?:delta playbook|pregunta madre|reader persona|job[- ]to[- ]be[- ]done|lo que nadie te (?:est[aá] diciendo|dice|cuenta)|la historia playbook es)\b/gi;
export function findWorkingLabels(md) {
  return [...md.matchAll(WORKING_LABELS)].map(m => m[0]);
}

function analyse(article) {
  const md = article.bodyMarkdown || '';
  const paragraphs = md
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p && !STRUCTURAL.test(p));
  const opinionSplit = findOpinionSplit(paragraphs);
  // the bold lead-in is UI, not part of the sentence the reader parses
  const prose = paragraphs.map(p => p.replace(/^\*\*[^*]+:\*\*\s*/, ''));
  const pWords = prose.map(words);
  const sentences = prose
    .join(' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => words(s) > 3);

  return {
    paragraphs: prose.length,
    medianParagraph: median(pWords),
    medianSentence: median(sentences.map(words)),
    hammers: pWords.filter(n => n >= 4 && n <= 14).length,
    hammerShare: prose.length ? Math.round((100 * pWords.filter(n => n <= 14).length) / prose.length) : 0,
    p75Paragraph: pct(pWords, 75),
    longOnes: prose.map((p, i) => ({ i, n: pWords[i], p })).filter(x => x.n > TARGETS.longParagraphWords),
    medianParagraphSentences: median(
      prose.map(p => p.split(/(?<=[.!?])\s+/).filter(x => words(x) > 3).length),
    ),
    negatives: countNegatives(md),
    emDashes: prose.filter(p => p.includes('—')).length,
    opinionSplit,
    closingQuestion: findClosingQuestion(paragraphs),
    workingLabels: findWorkingLabels(md),
    usdZones: missingUsdZones(md),
    usdExcerpt: firstUnconverted(article.excerpt || ''),
    usdCifra: cifraClaveMissingUsd(md),
  };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: node scripts/check-voice.mjs <draft.json> [--strict]');
    process.exit(2);
  }
  const strict = process.argv.includes('--strict');
  const articles = JSON.parse(readFileSync(path, 'utf8'));
  let flagged = 0;
  let hardFail = false;

  for (const a of articles) {
    const m = analyse(a);
    const flags = [];
    if (m.opinionSplit) {
      flags.push(
        `⚠ RENDER BUG: La Opinión no es el último párrafo — ${m.opinionSplit.trailing} párrafo(s) quedan fuera del recuadro verde y se publican como texto suelto ("${m.opinionSplit.preview}…"). Fusiona todo en el único <p> de **Opinión de Playbook:** antes de publicar (voice-and-style.md §2, format-tiers.md §3).`,
      );
      hardFail = true;
    }
    if (m.medianParagraph > TARGETS.medianParagraphWords)
      flags.push(`párrafo mediano ${m.medianParagraph}p (rango 40-80, se marca pasando ${TARGETS.medianParagraphWords})`);
    if (m.p75Paragraph > TARGETS.p75ParagraphWords)
      flags.push(`p75 de párrafo ${m.p75Paragraph}p (objetivo ≤${TARGETS.p75ParagraphWords}, un cuartil largo es deriva, no excepción)`);
    if (m.medianSentence > TARGETS.medianSentenceWords)
      flags.push(`oración mediana ${m.medianSentence}p (objetivo ≤${TARGETS.medianSentenceWords})`);
    if (m.medianParagraphSentences > TARGETS.medianParagraphSentences)
      flags.push(`${m.medianParagraphSentences} oraciones por párrafo (regla: 2-3)`);
    if (m.hammers < TARGETS.minHammerParagraphs)
      flags.push(`sin línea martillo de ≤14p (archivo: ~1 de cada 5 párrafos)`);
    if (m.negatives > TARGETS.maxNegativeParallelism)
      flags.push(`${m.negatives} antítesis, familia completa incl. "no solo X, sino Y" (objetivo ≤${TARGETS.maxNegativeParallelism})`);
    if (m.closingQuestion)
      flags.push(`la Opinión (o el cierre) termina en pregunta: "${m.closingQuestion}…" (voice-and-style.md §7: cierra con una afirmación, no con una pregunta retórica)`);
    if (m.workingLabels.length)
      flags.push(`etiqueta de trabajo en el texto publicado: ${[...new Set(m.workingLabels)].join(', ')} (voice-and-style.md §7: el delta se nota en el contenido, no se anuncia)`);
    if (m.emDashes) flags.push(`${m.emDashes} párrafo(s) de prosa con guion largo`);
    for (const z of m.usdZones)
      flags.push(`${z.figure} abre ${z.zone} sin su equivalente en USD (voice-and-style.md §7: una conversión por zona)`);
    if (m.usdExcerpt)
      flags.push(`${m.usdExcerpt} abre el excerpt sin su equivalente en USD`);
    if (m.usdCifra.length)
      flags.push(`Cifra clave en ${m.usdCifra.join(', ')} sin la conversión en el pie (el slot de valor conserva su divisa; el USD va en la prosa del pie)`);
    // A long paragraph is normal in the archive; a page made of them is not.
    if (m.paragraphs && m.longOnes.length / m.paragraphs > TARGETS.maxLongShare) {
      flags.push(
        `${m.longOnes.length}/${m.paragraphs} párrafos pasan de ${TARGETS.longParagraphWords}p (busca la costura)`,
      );
      for (const b of m.longOnes) flags.push(`  párrafo ${b.i + 1} de ${b.n}p: "${b.p.slice(0, 52)}…"`);
    }

    console.log(`\n${flags.length ? '⚑' : '✓'} ${(a.title || '(sin título)').slice(0, 70)}`);
    console.log(
      `   ${m.paragraphs} párrafos · mediana ${m.medianParagraph}p/${m.medianParagraphSentences}or por párrafo/${m.medianSentence}o · antítesis ${m.negatives}`,
    );
    for (const f of flags) console.log(`   ⚑ ${f}`);
    if (flags.length) flagged++;
  }

  console.log(`\n${articles.length - flagged}/${articles.length} artículos dentro del ritmo de Playbook.`);
  // opinionSplit is a guaranteed live-page rendering defect, not a style
  // judgment call — it fails the run even without --strict, unlike every
  // other check here, so it can't ship past a self-check that's only ever
  // read for the other, softer flags.
  if (hardFail || (flagged && strict)) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

