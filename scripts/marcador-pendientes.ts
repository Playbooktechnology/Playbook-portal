// What the automation detected and the Marcador doesn't have yet (Fase 6).
//
//   npm run marcador:pendientes                (lista)
//   npm run marcador:pendientes -- --importar  (las agrega como propuestas)
//   npm run marcador:pendientes -- --descartar <url> "<motivo>"  (no es acuerdo: no vuelve a salir)
//
// Source: the `deal_drafts` queue that publishing a note in a deal vertical
// fills (lib/data/deal-drafts.ts: admin, Make.com webhook, publish-newsletter).
// That automation never writes to the Marcador. --importar adds each note as
// a PROPOSAL (cumple_criterio: null): kept in data/marcador.json, never shown
// or counted until you approve it with `npm run marcador:aprobar -- <id>`.
// Notes whose parties couldn't be read from the title are listed, not
// imported: those go through `npm run marcador:add -- <url>`. A note reviewed
// and judged not to be a deal goes to data/marcador-descartadas.json
// (--descartar), so it never comes back.
import { readFileSync, writeFileSync } from 'node:fs';
import { db, fallar, fechaCorta, guardarMarcador, leerMarcador, leerNota, slugDeUrl } from './marcador/comun';
import { todayInMexico } from '../lib/deals';

const DESCARTADAS = 'data/marcador-descartadas.json';
type Descartada = { url: string; motivo: string; revisada: string };
import { proponerAcuerdo } from '../lib/marcador-propuesta';

async function main() {
  const importar = process.argv.includes('--importar');
  const descartadas = JSON.parse(readFileSync(DESCARTADAS, 'utf8')) as Descartada[];
  if (process.argv.includes('--descartar')) {
    const [url, motivo] = process.argv.slice(process.argv.indexOf('--descartar') + 1);
    if (!url || !motivo) fallar('Uso: npm run marcador:pendientes -- --descartar <url> "<motivo>"');
    const full = `https://www.playbook.la/articulo/${slugDeUrl(url)}`;
    if (descartadas.some(d => d.url === full)) return console.log('Ya estaba descartada.');
    descartadas.push({ url: full, motivo, revisada: todayInMexico() });
    writeFileSync(DESCARTADAS, `${JSON.stringify(descartadas, null, 2)}\n`);
    return console.log(`✓ Descartada: ${full}. No vuelve a aparecer como pendiente.`);
  }
  const acuerdos = leerMarcador();
  const enMarcador = new Set([...acuerdos.map(a => a.url), ...descartadas.map(d => d.url)]);
  const rows = (await db()`select d.article_id, a.title, a.date from deal_drafts d join articles a on a.id = d.article_id
    where d.dismissed_at is null and a.status = 'published' order by a.date desc`) as { article_id: string; title: string; date: string }[];
  const pendientes = rows.filter(r => !enMarcador.has(`https://www.playbook.la/articulo/${r.article_id}`));
  if (!pendientes.length) return console.log('✓ No hay notas pendientes: todo lo detectado ya está en el Marcador.');

  if (!importar) {
    console.log(`\n${pendientes.length} notas detectadas que no están en el Marcador:\n`);
    for (const p of pendientes) console.log(`  ${fechaCorta(p.date)} · ${p.title}\n    npm run marcador:add -- https://www.playbook.la/articulo/${p.article_id}`);
    console.log('\nO agrégalas todas como propuestas: npm run marcador:pendientes -- --importar');
    return console.log('Si una no es acuerdo: npm run marcador:pendientes -- --descartar <url> "<motivo>"');
  }

  const nuevos = [...acuerdos];
  const ids = new Set(acuerdos.map(a => a.id));
  const sinPartes: string[] = [];
  let agregadas = 0;
  for (const p of pendientes) {
    const nota = await leerNota(`/articulo/${p.article_id}`);
    const { acuerdo, faltan } = proponerAcuerdo(nota);
    if (faltan.includes('brand') || ids.has(acuerdo.id)) {
      sinPartes.push(nota.url);
      continue;
    }
    nuevos.push(acuerdo);
    ids.add(acuerdo.id);
    agregadas++;
  }
  if (agregadas) guardarMarcador(nuevos);
  console.log(`✓ ${agregadas} propuestas agregadas (cumple_criterio: null, no se muestran). Revísalas con: npm run marcador:aprobar`);
  if (sinPartes.length) {
    console.log(`\n${sinPartes.length} notas sin partes claras en el título; agrégalas a mano:`);
    for (const u of sinPartes) console.log(`  npm run marcador:add -- ${u}`);
  }
}

main().catch(err => fallar(String(err?.message ?? err)));
