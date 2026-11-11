import type { Acuerdo, Alcance, Tipo } from './marcador-schema';
import { isoWeek, periodStart, type PeriodKey } from './deals';

// Pure logic for El Marcador v2 (Fase 4, 2026-11-11): the homepage widget
// reads data/marcador.json records (lib/data/marcador.ts) and decides
// everything here — which week, the score, the featured deal, the rows —
// so every rule can be tested on a simulated date (scripts/test-frescura.ts).
// Callers pass only public records (cumple_criterio: true).

export const ALCANCE_LABEL: Record<Alcance, string> = {
  mexico: 'México',
  latam: 'Latam',
  eeuu: 'EE. UU.',
  europa: 'Europa',
  global: 'Global',
};

export const TIPO_LABEL: Record<Tipo, string> = {
  patrocinio: 'Patrocinio',
  derechos: 'Derechos',
  propiedad: 'Propiedad',
  retail: 'Retail',
  infraestructura: 'Infraestructura',
};

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "martes 10 nov" */
export function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "10 nov 2026" */
export function dateLabel(date: string): string {
  const [y, m, d] = date.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** Millions of dollars as the widget prints them: US$22,000M, US$561M, US$46.6M. */
export function formatMontoUsdM(m: number): string {
  const digits = m < 100 && !Number.isInteger(m) ? 1 : 0;
  return `US$${m.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}M`;
}

/** Right column of a row: the amount and, when it isn't disclosed, how we know it. */
export function montoCell(a: Acuerdo): { valor: string; nota: string | null } {
  if (a.monto_usd_m === null) return { valor: 'N/R', nota: null };
  return { valor: formatMontoUsdM(a.monto_usd_m), nota: a.monto_tipo === 'revelado' ? null : a.monto_tipo };
}

/**
 * The featured card's big figure: the editor's dato_hero, else the amount.
 * Never "N/R" — with neither, the card simply has no figure.
 */
export function heroFigure(a: Acuerdo): { valor: string; etiqueta: string } | null {
  if (a.dato_hero) return a.dato_hero;
  if (a.monto_usd_m !== null) {
    return { valor: formatMontoUsdM(a.monto_usd_m), etiqueta: a.monto_tipo === 'revelado' ? 'monto' : `monto ${a.monto_tipo}` };
  }
  return null;
}

export const RESUMEN_PALABRAS = 35;

/** At most 35 words; a longer summary is cut at a word boundary with "…". */
export function resumenCorto(text: string, max = RESUMEN_PALABRAS): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  return `${words.slice(0, max).join(' ').replace(/[,;:.]$/, '')}…`;
}

function byDateDesc(a: Acuerdo, b: Acuerdo): number {
  return b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id);
}

const ALCANCE_RANK: Record<Alcance, number> = { mexico: 0, latam: 1, eeuu: 2, europa: 2, global: 2 };

function revealed(a: Acuerdo): number {
  return a.monto_tipo === 'revelado' && a.monto_usd_m !== null ? a.monto_usd_m : -1;
}

export type MarcadorWeek = { week: number; year: number; start: string; end: string; acuerdos: Acuerdo[] };

/**
 * The most recent Monday-Sunday week (CDMX dates) with at least one deal on
 * or before `today`. A week with nothing loaded yet — a Monday morning —
 * shows the last week that had activity, never an empty score.
 */
export function activeWeek(acuerdos: Acuerdo[], today: string): MarcadorWeek | null {
  const latest = acuerdos.filter(a => a.fecha <= today).sort(byDateDesc)[0];
  if (!latest) return null;
  const w = isoWeek(latest.fecha);
  return { week: w.week, year: w.year, start: w.start, end: w.end, acuerdos: acuerdos.filter(a => a.fecha >= w.start && a.fecha <= w.end) };
}

/** Score cells: deals that week · in Mexico · reported (not confirmed by the parties). */
export function weekScore(week: MarcadorWeek): { acuerdos: number; mexico: number; reportados: number } {
  return {
    acuerdos: week.acuerdos.length,
    mexico: week.acuerdos.filter(a => a.alcance === 'mexico').length,
    reportados: week.acuerdos.filter(a => a.estatus === 'reportado').length,
  };
}

/**
 * The week's featured deal: the one flagged destacado_semana; otherwise
 * Mexico first, then Latam, then the largest disclosed amount (most recent
 * breaks a tie).
 */
export function pickFeatured(week: MarcadorWeek): Acuerdo | null {
  const flagged = week.acuerdos.filter(a => a.destacado_semana).sort(byDateDesc)[0];
  if (flagged) return flagged;
  return (
    [...week.acuerdos].sort(
      (a, b) => ALCANCE_RANK[a.alcance] - ALCANCE_RANK[b.alcance] || revealed(b) - revealed(a) || byDateDesc(a, b),
    )[0] ?? null
  );
}

/**
 * The four rows under the card: the week's other deals (Mexico first, then
 * the biggest amounts), topped up with the most recent earlier deals when the
 * week has fewer than four.
 */
export function rowDeals(acuerdos: Acuerdo[], week: MarcadorWeek, featuredId: string | null, limit = 4): Acuerdo[] {
  const amount = (a: Acuerdo) => a.monto_usd_m ?? -1;
  const inWeek = week.acuerdos
    .filter(a => a.id !== featuredId)
    .sort((a, b) => Number(b.alcance === 'mexico') - Number(a.alcance === 'mexico') || amount(b) - amount(a) || byDateDesc(a, b));
  const earlier = acuerdos.filter(a => a.fecha < week.start).sort(byDateDesc);
  return [...inWeek, ...earlier].slice(0, limit);
}

