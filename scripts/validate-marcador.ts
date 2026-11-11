// Validates data/marcador.json (El Marcador de Negocios) against
// lib/marcador-schema.ts. Runs before every build; a bad record fails the
// deploy with one line per problem, naming the record and the field.
//
//   npx tsx scripts/validate-marcador.ts [ruta]   (default: data/marcador.json)
import { readFileSync } from 'node:fs';
import { validateMarcador } from '../lib/marcador-schema';

const path = process.argv[2] ?? 'data/marcador.json';

let data: unknown;
try {
  data = JSON.parse(readFileSync(path, 'utf8'));
} catch (err) {
  console.error(`\n✗ El Marcador: no se pudo leer ${path}\n  ${(err as Error).message}\n`);
  process.exit(1);
}

const { acuerdos, errores } = validateMarcador(data);
if (errores.length) {
  console.error(`\n✗ El Marcador: ${errores.length} ${errores.length === 1 ? 'problema' : 'problemas'} en ${path}\n`);
  for (const e of errores) console.error(`  - ${e}`);
  console.error('\nCorrige el archivo y vuelve a intentar. Los valores permitidos están en lib/marcador-schema.ts.\n');
  process.exit(1);
}
console.log(`✓ El Marcador: ${acuerdos.length} acuerdos válidos en ${path}`);
