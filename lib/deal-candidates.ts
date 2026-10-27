import type { Article } from './data/articles';
import type { Deal, DealInput } from './deals';

// Candidatos para El Marcador (A7): notas publicadas desde el 21 sep 2026 con
// industria Patrocinios, Inversión, Derechos de TV o Venues que todavía no
// están en la tabla. NADA de esto se publica solo: la lista vive en el CMS
// (pestaña Marcador → "Candidatos") y cada candidato entra al Marcador solo
// cuando un editor lo abre, completa lo que falta y guarda.
//
// Los campos se PROPONEN desde el titular y la bajada con reglas simples, y
// cada uno que no se pudo leer se marca como faltante. Nunca se propone un
// monto como revelado ni un acuerdo como confirmado: eso lo decide el editor
// con la metodología del Marcador (Confirmado/Reportado, revelado frente a
// estimado con ~, N/R).

export const CANDIDATES_SINCE = '2026-09-21';

const VERTICAL_TO_TYPE: Record<string, DealInput['type']> = {
  Patrocinios: 'patrocinio',
  'Naming Rights': 'patrocinio',
  'Private Equity e Inversiones': 'inversion',
  'Derechos de TV y Streaming': 'derechos',
  'Infraestructura y Venues': 'estadios',
};

// Words that, in a headline, usually mean an actual deal rather than a story
// about the industry ("DAZN pierde casi US$1,000 millones" is a Derechos de TV
// story, not a deal). Used to sort, never to drop.
const DEAL_SIGNAL =
  /\b(firma|firman|patrocin\w*|compra|venta|vende|adquier\w*|invierte|alianza|acuerdo|renueva|transmitir[aá]|sublicencia|naming|nuevo socio)\b/i;

export type CandidateField = 'brand' | 'counterparty' | 'type' | 'country' | 'sport' | 'duration' | 'amount';

export type DealCandidate = {
  articleId: string;
  title: string;
  date: string;
  vertical: string;
  /** True when the headline reads like a deal (sorts first). */
  signal: boolean;
  proposed: Partial<DealInput> & { amountText?: string };
  /** Fields the text did not give us; the editor fills them. */
  missing: CandidateField[];
  /** Things to double-check before saving (currency, amount source…). */
  notes: string[];
};

