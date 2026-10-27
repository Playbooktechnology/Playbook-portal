import { mexicoDay } from './freshness';

// Fechas y horas visibles (A4, 2026-10-27). Todo en America/Mexico_City, el
// reloj de la audiencia. Desde 2022 México no tiene horario de verano, así que
// el desfase de la Ciudad de México es fijo: -06:00.
const MX_OFFSET = '-06:00';
const TZ = 'America/Mexico_City';

const LONG_DATE = new Intl.DateTimeFormat('es-MX', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** "Martes 27 de octubre de 2026" — para el encabezado. */
export function headerDate(now: Date = new Date()): string {
  const s = LONG_DATE.format(now).replace(',', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TIME = new Intl.DateTimeFormat('es-MX', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

type Dated = { date: string; createdAt: Date | string | null | undefined };

// articles.date es la fecha editorial (YYYY-MM-DD, sin hora). La hora real de
// publicación solo la sabemos por created_at, y solo cuando cae el MISMO día
// de calendario que la fecha editorial: una nota fechada a mano en otro día
// (archivo migrado, fecha corregida) no tiene una hora confiable y se queda
// con la fecha sola. unstable_cache entrega las fechas como string, de ahí
// que se acepten ambas formas.
function publishedInstant(a: Dated): Date | null {
  if (!a.createdAt) return null;
  const at = new Date(a.createdAt);
  if (Number.isNaN(at.getTime())) return null;
  return mexicoDay(at) === a.date ? at : null;
}

/**
 * ISO 8601 con zona horaria, para datePublished en el marcado estructurado:
 * la hora real cuando la conocemos, si no la medianoche del día editorial.
 */
export function publishedIso(a: Dated): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date)) return undefined;
  const at = publishedInstant(a);
  if (!at) return `${a.date}T00:00:00${MX_OFFSET}`;
  const [hh, mm] = TIME.format(at).split(':');
  return `${a.date}T${hh}:${mm}:00${MX_OFFSET}`;
}

/** "27 oct 2026, 10:42" cuando hay hora; si no, la fecha formateada sola. */
export function publishedLabel(a: Dated & { dateFormatted: string }): string {
  const at = publishedInstant(a);
  return at ? `${a.dateFormatted}, ${TIME.format(at)}` : a.dateFormatted;
}

/**
 * Para "Último en Playbook": "hace 12 min" / "hace 3 h" mientras sea el mismo
 * día en la Ciudad de México; desde el día siguiente, la fecha.
 */
export function relativeLabel(a: Dated & { dateFormatted: string }, now: Date = new Date()): string {
  const at = publishedInstant(a);
  if (!at || mexicoDay(now) !== a.date) return a.dateFormatted;
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.floor(minutes / 60)} h`;
}
