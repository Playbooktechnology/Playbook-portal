import raw from '../../data/marcador.json';
import { validateMarcador, type Acuerdo } from '../marcador-schema';
import type { Deal } from '../deals';

// El Marcador de Negocios reads data/marcador.json since 2026-11-11 (it
// replaced the `deals` table, which had sat untouched since 23 sep). The file
// is validated before every build (scripts/validate-marcador.ts); validating
// again here costs nothing and means a bad record can never render, even in
// `next dev`.
const { acuerdos, errores } = validateMarcador(raw);
if (errores.length) {
  throw new Error(`data/marcador.json no es válido:\n${errores.map(e => `  - ${e}`).join('\n')}`);
}

/** Every record in the file, including proposals and excluded ones. */
export function getAcuerdos(): Acuerdo[] {
  return acuerdos;
}

/** What the public site shows and counts: only records that meet the entry criterion. */
export function getAcuerdosPublicos(): Acuerdo[] {
  return acuerdos.filter(a => a.cumple_criterio === true);
}

// ------------------------------------------------ v1 shape (until Fases 4-5)
// The rail and /marcador still render the v1 `Deal` shape; the v2 widget and
// page will read Acuerdo directly. Until then each record is mapped here, with
// no field invented: anything v2 doesn't carry maps to an empty value.

const LEGACY_TYPE: Record<Acuerdo['tipo'], string> = {
  patrocinio: 'patrocinio',
  derechos: 'derechos',
  retail: 'retail',
  propiedad: 'inversion',
  infraestructura: 'estadios',
};

const COUNTRY: Record<string, string> = {
  MX: 'México', US: 'Estados Unidos', CA: 'Canadá', ES: 'España', FR: 'Francia', GB: 'Reino Unido', IT: 'Italia',
  PT: 'Portugal', DE: 'Alemania', BR: 'Brasil', AR: 'Argentina', CO: 'Colombia', VE: 'Venezuela', CU: 'Cuba',
  AU: 'Australia', RW: 'Ruanda', QA: 'Catar', SA: 'Arabia Saudita', NL: 'Países Bajos', CH: 'Suiza',
};

const SCOPE: Record<Acuerdo['alcance'], string> = {
  mexico: 'México', latam: 'Latinoamérica', eeuu: 'Estados Unidos', europa: 'Europa', global: 'Global',
};

const SPORT: Record<string, string> = {
  futbol: 'Fútbol', 'futbol-americano': 'Fútbol americano', basquetbol: 'Básquetbol', beisbol: 'Béisbol',
  tenis: 'Tenis', automovilismo: 'Automovilismo', golf: 'Golf', boxeo: 'Boxeo', lucha: 'Lucha',
  atletismo: 'Atletismo', fitness: 'Fitness', multideporte: 'Multideporte', apuestas: 'Apuestas',
};

export function toLegacyDeal(a: Acuerdo): Deal {
  const [brand, ...rest] = a.titulo.split(' × ');
  const stamp = `${a.fecha}T12:00:00.000Z`;
  return {
    id: a.id,
    date: a.fecha,
    brand,
    counterparty: rest.join(' × '),
    type: LEGACY_TYPE[a.tipo],
    country: a.pais.length === 1 ? (COUNTRY[a.pais[0]] ?? a.pais[0]) : SCOPE[a.alcance],
    sport: SPORT[a.deporte] ?? a.deporte,
    duration: a.duracion ?? '',
    amountUsd: a.monto_usd_m === null ? null : Math.round(a.monto_usd_m * 1e6),
    amountDisclosed: a.monto_tipo === 'revelado',
    status: a.estatus === 'reportado' ? 'reportado' : 'confirmado',
    summary: a.resumen,
    articleUrl: a.url ?? '',
    featured: a.destacado_semana,
    // Only an approved reading is ever shown; lectura_borrador never leaves the file.
    playbookRead: a.lectura,
    keyFigures: a.dato_hero ? [{ value: a.dato_hero.valor, label: a.dato_hero.etiqueta }] : [],
    createdAt: stamp,
    updatedAt: stamp,
  };
}
