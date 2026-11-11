import { proposeDealDraft, type DraftSource } from './deal-draft';
import type { Acuerdo, Alcance, Tipo } from './marcador-schema';
import { PAIS_LABEL } from './marcador';

// Turns a published note into a PROPOSED Marcador v2 record (Fase 6,
// 2026-11-11). Pure, no network: the extraction is lib/deal-draft.ts's (the
// same that fills the publish-time queue), mapped to the v2 fields, plus the
// note's sentences that carry a money figure so the editor picks the amount
// and its source phrase instead of trusting a scrape. Used by
// scripts/marcador-add.ts and scripts/marcador-pendientes.ts. Nothing here is
// final: every field is shown to the editor before it is written.

const LEGACY_TO_TIPO: Record<string, Tipo> = {
  patrocinio: 'patrocinio',
  derechos: 'derechos',
  retail: 'retail',
  inversion: 'propiedad',
  estadios: 'infraestructura',
};

const PAIS_POR_NOMBRE: Record<string, string> = Object.fromEntries(
  Object.entries(PAIS_LABEL).map(([code, name]) => [name.toLowerCase(), code]),
);
PAIS_POR_NOMBRE['ee.uu.'] = 'US';
PAIS_POR_NOMBRE['eeuu'] = 'US';
PAIS_POR_NOMBRE['inglaterra'] = 'GB';

const LATAM = new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE']);
const EUROPA = new Set(['AT', 'BE', 'CH', 'DE', 'DK', 'ES', 'FR', 'GB', 'IE', 'IT', 'NL', 'NO', 'PL', 'PT', 'SE', 'TR']);

/** Scope from the countries involved (the editor confirms). */
export function alcanceDesdePaises(pais: string[]): Alcance {
  if (pais.includes('MX')) return 'mexico';
  if (pais.some(p => LATAM.has(p))) return 'latam';
  if (pais.length === 1 && pais[0] === 'US') return 'eeuu';
  if (pais.length && pais.every(p => EUROPA.has(p))) return 'europa';
  return 'global';
}

const DEPORTE_SLUG: Record<string, string> = {
  'Fútbol': 'futbol',
  'Fútbol americano': 'futbol-americano',
  'Básquetbol': 'basquetbol',
  'Béisbol': 'beisbol',
  Tenis: 'tenis',
  Automovilismo: 'automovilismo',
  Golf: 'golf',
  Boxeo: 'boxeo',
  Multideporte: 'multideporte',
};

export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function idPara(fecha: string, titulo: string): string {
  return `${fecha}-${slug(titulo).slice(0, 60).replace(/-+$/, '')}`;
}

// ----------------------------------------------------------------- Money

export const MONEDAS = { 'US$': 'USD', USD: 'USD', '€': 'EUR', '£': 'GBP', R$: 'BRL', MX$: 'MXN', $: 'USD' } as const;
const MONEY = /(US\$|USD\s?|€|£|R\$|MX\$|\$)\s?(\d[\d.,]*)\s*(mil\s+millones|millones|billones|mdd|mdp|M\b|B\b|bn\b)?/i;

/** Every sentence of the note that carries a money figure, in order: the editor picks the source of the amount. */
export function frasesConMonto(texto: string): string[] {
  return texto
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length <= 400 && MONEY.test(s));
}

/** First money figure of a sentence, in millions of its currency: "€1,650 millones" → { valor: 1650, moneda: 'EUR' }. */
export function cifraDeFrase(frase: string): { valor: number; moneda: string } | null {
  const m = MONEY.exec(frase);
  if (!m) return null;
  const symbol = m[1].trim() as keyof typeof MONEDAS;
  const moneda = MONEDAS[symbol] ?? 'USD';
  // es-MX copy: "1,650" thousands with comma; "4.000" (Brazilian copy) thousands with dot; "1.1" decimal.
  let raw = m[2].replace(/[.,]$/, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replace(/\./g, '');
  const num = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(num)) return null;
  const scale = (m[3] ?? '').toLowerCase().replace(/\s+/g, ' ');
  let millones: number;
  if (scale === 'mil millones' || scale === 'b' || scale === 'bn' || scale === 'billones') millones = num * 1000;
  else if (scale === 'millones' || scale === 'mdd' || scale === 'mdp' || scale === 'm') millones = num;
  else millones = num / 1e6;
  return { valor: Math.round(millones * 1000) / 1000, moneda };
}

// ----------------------------------------------------------------- Proposal

export type NotaFuente = DraftSource & { url: string };

/** A proposed record (every field editable) plus the note's money sentences. */
export function proponerAcuerdo(nota: NotaFuente): { acuerdo: Acuerdo; frases: string[]; faltan: string[] } {
  const { fields, missing } = proposeDealDraft(nota);
  const pais = fields.country ? [PAIS_POR_NOMBRE[fields.country.toLowerCase()]].filter(Boolean) : [];
  const brand = fields.brand || '';
  const counterparty = fields.counterparty || '';
  const titulo = brand && counterparty ? `${brand} × ${counterparty}` : nota.title;
  const texto = (nota.bodyHtml || nota.teaser || '').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  const acuerdo: Acuerdo = {
    id: idPara(nota.date, titulo),
    fecha: nota.date,
    titulo,
    partes: [brand, counterparty].filter(Boolean).length ? [brand, counterparty].filter(Boolean) : [titulo],
    tipo: LEGACY_TO_TIPO[fields.type ?? ''] ?? 'patrocinio',
    alcance: alcanceDesdePaises(pais),
    pais,
    deporte: DEPORTE_SLUG[fields.sport ?? ''] ?? 'multideporte',
    duracion: fields.duration || null,
    monto_usd_m: null,
    monto_tipo: 'nr',
    estatus: fields.status === 'confirmado' ? 'confirmado' : 'reportado',
    dato_hero: null,
    resumen: (nota.excerpt || nota.title).trim(),
    lectura: null,
    lectura_borrador: null,
    destacado_semana: false,
    cumple_criterio: null,
    url: nota.url,
    fuente_monto: null,
  };
  const faltan = missing.filter(m => m !== 'date' && m !== 'amount');
  return { acuerdo, frases: frasesConMonto(texto), faltan };
}
