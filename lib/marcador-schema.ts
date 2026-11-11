import { z } from 'zod';

// El Marcador de Negocios v2 (2026-11-11): the shape of every record in
// data/marcador.json, the module's single source of truth. One object per
// deal; field names are Spanish because the editor reads and edits this file
// (and its validation messages) directly.
//
// scripts/validate-marcador.ts runs this before every build, so a malformed
// record stops the deploy with a message naming the record and the field,
// instead of reaching the homepage.

export const TIPOS = ['patrocinio', 'derechos', 'propiedad', 'retail', 'infraestructura'] as const;
export const ALCANCES = ['mexico', 'latam', 'eeuu', 'europa', 'global'] as const;
export const MONTO_TIPOS = ['revelado', 'estimado', 'reportado', 'nr'] as const;
export const ESTATUS = ['anunciado', 'reportado', 'confirmado', 'cerrado'] as const;

export type Tipo = (typeof TIPOS)[number];
export type Alcance = (typeof ALCANCES)[number];
export type MontoTipo = (typeof MONTO_TIPOS)[number];
export type Estatus = (typeof ESTATUS)[number];

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'usa AAAA-MM-DD')
  .refine(s => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), 'no es una fecha real');

function opciones<T extends readonly [string, ...string[]]>(valores: T) {
  return z.enum(valores, { errorMap: () => ({ message: `valor no permitido; usa uno de: ${valores.join(' | ')}` }) });
}

const texto = z.string().trim().min(1, 'no puede ir vacío');

/** Words in a string, for the featured card's 35-word limit. */
export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export const RESUMEN_MAX_PALABRAS = 35;

export const acuerdoSchema = z
  .object({
    id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/, 'formato AAAA-MM-DD-slug en minúsculas'),
    fecha,
    titulo: texto,
    partes: z.array(texto).min(1, 'al menos una parte'),
    tipo: opciones(TIPOS),
    alcance: opciones(ALCANCES),
    pais: z.array(z.string().regex(/^[A-Z]{2}$/, 'código ISO de dos letras, en mayúsculas')),
    deporte: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/, 'en minúsculas, sin acentos, con guiones'),
    duracion: texto.nullable(),
    monto_usd_m: z.number().nonnegative('no puede ser negativo').nullable(),
    monto_tipo: opciones(MONTO_TIPOS),
    estatus: opciones(ESTATUS),
    dato_hero: z.object({ valor: texto, etiqueta: texto }).strict().nullable(),
    resumen: texto,
    lectura: texto.nullable(),
    lectura_borrador: texto.nullable(),
    destacado_semana: z.boolean(),
    // null = proposal waiting for the editor's decision; only `true` is shown and counted.
    cumple_criterio: z.boolean().nullable(),
    url: z.string().url('URL completa (https://…)').nullable(),
    fuente_monto: texto.nullable(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (!a.id.startsWith(`${a.fecha}-`)) issue('id', `debe empezar con la fecha del registro (${a.fecha}-…)`);
    if (a.monto_tipo === 'nr' && a.monto_usd_m !== null) issue('monto_usd_m', 'monto_tipo es "nr": el monto va en null');
    if (a.monto_tipo !== 'nr' && a.monto_usd_m === null) issue('monto_tipo', 'sin monto, monto_tipo debe ser "nr"');
    if (a.monto_usd_m !== null && !a.fuente_monto) issue('fuente_monto', 'todo monto necesita su fuente (nota y/o comunicado)');
    if (a.dato_hero && /^n\/?r$/i.test(a.dato_hero.valor.trim())) issue('dato_hero', 'nunca "N/R" como cifra principal: usa otro dato o null');
    if (a.destacado_semana && a.cumple_criterio !== true) issue('destacado_semana', 'solo un acuerdo con cumple_criterio: true puede ser destacado');
    if (a.destacado_semana && wordCount(a.resumen) > RESUMEN_MAX_PALABRAS) {
      issue('resumen', `el destacado lleva máximo ${RESUMEN_MAX_PALABRAS} palabras (tiene ${wordCount(a.resumen)})`);
    }
  });

export type Acuerdo = z.infer<typeof acuerdoSchema>;

/**
 * Validates the whole file: every record, unique ids, and at most one
 * featured deal per week. Returns human-readable errors, one per problem,
 * each naming the record — empty when the file is valid.
 */
export function validateMarcador(data: unknown): { acuerdos: Acuerdo[]; errores: string[] } {
  const errores: string[] = [];
  if (!Array.isArray(data)) return { acuerdos: [], errores: ['el archivo debe ser un arreglo de acuerdos ([ … ])'] };
  const acuerdos: Acuerdo[] = [];
  data.forEach((raw, i) => {
    const label = `registro ${i + 1}${raw && typeof raw === 'object' && 'id' in raw ? ` (${String((raw as { id: unknown }).id)})` : ''}`;
    const parsed = acuerdoSchema.safeParse(raw);
    if (parsed.success) acuerdos.push(parsed.data);
    else for (const e of parsed.error.issues) errores.push(`${label} · ${e.path.join('.') || '(registro)'}: ${e.message}`);
  });
  const seen = new Set<string>();
  for (const a of acuerdos) {
    if (seen.has(a.id)) errores.push(`id repetido: ${a.id}`);
    seen.add(a.id);
  }
  const featuredByWeek = new Map<string, string[]>();
  for (const a of acuerdos.filter(x => x.destacado_semana)) {
    const key = isoWeekKey(a.fecha);
    featuredByWeek.set(key, [...(featuredByWeek.get(key) ?? []), a.id]);
  }
  for (const [week, ids] of featuredByWeek) {
    if (ids.length > 1) errores.push(`más de un destacado en la semana ${week}: ${ids.join(', ')}`);
  }
  return { acuerdos, errores };
}

function isoWeekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = d.getUTCDay() || 7;
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + 4 - dow);
  const year = thursday.getUTCFullYear();
  const week = Math.ceil(((thursday.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-S${String(week).padStart(2, '0')}`;
}
