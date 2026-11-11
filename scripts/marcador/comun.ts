// Shared plumbing for the weekly Marcador commands (Fase 6, 2026-11-11):
// reading/writing data/marcador.json, fetching a note from the articles
// table, ECB conversion and the field-by-field review prompt. See
// docs/marcador.md for the workflow.
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { neon } from '@neondatabase/serverless';
import { ALCANCES, ESTATUS, MONTO_TIPOS, TIPOS, validateMarcador, type Acuerdo } from '../../lib/marcador-schema';
import { cifraDeFrase, idPara } from '../../lib/marcador-propuesta';
import type { NotaFuente } from '../../lib/marcador-propuesta';

export const DATA_PATH = 'data/marcador.json';
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fechaCorta(f: string): string {
  const [y, m, d] = f.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]} ${y}`;
}

// ----------------------------------------------------------------- File

export function leerMarcador(): Acuerdo[] {
  const { acuerdos, errores } = validateMarcador(JSON.parse(readFileSync(DATA_PATH, 'utf8')));
  if (errores.length) fallar(`data/marcador.json ya tiene errores; corrígelos antes:\n${errores.map(e => `  - ${e}`).join('\n')}`);
  return acuerdos;
}

/** Validates the WHOLE file with the change applied; writes only if it passes. */
export function guardarMarcador(acuerdos: Acuerdo[]): void {
  const ordenados = [...acuerdos].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
  const { errores } = validateMarcador(ordenados);
  if (errores.length) fallar(`No se guardó nada: el cambio deja el archivo inválido.\n${errores.map(e => `  - ${e}`).join('\n')}`);
  writeFileSync(DATA_PATH, `${JSON.stringify(ordenados, null, 2)}\n`);
}

export function fallar(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// ----------------------------------------------------------------- Note

export function slugDeUrl(url: string): string {
  const m = /\/articulo\/([^/?#]+)/.exec(url);
  if (!m) fallar(`No reconozco la URL: ${url}\n  Usa la de la nota, p. ej. https://www.playbook.la/articulo/fox-completa-la-compra-de-roku-por-us-22-000-millones`);
  return decodeURIComponent(m[1]);
}

function pgArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  return String(v ?? '')
    .replace(/^\{|\}$/g, '')
    .split(',')
    .map(s => s.replace(/^"|"$/g, '').trim())
    .filter(Boolean);
}

export function db() {
  if (!process.env.POSTGRES_URL) fallar('Falta POSTGRES_URL (la misma de .env.local). Ver docs/marcador.md → "Antes de empezar".');
  return neon(process.env.POSTGRES_URL);
}

/** The published note, read from the articles table (the public page may be metered). */
export async function leerNota(url: string): Promise<NotaFuente> {
  const id = slugDeUrl(url);
  const rows = (await db()`select id, title, excerpt, teaser, date, body_html, tags_vertical, tags_sport, tags_scope, status
    from articles where id = ${id}`) as Record<string, unknown>[];
  const r = rows[0];
  if (!r) fallar(`No existe ninguna nota con el id "${id}".`);
  if (r.status !== 'published') fallar(`La nota "${id}" no está publicada (estatus: ${r.status}).`);
  return {
    id,
    url: `https://www.playbook.la/articulo/${id}`,
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    teaser: String(r.teaser ?? ''),
    date: String(r.date ?? ''),
    bodyHtml: (r.body_html as string | null) ?? null,
    tagsVertical: pgArray(r.tags_vertical),
    tagsSport: pgArray(r.tags_sport),
    tagsScope: pgArray(r.tags_scope),
  };
}

// ----------------------------------------------------------------- ECB

/** USD millions at the ECB reference rate of the announcement day (or the last fixing before it). */
export async function aUsd(valor: number, moneda: string, fecha: string): Promise<{ usd: number; nota: string | null }> {
  if (moneda === 'USD') return { usd: Math.round(valor * 10) / 10, nota: null };
  const desde = new Date(Date.parse(`${fecha}T00:00:00Z`) - 10 * 86400000).toISOString().slice(0, 10);
  const series = moneda === 'EUR' ? 'USD' : `USD+${moneda}`;
  const res = await fetch(`https://data-api.ecb.europa.eu/service/data/EXR/D.${series}.EUR.SP00.A?startPeriod=${desde}&endPeriod=${fecha}&format=csvdata`);
  if (!res.ok) fallar(`El BCE no respondió (${res.status}). Intenta de nuevo o captura el monto en USD.`);
  const last: Record<string, [string, number]> = {};
  const lines = (await res.text()).trim().split('\n');
  const head = lines[0].split(',');
  const iCur = head.indexOf('CURRENCY'), iDay = head.indexOf('TIME_PERIOD'), iVal = head.indexOf('OBS_VALUE');
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    if (!last[c[iCur]] || c[iDay] > last[c[iCur]][0]) last[c[iCur]] = [c[iDay], Number(c[iVal])];
  }
  const usd = last.USD;
  const cur = moneda === 'EUR' ? (['', 1] as [string, number]) : last[moneda];
  if (!usd || !cur) fallar(`El BCE no tiene tipo de cambio ${moneda} para ${fecha}.`);
  const conv = Math.round((valor / cur[1]) * usd[1] * 10) / 10;
  return { usd: conv, nota: `BCE ${usd[0]}: 1 EUR = ${usd[1]} USD${moneda === 'EUR' ? '' : ` = ${cur[1]} ${moneda}`}` };
}

// ----------------------------------------------------------------- Review

type Pregunta = (texto: string) => Promise<string>;

/**
 * Line-queued prompts. rl.question() drops lines that arrive before it is
 * called (pasting several answers at once, or piping them in), so every line
 * is queued and each question takes the next one.
 */