/** Short description under a row's name: type, plus term or status when there is one. */
export function rowDescription(a: Acuerdo): string {
  const extra = a.estatus === 'reportado' || a.estatus === 'anunciado' ? a.estatus : a.duracion;
  return extra ? `${TIPO_LABEL[a.tipo]} · ${extra}` : TIPO_LABEL[a.tipo];
}

export function registeredInYear(acuerdos: Acuerdo[], year: string): number {
  return acuerdos.filter(a => a.fecha.startsWith(`${year}-`)).length;
}

/** The newest deal date in the file: what "Actualizado" reports. */
export function lastUpdated(acuerdos: Acuerdo[]): string | null {
  return acuerdos.reduce<string | null>((max, a) => (max === null || a.fecha > max ? a.fecha : max), null);
}

/** Links to our own site render as paths, so they open in the same tab (DealLink sends absolute URLs to a new one). */
export function siteHref(url: string | null): string {
  if (!url) return '/marcador';
  const m = /^https?:\/\/(?:www\.)?playbook\.la(\/.*)?$/i.exec(url);
  return m ? m[1] || '/' : url;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

export const PAIS_LABEL: Record<string, string> = {
  MX: 'México', US: 'Estados Unidos', CA: 'Canadá', ES: 'España', FR: 'Francia', GB: 'Reino Unido', IT: 'Italia',
  PT: 'Portugal', DE: 'Alemania', BR: 'Brasil', AR: 'Argentina', CO: 'Colombia', VE: 'Venezuela', CU: 'Cuba',
  AU: 'Australia', RW: 'Ruanda', QA: 'Catar', SA: 'Arabia Saudita', NL: 'Países Bajos', CH: 'Suiza',
};

export const DEPORTE_LABEL: Record<string, string> = {
  futbol: 'Fútbol', 'futbol-americano': 'Fútbol americano', basquetbol: 'Básquetbol', beisbol: 'Béisbol',
  tenis: 'Tenis', automovilismo: 'Automovilismo', golf: 'Golf', boxeo: 'Boxeo', lucha: 'Lucha',
  atletismo: 'Atletismo', fitness: 'Fitness', multideporte: 'Multideporte', apuestas: 'Apuestas',
};

export const ESTATUS_LABEL: Record<Acuerdo['estatus'], string> = {
  anunciado: 'Anunciado',
  reportado: 'Reportado',
  confirmado: 'Confirmado',
  cerrado: 'Cerrado',
};

const REGION_NAMES = new Intl.DisplayNames(['es'], { type: 'region' });

/** "México", "Ghana": the curated name when there is one, else the standard Spanish region name. */
export function nombrePais(code: string): string {
  return PAIS_LABEL[code] ?? REGION_NAMES.of(code) ?? code;
}

/** Country cell: up to three names; a wider deal (Nestlé × NBA: 20 markets) reads "20 países". */
export function paisLabel(a: Acuerdo): string {
  if (!a.pais.length) return ALCANCE_LABEL[a.alcance];
  if (a.pais.length > 3) return `${a.pais.length} países`;
  return a.pais.map(nombrePais).join(', ');
}

// ----------------------------------------------------------------- /marcador (Fase 5)

/** The year's headline figures. Only disclosed amounts are added up. */
export function yearKpis(acuerdos: Acuerdo[], year: string) {
  const ofYear = acuerdos.filter(a => a.fecha.startsWith(`${year}-`));
  const disclosed = ofYear.filter(a => a.monto_tipo === 'revelado' && a.monto_usd_m !== null);
  return {
    registrados: ofYear.length,
    conMonto: disclosed.length,
    sumaUsdM: disclosed.reduce((sum, a) => sum + (a.monto_usd_m ?? 0), 0),
    paises: new Set(ofYear.flatMap(a => a.pais)).size,
  };
}

/** Top deals of the year by any known amount; reported/estimated ones keep their label. */
export function topAcuerdos(acuerdos: Acuerdo[], year: string, limit = 5): Acuerdo[] {
  return acuerdos
    .filter(a => a.fecha.startsWith(`${year}-`) && a.monto_usd_m !== null)
    .sort((a, b) => (b.monto_usd_m ?? 0) - (a.monto_usd_m ?? 0) || byDateDesc(a, b))
    .slice(0, limit);
}

export function countByTipo(acuerdos: Acuerdo[], year: string): { key: Tipo; label: string; count: number }[] {
  const ofYear = acuerdos.filter(a => a.fecha.startsWith(`${year}-`));
  return (Object.keys(TIPO_LABEL) as Tipo[]).map(key => ({ key, label: TIPO_LABEL[key], count: ofYear.filter(a => a.tipo === key).length }));
}

export type MarcadorFilters = {
  tipo: string;
  alcance: string;
  pais: string;
  deporte: string;
  period: PeriodKey;
  query: string;
};

export const EMPTY_FILTERS: MarcadorFilters = { tipo: '', alcance: '', pais: '', deporte: '', period: 'anio', query: '' };

function fold(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filterAcuerdos(acuerdos: Acuerdo[], f: MarcadorFilters, today: string): Acuerdo[] {
  const start = periodStart(f.period, today);
  const q = fold(f.query.trim());
  return acuerdos
    .filter(
      a =>
        (!f.tipo || a.tipo === f.tipo) &&
        (!f.alcance || a.alcance === f.alcance) &&
        (!f.pais || a.pais.includes(f.pais)) &&
        (!f.deporte || a.deporte === f.deporte) &&
        (!start || a.fecha >= start) &&
        (!q || fold(`${a.titulo} ${a.partes.join(' ')} ${a.resumen} ${paisLabel(a)} ${DEPORTE_LABEL[a.deporte] ?? a.deporte}`).includes(q)),
    )
    .sort(byDateDesc);
}
