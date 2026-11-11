// Adds a deal to El Marcador from a published note (Fase 6, 2026-11-11).
//
//   npm run marcador:add -- <url-de-la-nota> [--dry-run]
//
// Reads the note, proposes every field (the same extraction that feeds the
// publish-time queue, lib/marcador-propuesta.ts), shows the note's sentences
// with a money figure so you pick the amount and its literal source, converts
// with the ECB rate of the day, and writes data/marcador.json only after you
// confirm and the whole file still validates. Workflow: docs/marcador.md.
import { abrirConsola, fallar, guardarMarcador, leerMarcador, leerNota, mostrar, revisar } from './marcador/comun';
import { proponerAcuerdo } from '../lib/marcador-propuesta';

async function main() {
  const url = process.argv.slice(2).find(a => !a.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  if (!url) fallar('Uso: npm run marcador:add -- <url-de-la-nota> [--dry-run]');

  const acuerdos = leerMarcador();
  const nota = await leerNota(url);
  const repetido = acuerdos.find(a => a.url === nota.url);
  if (repetido) fallar(`Esa nota ya está en el Marcador: ${repetido.id} (${repetido.titulo}).`);

  const { acuerdo, frases, faltan } = proponerAcuerdo(nota);
  console.log(`\nNota: ${nota.title}\n${nota.url}`);
  if (faltan.length) console.log(`No pude proponer con confianza: ${faltan.join(', ')}. Revísalos.`);

  const { preguntar, cerrar } = abrirConsola();
  try {
    const final = await revisar(preguntar, acuerdo, frases);
    if (acuerdos.some(a => a.id === final.id)) fallar(`Ya existe un registro con el id ${final.id}.`);
    mostrar(final);
    if (dryRun) return console.log('--dry-run: no se escribió nada.');
    const ok = (await preguntar('¿Agregar al Marcador? (s/n) [n]: ')).trim().toLowerCase();
    if (ok !== 's') return console.log('No se agregó nada.');
    guardarMarcador([...acuerdos, final]);
    console.log(`✓ Agregado: ${final.id}${final.cumple_criterio ? '' : final.cumple_criterio === null ? ' (como propuesta: no se muestra)' : ' (cumple_criterio: false: no se muestra)'}`);
    console.log('  Siguiente paso: commit y push de data/marcador.json (ver docs/marcador.md).');
  } finally {
    cerrar();
  }
}

main().catch(err => fallar(String(err?.message ?? err)));