export function abrirConsola(): { preguntar: Pregunta; cerrar: () => void } {
  const rl = createInterface({ input: stdin, terminal: stdin.isTTY ?? false });
  const cola: string[] = [];
  const esperando: ((l: string) => void)[] = [];
  let cerrado = false;
  rl.on('line', line => (esperando.length ? esperando.shift()!(line) : cola.push(line)));
  rl.on('close', () => {
    cerrado = true;
    while (esperando.length) esperando.shift()!('');
  });
  const preguntar: Pregunta = texto => {
    stdout.write(texto);
    if (cola.length) {
      const l = cola.shift()!;
      if (!stdin.isTTY) stdout.write(`${l}\n`);
      return Promise.resolve(l);
    }
    if (cerrado) {
      stdout.write('\n');
      return Promise.resolve('');
    }
    return new Promise(resolve => esperando.push(l => {
      if (!stdin.isTTY) stdout.write(`${l}\n`);
      resolve(l);
    }));
  };
  return { preguntar, cerrar: () => rl.close() };
}

async function campo(preguntar: Pregunta, etiqueta: string, actual: string, opciones?: readonly string[]): Promise<string> {
  const lista = opciones ? ` (${opciones.join(' | ')})` : '';
  for (;;) {
    const r = (await preguntar(`  ${etiqueta}${lista} [${actual || 'vacío'}]: `)).trim();
    const v = r === '' ? actual : r === '-' ? '' : r;
    if (!opciones || opciones.includes(v)) return v;
    console.log(`    → usa uno de: ${opciones.join(', ')}`);
  }
}

/**
 * Walks the editor through every field of a proposal. Enter keeps the value
 * shown in brackets, "-" empties it. The amount is chosen from the note's own
 * sentences, so its source phrase is always a literal quote.
 */
export async function revisar(preguntar: Pregunta, a: Acuerdo, frases: string[]): Promise<Acuerdo> {
  console.log('\nEnter acepta lo que está entre corchetes; "-" lo deja vacío.\n');
  const r: Acuerdo = { ...a };
  r.fecha = await campo(preguntar, 'Fecha del anuncio (AAAA-MM-DD)', r.fecha);
  r.titulo = await campo(preguntar, 'Título', r.titulo);
  r.partes = (await campo(preguntar, 'Partes (separadas por ;)', r.partes.join('; '))).split(';').map(s => s.trim()).filter(Boolean);
  r.tipo = (await campo(preguntar, 'Tipo', r.tipo, TIPOS)) as Acuerdo['tipo'];
  r.pais = (await campo(preguntar, 'Países ISO (MX, US…, separados por coma)', r.pais.join(', '))).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  r.alcance = (await campo(preguntar, 'Alcance', r.alcance, ALCANCES)) as Acuerdo['alcance'];
  r.deporte = await campo(preguntar, 'Deporte (minúsculas, con guiones)', r.deporte);
  r.duracion = (await campo(preguntar, 'Duración', r.duracion ?? '')) || null;
  r.estatus = (await campo(preguntar, 'Estatus', r.estatus, ESTATUS)) as Acuerdo['estatus'];

  console.log('\n  Monto. Frases de la nota con una cifra:');
  frases.slice(0, 12).forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
  if (!frases.length) console.log('   (ninguna)');
  const actualMonto = r.monto_usd_m === null ? '0' : 'conservar';
  const eleccion = await campo(preguntar, 'Número de la frase que da el monto (0 = sin monto, N/R)', actualMonto);
  if (eleccion !== 'conservar') {
    const n = Number(eleccion);
    if (!n) {
      Object.assign(r, { monto_usd_m: null, monto_tipo: 'nr', fuente_monto: null });
    } else {
      const frase = frases[n - 1];
      if (!frase) fallar(`No hay frase ${n}.`);
      const cifra = cifraDeFrase(frase);
      const valor = Number(await campo(preguntar, 'Cifra en millones (moneda original)', String(cifra?.valor ?? '')));
      const moneda = (await campo(preguntar, 'Moneda (USD, EUR, GBP, BRL, MXN…)', cifra?.moneda ?? 'USD')).toUpperCase();
      r.monto_tipo = (await campo(preguntar, 'Tipo de monto', 'reportado', MONTO_TIPOS.filter(t => t !== 'nr'))) as Acuerdo['monto_tipo'];
      const { usd, nota } = await aUsd(valor, moneda, r.fecha);
      r.monto_usd_m = usd;
      r.fuente_monto = `Nota Playbook ${fechaCorta(r.fecha)}: "${frase}"${nota ? ` · conversión ${nota}` : ''}`;
      console.log(`    → US$${usd.toLocaleString('en-US')}M${nota ? ` (${nota})` : ''}`);
    }
  }
  if (r.monto_usd_m === null) {
    const hero = await campo(preguntar, 'Dato principal sin monto, "valor | etiqueta" (p. ej. 140+ | tiendas)', r.dato_hero ? `${r.dato_hero.valor} | ${r.dato_hero.etiqueta}` : '');
    const [valor, etiqueta] = hero.split('|').map(s => s.trim());
    r.dato_hero = valor && etiqueta ? { valor, etiqueta } : null;
  }
  r.resumen = await campo(preguntar, 'Resumen (máx. 35 palabras si será destacado)', r.resumen);
  const criterio = await campo(preguntar, '¿Cumple el criterio? s = se muestra, n = no, ? = queda como propuesta', r.cumple_criterio === null ? '?' : r.cumple_criterio ? 's' : 'n', ['s', 'n', '?']);
  r.cumple_criterio = criterio === '?' ? null : criterio === 's';
  r.id = idPara(r.fecha, r.titulo);
  return r;
}

export function mostrar(a: Acuerdo): void {
  console.log(`\n${JSON.stringify(a, null, 2)}\n`);
}
