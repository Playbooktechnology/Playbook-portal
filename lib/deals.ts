import { FRESHNESS } from './freshness';

// Shared, client-safe pieces of El Marcador: CDMX dates and ISO weeks, the
// period filter and the archive threshold (used by lib/marcador.ts, the v2
// logic), plus the v1 `Deal` shape that /admin's legacy Marcador tab still
// edits in the `deals` table. The public site reads data/marcador.json since
// 2026-11-11.

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
  /** Last edit (ISO). Feeds "Última actualización". */
  updatedAt: string;
};

export type DealInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>;

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

// ------------------------------------------------- Modo archivo (2026-11-11)
// The rail used to print a weekly cadence computed from TODAY's date — "Sem.
// 46", "Semana sin operaciones confirmadas", "Próxima: viernes 13 nov" —
// whether or not anyone had loaded a deal. With the table untouched since 23
// sep, the week kept advancing and the promise kept moving to the next Friday,
// so the module looked alive while frozen for seven weeks. That cadence is
// gone. Instead, when the newest deal is older than
// FRESHNESS.marcadorArchiveAfterDays, the rail says plainly what it has: the
// latest deals with their real dates, no week number, no next update.
// The rule itself lives in lib/marcador.ts (isArchive), shared by the widget,
// /marcador and the daily alert (/api/salud/portada).

export const MARCADOR_ARCHIVE_AFTER_DAYS = FRESHNESS.marcadorArchiveAfterDays;

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
