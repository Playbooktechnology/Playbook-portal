// Reviews a proposal (cumple_criterio: null) field by field and approves it
// (Fase 6). With --rechazar it is kept but marked cumple_criterio: false.
//
//   npm run marcador:aprobar -- <id>
//   npm run marcador:aprobar -- <id> --rechazar
//   npm run marcador:aprobar                     (lista las propuestas)
import { abrirConsola, fallar, fechaCorta, guardarMarcador, leerMarcador, mostrar, revisar } from './marcador/comun';
import { frasesConMonto } from '../lib/marcador-propuesta';
import { leerNota } from './marcador/comun';

async function main() {
  const id = process.argv.slice(2).find(a => !a.startsWith('--'));
  const acuerdos = leerMarcador();
  const propuestas = acuerdos.filter(a => a.cumple_criterio === null);
  if (!id) {
    if (!propuestas.length) return console.log('No hay propuestas pendientes.');
    console.log(`\n${propuestas.length} propuestas pendientes (no se muestran en el sitio):\n`);
    for (const p of propuestas) console.log(`  ${p.id}\n    ${fechaCorta(p.fecha)} · ${p.titulo} · ${p.url ?? ''}`);
    return console.log('\nPara revisar una: npm run marcador:aprobar -- <id>');
  }
  const target = acuerdos.find(a => a.id === id);
  if (!target) fallar(`No hay ningún acuerdo con el id ${id}.`);

  if (process.argv.includes('--rechazar')) {
    guardarMarcador(acuerdos.map(a => (a.id === id ? { ...a, cumple_criterio: false } : a)));
    return console.log(`✓ ${target.titulo}: cumple_criterio: false (se conserva, no se muestra).`);
  }

  const frases = target.url ? frasesConMonto(((await leerNota(target.url)).bodyHtml ?? '').replace(/<[^>]+>/g, '\n')) : [];
  const { preguntar, cerrar } = abrirConsola();
  try {
    const revisado = await revisar(preguntar, { ...target, cumple_criterio: true }, frases);
    mostrar(revisado);
    const ok = (await preguntar('¿Guardar? (s/n) [n]: ')).trim().toLowerCase();
    if (ok !== 's') return console.log('No se guardó nada.');
    guardarMarcador(acuerdos.map(a => (a.id === id ? revisado : a)));
    console.log(`✓ Guardado: ${revisado.id}${revisado.cumple_criterio ? ' (aprobado: ya se muestra)' : ''}.`);
  } finally {
    cerrar();
  }
}

main().catch(err => fallar(String(err?.message ?? err)));
