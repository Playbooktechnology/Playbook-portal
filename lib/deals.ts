// Pure logic for El Marcador de Negocios (homepage rail module + /marcador).
// No database access here, so the client-side table on /marcador can import
// the same labels, filters and formatting the server components use.

export const DEAL_TYPES = [
  { key: 'patrocinio', label: 'Patrocinio' },
  { key: 'derechos', label: 'Derechos de transmisión' },
  { key: 'retail', label: 'Retail y licencias' },
  { key: 'inversion', label: 'Inversión y propiedad' },
  { key: 'estadios', label: 'Estadios e infraestructura' },
] as const;

export type DealType = (typeof DEAL_TYPES)[number]['key'];
export type DealStatus = 'confirmado' | 'reportado';

export const DEAL_TYPE_LABEL: Record<string, string> = Object.fromEntries(DEAL_TYPES.map(t => [t.key, t.label]));
export const DEAL_STATUS_LABEL: Record<DealStatus, string> = { confirmado: 'Confirmado', reportado: 'Reportado' };

export type KeyFigure = { value: string; label: string };

// Plain, serializable shape: crosses unstable_cache (JSON) and the RSC
// boundary into client components without Date objects.
export type Deal = {
  id: string;
  date: string;
  brand: string;
  counterparty: string;
  type: string;
  country: string;
  sport: string;
  duration: string;
  amountUsd: number | null;
  amountDisclosed: boolean;
  status: string;
  summary: string;
  articleUrl: string;
  featured: boolean;
  playbookRead: string | null;
  keyFigures: KeyFigure[];
  createdAt: string;
};

export type DealInput = Omit<Deal, 'id' | 'createdAt'>;

// Single write-side gate for both the /admin tab and scripts/upsert-deals.ts:
// trims text, checks the enum-like columns against their key lists, and
// rejects amounts that aren't whole non-negative dollars. Throws a message
// an editor can act on.
export function normalizeDealInput(raw: Partial<DealInput>): DealInput {
  const text = (v: unknown) => String(v ?? '').trim();
  const date = text(raw.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    throw new Error(`Fecha inválida: "${date}" (usa AAAA-MM-DD).`);
  }
  const brand = text(raw.brand);
  const counterparty = text(raw.counterparty);
  if (!brand || !counterparty) throw new Error('Marca y contraparte son obligatorias.');
  const type = text(raw.type);
  if (!DEAL_TYPES.some(t => t.key === type)) throw new Error(`Tipo desconocido: "${type}".`);
  const status = text(raw.status) || 'reportado';
  if (status !== 'confirmado' && status !== 'reportado') throw new Error(`Estatus desconocido: "${status}".`);
  const amount = raw.amountUsd;
  if (amount != null && (!Number.isInteger(amount) || amount < 0)) {
    throw new Error('El monto va en dólares enteros, sin decimales ni signo negativo.');
  }
  const keyFigures = (raw.keyFigures ?? [])
    .map(f => ({ value: text(f?.value), label: text(f?.label) }))
    .filter(f => f.value && f.label)
    .slice(0, 3);
  const playbookRead = text(raw.playbookRead);
  return {
    date,
    brand,
    counterparty,
    type,
    country: text(raw.country),
    sport: text(raw.sport),
    duration: text(raw.duration),
    amountUsd: amount ?? null,
    amountDisclosed: !!raw.amountDisclosed && amount != null,
    status,
    summary: text(raw.summary),
    articleUrl: text(raw.articleUrl),
    featured: !!raw.featured,
    playbookRead: playbookRead || null,
    keyFigures,
  };
}

// ----------------------------------------------------------------- Dates

const MX_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function todayInMexico(now: Date = new Date()): string {
  return MX_DATE.format(now);
}

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