function articleIdFromUrl(url: string): string | null {
  const m = /\/articulo\/([^/?#]+)/.exec(url || '');
  return m ? decodeURIComponent(m[1]) : null;
}

const clean = (s: string | undefined) =>
  (s ?? '')
    .replace(/^(la|el|los|las)\s+/i, '')
    .replace(/["“”]/g, '')
    .trim();

/** Brand (who pays / buys) and counterparty (who receives), from the headline. */
function parties(title: string): { brand?: string; counterparty?: string } {
  const t = title.replace(/\s+/g, ' ');
  const rules: Array<[RegExp, (m: RegExpMatchArray) => { brand?: string; counterparty?: string }]> = [
    [/venta de [\d.,]+% de (?:los |las |el |la )?(.+?) a (.+?)(?:[:,]|$)/i, m => ({ brand: m[2], counterparty: m[1] })],
    [/^(.+?),? nuevos? patrocinador(?:es)?(?: oficial(?:es)?)? de (?:la |el |los |las )?(.+?)(?: en | para |[:,]|$)/i, m => ({ brand: m[1], counterparty: m[2] })],
    [/^(.+?) firma(?:n)?(?: un [^,]+?)? con (?:los |las |el |la )?(.+?)(?: y |[:,]|$)/i, m => ({ brand: m[1], counterparty: m[2] })],
    [/^(.+?) patrocina(?:rá)? (?:a |al )?(.+?)(?:[:,]|$)/i, m => ({ brand: m[1], counterparty: m[2] })],
    [/^(.+?) transmitirá (.+?)(?: de \d{4}| hasta|[:,]|$)/i, m => ({ brand: m[1], counterparty: m[2] })],
    [/^(.+?) (?:compra|adquiere) (?:a |al )?(.+?)(?:[:,]|$)/i, m => ({ brand: m[1], counterparty: m[2] })],
    [/^(.+?) sube a [\d.,]+% (?:de|del) (.+?)(?: y |[:,]|$)/i, m => ({ brand: m[1], counterparty: m[2] })],
    [/: (.+?) entra(?: en lugar| como|$)/i, m => ({ brand: m[1] })],
  ];
  for (const [re, pick] of rules) {
    const m = t.match(re);
    if (m) {
      const r = pick(m);
      return { brand: clean(r.brand) || undefined, counterparty: clean(r.counterparty) || undefined };
    }
  }
  return {};
}

/** First money figure in the text, normalised to whole US dollars when it is in US$. */
function amount(text: string): { usd?: number; raw?: string; foreign?: string } {
  const m = text.match(/(US\$|USD|R\$|€|£|\$)\s?([\d.,]+)\s*(mil millones|millones|mdd|M\b|mil\b)?/i);
  if (!m) return {};
  const [raw, cur, num, scale] = m;
  const n = Number(num.replace(/,/g, ''));
  if (!Number.isFinite(n)) return {};
  const mult = /mil millones/i.test(scale ?? '') ? 1e9 : /millones|mdd|M/i.test(scale ?? '') ? 1e6 : /mil/i.test(scale ?? '') ? 1e3 : 1;
  if (/^(US\$|USD)$/i.test(cur)) return { usd: Math.round(n * mult), raw };
  return { raw, foreign: cur };
}

function duration(text: string): string | undefined {
  const years = text.match(/(\d+)\s+(años|temporadas)/i);
  if (years) return `${years[1]} ${years[2].toLowerCase()}`;
  const span = text.match(/de (20\d\d) a (20\d\d)/i);
  if (span) return `${Number(span[2]) - Number(span[1]) + 1} años`;
  return undefined;
}

export function dealCandidates(articles: Article[], deals: Pick<Deal, 'articleUrl'>[]): DealCandidate[] {
  const inMarcador = new Set(deals.map(d => articleIdFromUrl(d.articleUrl)).filter(Boolean));
  const out: DealCandidate[] = [];
  for (const a of articles) {
    if (a.status !== 'published' || a.date < CANDIDATES_SINCE || inMarcador.has(a.id)) continue;
    const vertical = a.tagsVertical.find(v => v in VERTICAL_TO_TYPE);
    if (!vertical) continue;

    const text = `${a.title}. ${a.excerpt}`;
    const { brand, counterparty } = parties(a.title);
    const money = amount(text);
    const dur = duration(text);
    const country = a.tagsScope.includes('Nacional') ? 'México' : '';
    const sport = a.tagsSport[0] ?? '';

    const proposed: DealCandidate['proposed'] = {
      date: a.date,
      brand: brand ?? '',
      counterparty: counterparty ?? '',
      type: VERTICAL_TO_TYPE[vertical],
      country,
      sport,
      duration: dur ?? '',
      amountText: money.usd != null ? String(money.usd) : '',
      amountDisclosed: false,
      status: 'reportado',
      summary: a.excerpt,
      articleUrl: `/articulo/${a.id}`,
      featured: false,
    };
    const missing: CandidateField[] = [];
    if (!brand) missing.push('brand');
    if (!counterparty) missing.push('counterparty');
    if (!country) missing.push('country');
    if (!sport) missing.push('sport');
    if (!dur) missing.push('duration');
    if (money.usd == null) missing.push('amount');
    const notes: string[] = [];
    if (money.foreign) notes.push(`Monto en otra moneda (${money.raw}): convertir a US$ con el tipo de cambio del BCE del día del anuncio.`);
    if (money.usd != null) notes.push(`Monto leído del texto (${money.raw}): confirmar si lo reveló una de las partes (revelado) o solo la prensa (estimado, ~).`);
    notes.push('Estado propuesto: Reportado. Cambiar a Confirmado solo si una de las partes lo anunció.');

    out.push({ articleId: a.id, title: a.title, date: a.date, vertical, signal: DEAL_SIGNAL.test(a.title), proposed, missing, notes });
  }
  return out.sort((x, y) => Number(y.signal) - Number(x.signal) || y.date.localeCompare(x.date));
}
