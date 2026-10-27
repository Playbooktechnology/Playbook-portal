// Edades máximas de los módulos de portada (bloque "sitio actualizado todos
// los días", 27 oct 2026). Un solo archivo para que cambiar una regla sea
// cambiar un número aquí, no buscarlo dentro de un componente.
//
// Todas las edades se cuentan en días contra la fecha de Ciudad de México.
// Un módulo que se queda sin piezas dentro de su edad máxima NO muestra piezas
// viejas: se oculta o se sustituye, según su regla.

export const FRESHNESS = {
  /** Video: si el video largo más reciente del canal tiene más días que esto, el módulo se oculta. */
  videoMaxAgeDays: 14,

  /**
   * Expedientes / opinión (la sección de análisis de portada): solo piezas con
   * menos días que esto. Sin ninguna, el lugar lo ocupa "Más leídas".
   */
  opinionMaxAgeDays: 30,

  /** Ticker "Playbook hoy": solo notas con menos días que esto… */
  tickerMaxAgeDays: 3,
  /** …y, ya sin las notas del primer bloque, al menos esta cantidad; si no, se oculta. */
  tickerMinItems: 3,

  /** El Marcador: el destacado deja de serlo después de estos días (A7). */
  marcadorFeaturedMaxAgeDays: 14,
} as const;

const MX_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD del instante dado, en Ciudad de México. */
export function mexicoDay(at: Date = new Date()): string {
  return MX_DAY.format(at);
}

/**
 * Días de calendario (CDMX) entre una fecha y hoy: 0 = hoy, 1 = ayer.
 * Acepta YYYY-MM-DD (articles.date, deals.date) o un ISO con hora (el feed de
 * YouTube). Una fecha ilegible cuenta como infinitamente vieja: ante la duda,
 * un módulo se oculta en vez de mostrar algo que no sabemos fechar.
 */
export function ageInDays(date: string, now: Date = new Date()): number {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : Number.isNaN(Date.parse(date)) ? '' : mexicoDay(new Date(date));
  if (!day) return Infinity;
  return Math.round((Date.parse(mexicoDay(now)) - Date.parse(day)) / 86400000);
}
