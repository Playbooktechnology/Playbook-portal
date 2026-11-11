// Marks the week's featured deal and saves its approved reading (Fase 6).
//
//   npm run marcador:destacado -- <id> "<lectura aprobada>"
//   npm run marcador:destacado -- <id>            (solo destacar, sin lectura)
//
// Only one deal per week (Mon-Sun) can be featured: any other one flagged in
// the same week is unflagged. The reading is saved as `lectura` (shown on the
// site) and clears `lectura_borrador`. The file is validated before writing:
// the featured deal must meet the criterion and have at most 35 words.
import { fallar, guardarMarcador, leerMarcador } from './marcador/comun';
import { isoWeek } from '../lib/deals';

function main() {
  const [id, lectura] = process.argv.slice(2);
  if (!id) fallar('Uso: npm run marcador:destacado -- <id> "<lectura aprobada>"');
  const acuerdos = leerMarcador();
  const target = acuerdos.find(a => a.id === id);
  if (!target) fallar(`No hay ningún acuerdo con el id ${id}.`);
  const week = isoWeek(target.fecha);
  const quitados: string[] = [];
  const nuevos = acuerdos.map(a => {
    if (a.id === id) {
      return { ...a, destacado_semana: true, ...(lectura?.trim() ? { lectura: lectura.trim(), lectura_borrador: null } : {}) };
    }
    if (a.destacado_semana && a.fecha >= week.start && a.fecha <= week.end) {
      quitados.push(a.id);
      return { ...a, destacado_semana: false };
    }
    return a;
  });
  guardarMarcador(nuevos);
  console.log(`✓ ${target.titulo} es el destacado de la semana ${week.week} (${week.start} al ${week.end}).`);
  if (lectura?.trim()) console.log('  Lectura Playbook guardada como aprobada.');
  else if (!target.lectura) console.log('  Sin lectura: la tarjeta se muestra sin el bloque de lectura.');
  if (quitados.length) console.log(`  Dejó de ser destacado: ${quitados.join(', ')}.`);
}

main();
