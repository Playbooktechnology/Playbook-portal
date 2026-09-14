// Asserts every device declaration in a draft actually RENDERS.
//
// Devices fail loud but late: a malformed declaration ships as visible plain
// text on the live page, which is a mistake a reader sees. The publish path
// does not check, because devices are a render-time transform — so this is
// the check that belongs before publishing, not after.
//
// It also reports the per-article budget against the number of declarations,
// since an over-budget device degrades to plain text exactly the same way a
// malformed one does.
//
//   npx tsx scripts/check-draft-devices.ts <draft.json>
//
// WIRED AS A REAL GATE (2026-09-14, moat playbook follow-up): this script
// existed for a run with 0 references anywhere -- no SKILL.md, no call from
// scripts/publish-newsletter.ts, no CI. A malformed device declaration would
// have published as visible broken text with nothing to stop it, exactly
// what the header comment above warns about. It now runs for real inside
// scripts/publish-newsletter.ts, right after the overlap and tier gates.
//
// Unlike scripts/check-format-tier.ts's word-count findings, there is no
// "marginal" version of a device failure: a declaration either parses and
// renders, or it degrades to visible plain text on the live page. Every
// finding here is binary and every finding blocks -- see analyseDraftDevices
// below. Override only with --allow-device-mismatch, and only after a human
// has confirmed the "declaration" is deliberately not a device (e.g. prose
// that happens to start with a device-like word followed by a colon).
import { readFileSync } from 'node:fs';
import { deviceFromParagraph, deviceBudgetFor } from '../lib/article-devices';

// Every device prefix, so a paragraph that LOOKS like a declaration but does
// not parse is reported rather than silently passing as prose.
const PREFIXES =
  /^\s*(?:La\s+|El\s+|Los\s+)?(Cifra clave|Jugada|Cronolog[íi]a|Recibo|Ecuaci[óo]n|Salto|Reparto|Alineaci[óo]n|Cotizaci[óo]n|Resultados|Duelo|Serie|Mapa|Venta|Cadena|Contrato|Calendario|Votaci[óo]n|Ranking|Cascada|Perfil|Escenarios|Tablero|Pir[áa]mide|Control|Alcance|Condiciones|Precedentes|Contraste)\s*:/i;

export type Draft = {
  title?: string;
  bodyMarkdown?: string;
  readingTime?: number | null;
  priority?: number | null;
};

export type DeviceFinding = {
  text: string;
  ok: boolean;
  name: string | null;
  overBudget: boolean;
  repeat: boolean;
  bad: boolean;
  reason: 'no-parsea' | 'fuera-de-presupuesto' | 'tipo-repetido' | null;
};

export type DeviceReport = {
  budget: number;
  declared: DeviceFinding[];
  failures: number; // count of `bad` entries -- always severe, no marginal tier
};

/** Pure, DB-free analysis -- reused by the CLI below and by
 * scripts/publish-newsletter.ts's real blocking gate. */
export function analyseDraftDevices(a: Draft): DeviceReport {
  const budget = deviceBudgetFor(a.readingTime ?? null, a.priority ?? null);
  const paragraphs: string[] = String(a.bodyMarkdown || '').split(/\n\n+/);
  const declared: DeviceFinding[] = [];
  const names = new Set<string>();

  for (const p of paragraphs) {
    const t = p.trim();
    // A bold prose lead-in is not a declaration (voice-and-style.md §5).
    if (/^\*\*/.test(t)) continue;
    if (!PREFIXES.test(t)) continue;
    const d = deviceFromParagraph(t);
    const i = declared.length;
    const overBudget = i >= budget;
    const repeat = d?.name ? names.has(d.name) : false;
    if (d?.name) names.add(d.name);
    const bad = !d || overBudget || repeat;
    const reason: DeviceFinding['reason'] = !d ? 'no-parsea' : overBudget ? 'fuera-de-presupuesto' : repeat ? 'tipo-repetido' : null;
    declared.push({ text: t, ok: !!d, name: d?.name ?? null, overBudget, repeat, bad, reason });
  }

  return { budget, declared, failures: declared.filter(d => d.bad).length };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('uso: npx tsx scripts/check-draft-devices.ts <draft.json>');
    process.exitCode = 1;
    return;
  }

  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const articles: Draft[] = Array.isArray(raw) ? raw : [raw];

  let totalFailures = 0;

  for (const a of articles) {
    const { budget, declared, failures } = analyseDraftDevices(a);
    totalFailures += failures;

    console.log(`\n── ${a.title}`);
    console.log(`   readingTime ${a.readingTime} · priority ${a.priority} → presupuesto ${budget} device(s)`);

    if (!declared.length) {
      console.log('   sin devices declarados');
      continue;
    }

    for (const d of declared) {
      const flag = !d.ok
        ? 'NO PARSEA → saldría como texto plano'
        : d.overBudget
          ? 'FUERA DE PRESUPUESTO → saldría como texto plano'
          : d.repeat
            ? 'TIPO REPETIDO → saldría como texto plano'
            : `ok (${d.name})`;
      console.log(`   ${d.bad ? 'FALLA' : '  ok '}  ${flag}`);
      console.log(`          ${d.text.slice(0, 108)}`);
    }
  }

  console.log(
    totalFailures
      ? `\n${totalFailures} declaración(es) NO renderizarían. Corrige antes de publicar.`
      : '\nTodas las declaraciones renderizan dentro de presupuesto.',
  );
  process.exitCode = totalFailures ? 1 : 0;
}

if (require.main === module) main();
