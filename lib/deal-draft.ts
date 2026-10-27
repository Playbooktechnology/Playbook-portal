// Pre-fills a Marcador entry from a published article, for the review
// queue in /admin (table `deal_drafts`, see lib/db/schema.ts). Pure and
// deterministic: no network, no model, so it runs the same inside the
// admin action, the Make.com webhook and scripts/publish-newsletter.ts.
//
// It only PROPOSES. Every field it can't find with confidence is left
// empty and named in `missing`, so the editor sees what to fill instead of
// a plausible-looking guess. Nothing here writes to `deals`: approval is
// the only path there (lib/actions/deals.ts approveDealDraft).

import type { DealInput } from './deals';

// The article verticals that carry Marcador deals (lib/taxonomy.ts
// VERTICAL_OPTIONS), mapped to the deal type they most often mean. The
// first vertical on the article that appears here decides the type.
export const DEAL_VERTICALS: Record<string, string> = {
  Patrocinios: 'patrocinio',
  'Naming Rights': 'patrocinio',
  'Derechos de TV y Streaming': 'derechos',
  'Private Equity e Inversiones': 'inversion',
  'Infraestructura y Venues': 'estadios',
};

export function isDealArticle(tagsVertical: string[]): boolean {
  return tagsVertical.some(v => v in DEAL_VERTICALS);
}

export type DraftField = 'date' | 'brand' | 'counterparty' | 'type' | 'country' | 'sport' | 'duration' | 'amount' | 'status';

export const DRAFT_FIELD_LABEL: Record<DraftField, string> = {
  date: 'fecha',
  brand: 'marca',
  counterparty: 'contraparte',
  type: 'tipo',
  country: 'país',
  sport: 'deporte',
  duration: 'duración',
  amount: 'monto',
  status: 'estatus',
};

export type DraftSource = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  bodyHtml: string | null;
  teaser: string;
  tagsVertical: string[];
  tagsSport: string[];
  tagsScope: string[];
};

// `note` is for the editor only (things to double-check); it never reaches
// `deals`.
export type DraftFields = Partial<DealInput> & { note?: string };
export type DealDraftProposal = { fields: DraftFields; missing: DraftField[] };

