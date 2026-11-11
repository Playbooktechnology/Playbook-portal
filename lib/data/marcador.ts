import raw from '../../data/marcador.json';
import { validateMarcador, type Acuerdo } from '../marcador-schema';

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