// ISO 8601 week: Monday-Sunday, week 1 holds the year's first Thursday.
export function isoWeek(date: string): { year: number; week: number; start: string; end: string } {
  const d = toUtc(date);
  const dow = d.getUTCDay() || 7;
  const start = addDays(date, 1 - dow);
  const thursday = toUtc(addDays(date, 4 - dow));
  const year = thursday.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.ceil(((thursday.getTime() - jan1) / 86400000 + 1) / 7);
  return { year, week, start, end: addDays(start, 6) };
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function shortDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

// ----------------------------------------------------------------- Money

function groupThousands(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

// Millions, with one decimal only below 100M (US$46.6M, US$138M, US$13,441M).
function millions(amount: number): string {
  const m = amount / 1e6;
  return groupThousands(m, m < 100 ? 1 : 0);
}

// Compact form for narrow columns: US$250M, US$1,200M, US$800K.
export function formatUsdShort(amount: number): string {
  if (amount >= 1e6) return `US$${millions(amount)}M`;
  if (amount >= 1e3) return `US$${groupThousands(amount / 1e3, 0)}K`;
  return `US$${groupThousands(amount)}`;
}

// Long form for headline figures, in the site's own register:
// "US$6,000 millones".
export function formatUsdLong(amount: number): string {
  if (amount >= 1e6) return `US$${millions(amount)} millones`;
  return `US$${groupThousands(amount)}`;
}

// "Revelado" means one of the parties announced the figure (a release, a
// regulatory filing). A figure only the press has published is stored too,
// but shown as an estimate (~) and never added to the confirmed total.
export function hasKnownAmount(deal: Deal): deal is Deal & { amountUsd: number } {
  return deal.amountDisclosed && deal.amountUsd != null;
}

export function dealAmountLabel(deal: Deal): string {
  if (deal.amountUsd == null) return 'N/R';
  return deal.amountDisclosed ? formatUsdShort(deal.amountUsd) : `~${formatUsdShort(deal.amountUsd)}`;
}

// Only confirmed deals with a disclosed figure add to the year's total.
export function countsTowardTotal(deal: Deal): boolean {
  return deal.status === 'confirmado' && hasKnownAmount(deal);
}

// ----------------------------------------------------------------- Selection

function byDateDesc(a: Deal, b: Deal): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

function byAmountDesc(a: Deal, b: Deal): number {
  return (b.amountUsd ?? -1) - (a.amountUsd ?? -1) || byDateDesc(a, b);
}

export function inRange(deal: Deal, start: string, end: string): boolean {
  return deal.date >= start && deal.date <= end;
}

// The featured card: this week's flagged deal if there is one; otherwise the
// most recent flagged deal of any week, so the rail never goes blank between
// weekly updates. With nothing flagged at all it falls back to the newest deal.
export function selectFeatured(deals: Deal[], week: { start: string; end: string }): Deal | null {
  const flagged = deals.filter(d => d.featured).sort(byDateDesc);
  return (
    flagged.find(d => inRange(d, week.start, week.end)) ?? flagged[0] ?? [...deals].sort(byDateDesc)[0] ?? null
  );
}

// "También esta semana": the week's other deals, biggest first. A week with
// no other deals shows the latest ones instead, and says so.
export function railDeals(
  deals: Deal[],
  week: { start: string; end: string },
  excludeId: string | undefined,
  limit = 3,
): { deals: Deal[]; thisWeek: boolean } {
  const others = deals.filter(d => d.id !== excludeId);
  const weekly = others.filter(d => inRange(d, week.start, week.end)).sort(byAmountDesc);
  if (weekly.length) return { deals: weekly.slice(0, limit), thisWeek: true };
  return { deals: others.sort(byDateDesc).slice(0, limit), thisWeek: false };
}

export function yearTotal(deals: Deal[], year: number): { total: number; count: number } {
  const counted = deals.filter(d => d.date.startsWith(`${year}-`) && countsTowardTotal(d));
  return { total: counted.reduce((sum, d) => sum + (d.amountUsd ?? 0), 0), count: counted.length };
}

export function yearStats(deals: Deal[], year: number) {
  const ofYear = deals.filter(d => d.date.startsWith(`${year}-`));
  const { total, count } = yearTotal(deals, year);
  return {
    total,
    countedDeals: count,
    tracked: ofYear.length,
    disclosed: ofYear.filter(hasKnownAmount).length,
    countries: new Set(ofYear.map(d => d.country).filter(Boolean)).size,
  };
}

// Ranks by any known figure, estimates included (they render with ~), since
// the biggest deals of a year are often the ones nobody announces a price for.
export function topDeals(deals: Deal[], year: number, limit = 5): Deal[] {
  return deals
    .filter(d => d.date.startsWith(`${year}-`) && d.amountUsd != null)
    .sort(byAmountDesc)
    .slice(0, limit);
}

export function countByType(deals: Deal[], year: number): { key: string; label: string; count: number }[] {
  const ofYear = deals.filter(d => d.date.startsWith(`${year}-`));
  return DEAL_TYPES.map(t => ({ key: t.key, label: t.label, count: ofYear.filter(d => d.type === t.key).length }));
}

// Three figures for the featured card. Editor-declared ones win; the gaps
// are filled from the deal's own fields so the card always has three.
export function featuredFigures(deal: Deal): KeyFigure[] {
  const declared = deal.keyFigures.filter(f => f.value && f.label).slice(0, 3);
  const derived: KeyFigure[] = [
    { value: dealAmountLabel(deal), label: 'monto' },
    ...(deal.duration ? [{ value: deal.duration, label: 'duración' }] : []),
    { value: deal.date.slice(0, 4), label: 'anuncio' },
    ...(deal.country ? [{ value: deal.country, label: 'país' }] : []),
  ];
  const used = new Set(declared.map(f => f.label.toLowerCase()));
  for (const f of derived) {
    if (declared.length >= 3) break;
    if (!used.has(f.label)) declared.push(f);
  }
  return declared;
}

export function dealTitle(deal: Pick<Deal, 'brand' | 'counterparty'>): string {
  return `${deal.brand} × ${deal.counterparty}`;
}

// ----------------------------------------------------------------- Filters (/marcador)

export const PERIODS = [
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
  { key: '90d', label: 'Últimos 90 días' },
  { key: 'anio', label: 'Este año' },
  { key: 'todo', label: 'Todo' },
] as const;

export type PeriodKey = (typeof PERIODS)[number]['key'];

export function periodStart(period: PeriodKey, today: string): string {
  switch (period) {
    case 'semana':
      return isoWeek(today).start;
    case 'mes':
      return `${today.slice(0, 7)}-01`;
    case '90d':
      return addDays(today, -89);
    case 'anio':
      return `${today.slice(0, 4)}-01-01`;
    default:
      return '';
  }
}

export type DealFilters = { type: string; country: string; sport: string; period: PeriodKey; query: string };

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function filterDeals(deals: Deal[], f: DealFilters, today: string): Deal[] {
  const start = periodStart(f.period, today);
  const q = fold(f.query.trim());
  return deals.filter(
    d =>
      (!f.type || d.type === f.type) &&
      (!f.country || d.country === f.country) &&
      (!f.sport || d.sport === f.sport) &&
      (!start || d.date >= start) &&
      (!q || fold(`${d.brand} ${d.counterparty} ${d.summary} ${d.country} ${d.sport}`).includes(q)),
  );
}