function plain(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ----------------------------------------------------------------- Parties

// Title shapes the newsroom actually uses for deal stories, in order of
// how unambiguous they are. Each returns [brand, counterparty].
const PARTY_PATTERNS: [RegExp, (m: RegExpMatchArray) => [string, string]][] = [
  [/^(.+?)\s+[×x]\s+(.+?)(?:[:,.]|$)/u, m => [m[1], m[2]]],
  [/^(.+?)\s+es\s+(?:el|la)\s+nuev[oa]\s+patrocinador[^:]*?\s+de(?:l)?\s+(?:la\s+|el\s+)?(\p{Lu}[^:,.]*)$/u, m => [m[1], m[2]]],
  [/^(.+?),?\s+(?:nuev[oa]s?\s+)?patrocinador(?:es)?\s+(?:oficial(?:es)?\s+)?(?:de(?:l)?|para)\s+(?:la\s+|el\s+|los\s+|las\s+)?(.+?)(?:[:,.]|\s+en\s+|$)/iu, m => [m[1], m[2]]],
  [/^(.+?)\s+patrocinar[áa]\s+(?:a(?:l)?\s+)?(?:la\s+|el\s+)?(.+?)(?:\s+hasta|\s+por|[:,.]|$)/iu, m => [m[1], m[2]]],
  [/^(.+?)\s+pone\s+su\s+nombre\s+a\s+(?:la\s+|el\s+)?(.+?)(?:[:,.]|$)/iu, m => [m[1], m[2]]],
  [/^(.+?)\s+(?:firma|firman|cierra|renueva|amplía|extiende)\s+(?:un\s+|su\s+)?(?:acuerdo|contrato|alianza|patrocinio)?\s*(?:de\s+\S+\s+)?con\s+(?:la\s+|el\s+)?(.+?)(?:\s+(?:por|hasta|para)\s+|\s+y\s+(?:entra|se|suma|abre)|[:,.]|$)/iu, m => [m[1], m[2]]],
  [/^(.+?)\s+(?:compra|adquiere)\s+(?:parte\s+(?:de(?:l)?\s+)?|el\s+\d+\s*%\s+de(?:l)?\s+|una\s+participación\s+en\s+)?(?:la\s+|el\s+)?(.+?)(?:\s+por\s+|[:,.]|$)/iu, m => [m[1], m[2]]],
  [/^(.+?)\s+(?:invierte|entra)\s+(?:US\$\S+\s+)?en\s+(?:la\s+|el\s+)?(.+?)(?:[:,.]|$)/iu, m => [m[1], m[2]]],
];

function tidyParty(s: string): string {
  return s
    .replace(/^(?:la|el|los|las)\s+/i, '')
    .replace(/[¿?¡!"“”]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const CONNECTORS = new Set(['y', 'e', 'de', 'del', 'la', 'el', 'los', 'las']);
const PROPER_NAME = /^(?:(?:la|el|los|las)\s+)?(\p{Lu}[\p{L}\d.&'-]*(?:\s+(?:\p{Lu}[\p{L}\d.&'-]*|\d+|de|del))*)/u;

// A real party name is short, has no clause punctuation, and the receiving
// side is a proper noun. Anything else is a phrase the pattern swallowed;
// better left empty for the editor than proposed wrong.
function plausible(brand: string, counterparty: string): boolean {
  const ok = (p: string) => {
    const words = p.split(' ');
    // Lowercase words other than connectors mean a verb phrase got in
    // ("CazéTV renueva a ocho"); a lone lowercase brand ("adidas") is fine.
    const stray = words.filter(w => /^\p{Ll}/u.test(w) && !CONNECTORS.has(w));
    return !!p && words.length <= 6 && !/[:;]/.test(p) && (words.length === 1 || stray.length === 0);
  };
  return ok(brand) && ok(counterparty) && /^[\p{Lu}\d]/u.test(counterparty);
}

function matchParties(title: string): { brand: string; counterparty: string } | null {
  for (const [re, pick] of PARTY_PATTERNS) {
    const m = title.match(re);
    if (!m) continue;
    const [brand, counterparty] = pick(m).map(tidyParty);
    if (plausible(brand, counterparty)) return { brand, counterparty };
  }
  return null;
}

// Titles often open with a kicker ("LA28: Allianz pone su nombre a…"):
// try the headline after it, and if the counterparty it yields isn't a
// name, the kicker usually is the property.
function extractParties(title: string): { brand: string; counterparty: string } | null {
  const direct = matchParties(title);
  if (direct) return direct;
  const kicker = title.match(/^([^:]{2,40}):\s+(.+)$/);
  if (!kicker) return null;
  const rest = matchParties(kicker[2]);
  if (rest) return rest;
  const brand = kicker[2].match(/^(\p{Lu}[\p{L}\d.&'-]*(?:\s+\p{Lu}[\p{L}\d.&'-]*){0,3})\s+(?:pone|firma|patrocina|se suma|entra|renueva)/u);
  const property = kicker[1].match(PROPER_NAME);
  return brand && property ? { brand: brand[1], counterparty: tidyParty(property[1]) } : null;
}

// ----------------------------------------------------------------- Amount

const WORD_SCALE: Record<string, number> = {
  mil: 1e3,
  millón: 1e6,
  millon: 1e6,
  millones: 1e6,
  mdd: 1e6,
  m: 1e6,
  mm: 1e6,
  bn: 1e9,
  billón: 1e9,
  billones: 1e9,
};

// USD only: the methodology converts other currencies with the ECB rate of
// the announcement day, which is an editor's job, not a regex's. A non-USD
// figure is reported back as text in `amountNote` so the editor sees it.
export function extractAmount(text: string): { usd: number | null; note: string } {
  const usd = text.match(/US\$\s?(\d[\d,.]*)\s*(mil millones|millones|millón|mdd|bn|mm|m\b|mil\b)/i);
  if (usd) {
    // "15.6" and "1,200": a comma is a thousands separator, a dot a decimal.
    const raw = usd[1].replace(/,/g, '');
    const n = Number(raw);
    const unit = (usd[2] ?? '').toLowerCase();
    const scale = unit === 'mil millones' ? 1e9 : WORD_SCALE[unit] ?? 1;
    if (Number.isFinite(n)) return { usd: Math.round(n * scale), note: usd[0].trim() };
  }
  const other = text.match(/(?:€|£|MXN\s?\$?|R\$)\s?\d[\d,.]*\s*(?:mil millones|millones|millón|bn|m\b)?/i);
  return { usd: null, note: other ? other[0].trim() : '' };
}

// ----------------------------------------------------------------- Rest

// Contract phrasing only ("por cinco años", "contrato de 3 temporadas",
// "hasta 2029"): a bare "55 años" is as likely a stadium's age.
function extractDuration(text: string): string {
  const years = text.match(/\b(?:por|contrato de|acuerdo de)\s+(\d{1,2}|dos|tres|cuatro|cinco|seis|siete|ocho|diez)\s+(años|temporadas)\b/i);
  const until = text.match(/\bhasta\s+(?:el\s+|la temporada\s+)?(20\d\d)\b/i);
  const range = text.match(/\b(?:temporadas?|de|entre)\s+(20\d\d)\s*(?:-|–|y|a)\s*(20\d\d)\b/i);
  if (years && range) return `${years[1]} ${years[2]} (${range[1]}-${range[2]})`;
  if (years) return `${years[1]} ${years[2]}`;
  if (until) return `Hasta ${until[1]}`;
  if (range) return `${range[1]}-${range[2]}`;
  return '';
}

// Countries as /marcador already spells them (the `deals.country` values).
const COUNTRIES: [RegExp, string][] = [
  [/\bM[ée]xic(?:o|ana|ano)|Liga MX|\bFMF\b/i, 'México'],
  [/Estados Unidos|\bEE\.?\s?UU\.?|\bNFL\b|\bNBA\b|\bMLB\b|\bMLS\b|\bWNBA\b|\bNHL\b/i, 'Estados Unidos'],
  [/Premier League|Inglaterra|\bWSL\b/i, 'Inglaterra'],
  [/Espa[ñn]a|LaLiga|Real Madrid|Bar[çc]a|Barcelona|Atl[ée]tico de Madrid/i, 'España'],
  [/Brasil|Brasileir|Corinthians|Flamengo|Palmeiras|Gr[êe]mio/i, 'Brasil'],
  [/Francia|Ligue 1|\bPSG\b/i, 'Francia'],
  [/Portugal|Benfica|Oporto|Sporting/i, 'Portugal'],
  [/Italia|Serie A|Juventus|\bMil[áa]n\b|\bInter\b/i, 'Italia'],
  [/Alemania|Bundesliga/i, 'Alemania'],
  [/Argentina/i, 'Argentina'],
  [/Colombia|Dimayor/i, 'Colombia'],
];

function extractCountry(title: string, excerpt: string, scope: string[]): string {
  for (const text of [title, excerpt]) {
    for (const [re, country] of COUNTRIES) if (re.test(text)) return country;
  }
  return scope.includes('Nacional') ? 'México' : '';
}

// lib/taxonomy.ts SPORT_OPTIONS → the sport names /marcador uses.
const SPORT_MAP: Record<string, string> = {
  Fútbol: 'Fútbol',
  'Liga MX': 'Fútbol',
  NFL: 'Fútbol americano',
  NBA: 'Básquetbol',
  WNBA: 'Básquetbol',
  Béisbol: 'Béisbol',
  Tenis: 'Tenis',
  Golf: 'Golf',
  F1: 'Automovilismo',
  Olímpico: 'Multideporte',
};

function extractStatus(text: string): string {
  if (/\b(anunci[óo]|anuncian|oficializ|confirm[óo]|comunicado|firm[óo]|present[óo])\b/i.test(text)) return 'confirmado';
  if (/\b(según|reporta|report[óo]|de acuerdo con|habría|estaría)\b/i.test(text)) return 'reportado';
  return '';
}

export function proposeDealDraft(a: DraftSource): DealDraftProposal {
  const body = plain(a.bodyHtml || a.teaser || '');
  const lead = `${a.title}. ${a.excerpt}`;
  const missing: DraftField[] = [];

  const parties = extractParties(a.title);
  if (!parties) missing.push('brand', 'counterparty');

  const vertical = a.tagsVertical.find(v => v in DEAL_VERTICALS);
  const type = vertical ? DEAL_VERTICALS[vertical] : '';
  if (!type) missing.push('type');

  const country = extractCountry(a.title, '', a.tagsScope);
  if (!country) missing.push('country');

  const sport = SPORT_MAP[a.tagsSport[0] ?? ''] ?? '';
  if (!sport) missing.push('sport');

  // Duration and amount come from the title and dek only: the body cites
  // other deals' figures and years (comparables, history) far too often.
  const duration = extractDuration(lead);
  if (!duration) missing.push('duration');

  const amount = extractAmount(lead);
  if (amount.usd == null) missing.push('amount');

  const status = extractStatus(`${lead} ${body.slice(0, 1500)}`);
  if (!status) missing.push('status');

  // The announcement date is rarely stated as a date in the copy; the
  // article's own date is the honest default, but the editor confirms it.
  missing.push('date');

  return {
    fields: {
      date: a.date,
      brand: parties?.brand ?? '',
      counterparty: parties?.counterparty ?? '',
      type,
      country,
      sport,
      duration,
      amountUsd: amount.usd,
      // Never assume "revelado": a figure counts toward the total only when
      // an editor confirms one of the parties announced it.
      amountDisclosed: false,
      status: status || 'reportado',
      summary: a.excerpt.slice(0, 280),
      articleUrl: `/articulo/${a.id}`,
      featured: false,
      playbookRead: null,
      keyFigures: [],
      note: amount.note && amount.usd == null ? `Monto en otra moneda: ${amount.note} (convertir con BCE).` : '',
    },
    missing,
  };
}
