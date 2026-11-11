// Freshness guards for the two automated homepage modules (2026-11-11):
// El Marcador's archive mode and La cifra del día's heading / age limit.
// Every case runs on a simulated clock, so they don't depend on today.
//
//   npm run test:frescura
import assert from 'node:assert/strict';
import { cifraDateLabel, cifraHeading, selectDailyFigure } from '../lib/daily-figure';
import { isMarcadorArchive, latestDeals, type Deal } from '../lib/deals';
import { mexicoDay } from '../lib/freshness';
import { extractPullFigure } from '../lib/product-hubs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Acuerdo } from '../lib/marcador-schema';
import { activeWeek, heroFigure, pickFeatured, resumenCorto, rowDeals, siteHref, weekScore } from '../lib/marcador';
import { MarcadorWidget } from '../components/home/MarcadorWidget';

let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}\n     ${(err as Error).message}`);
  }
}

// ——— El Marcador
function deal(date: string, brand: string): Deal {
  return {
    id: `${date}-${brand}`, date, brand, counterparty: 'X', type: 'patrocinio', country: 'México', sport: '',
    duration: '', amountUsd: null, amountDisclosed: false, status: 'confirmado', summary: '', articleUrl: '',
    featured: false, playbookRead: null, keyFigures: [], createdAt: `${date}T12:00:00Z`, updatedAt: `${date}T12:00:00Z`,
  };
}
const deals = [deal('2026-10-31', 'A'), deal('2026-10-20', 'B'), deal('2026-10-25', 'C'), deal('2026-09-21', 'D'), deal('2026-10-28', 'E')];

check('Marcador: 10 days after the newest deal stays active', () => {
  assert.equal(isMarcadorArchive(deals, '2026-11-10'), false);
});
check('Marcador: 11 days after the newest deal enters archive mode', () => {
  assert.equal(isMarcadorArchive(deals, '2026-11-11'), true);
});
check('Marcador: an empty table counts as archive', () => {
  assert.equal(isMarcadorArchive([], '2026-11-11'), true);
});
check('Marcador: archive mode lists the 4 newest deals, newest first', () => {
  assert.deepEqual(latestDeals(deals).map(d => d.date), ['2026-10-31', '2026-10-28', '2026-10-25', '2026-10-20']);
});

// ——— La cifra del día
type A = Parameters<typeof selectDailyFigure>[0][number];
function story(id: string, date: string, title: string, score = 60): A {
  return { id, date, title, teaser: null, source: 'noticias', priority: 3, score, featured: false, confirmed: true };
}
// The hero (highest score, no figure) is always skipped by the rail, so every
// scenario carries one.
const hero = (date: string) => story('hero', date, 'Una nota sin cifra en el titular', 95);

check('19:00 CDMX is still that day in Mexico, not tomorrow (UTC)', () => {
  const at = new Date('2026-11-11T01:00:00Z'); // 10 nov, 19:00 CDMX
  assert.equal(mexicoDay(at), '2026-11-10');
  assert.equal(cifraHeading('2026-11-10', at), 'La cifra del día');
});
check('A figure from today is "La cifra del día"', () => {
  const now = new Date('2026-11-10T15:00:00Z');
  const pick = selectDailyFigure([hero('2026-11-10'), story('s', '2026-11-10', 'ESPN paga US$1,700M más')], {}, now);
  assert.equal(pick?.figure, 'US$1,700M');
  assert.equal(cifraHeading(pick!.date, now), 'La cifra del día');
});
check('A figure from yesterday is "La cifra" with its own date', () => {
  const now = new Date('2026-11-10T15:00:00Z');
  const pick = selectDailyFigure([hero('2026-11-10'), story('s', '2026-11-09', 'Fox cierra la compra por US$22,000 millones')], {}, now);
  assert.equal(pick?.date, '2026-11-09');
  assert.equal(cifraHeading(pick!.date, now), 'La cifra');
  assert.equal(cifraDateLabel(pick!.date), 'Lunes 9 nov');
});
check('A figure 3 days old still shows', () => {
  const now = new Date('2026-11-10T15:00:00Z');
  assert.ok(selectDailyFigure([hero('2026-11-10'), story('s', '2026-11-07', 'Un acuerdo por €45 millones')], {}, now));
});
check('A figure 4 days old hides the block', () => {
  const now = new Date('2026-11-10T15:00:00Z');
  assert.equal(selectDailyFigure([hero('2026-11-10'), story('s', '2026-11-06', 'Un acuerdo por €45 millones')], {}, now), null);
});
check('…and the alert can still read it as the last figure', () => {
  const now = new Date('2026-11-10T15:00:00Z');
  const last = selectDailyFigure([hero('2026-11-10'), story('s', '2026-11-06', 'Un acuerdo por €45 millones')], {}, now, Infinity);
  assert.equal(last?.date, '2026-11-06');
});
check('A headline in pounds keeps its currency', () => {
  assert.equal(extractPullFigure('Dueños del Liverpool van por Cadillac F1 por más de £2,000 millones'), '£2,000 millones');
});

// ——— El Marcador v2 widget (Fase 4)
function acuerdo(fecha: string, slug: string, over: Partial<Acuerdo> = {}): Acuerdo {
  return {
    id: `${fecha}-${slug}`, fecha, titulo: `${slug} × X`, partes: [slug, 'X'], tipo: 'patrocinio', alcance: 'eeuu', pais: ['US'],
    deporte: 'futbol', duracion: null, monto_usd_m: null, monto_tipo: 'nr', estatus: 'confirmado', dato_hero: null,
    resumen: 'Un acuerdo.', lectura: null, lectura_borrador: null, destacado_semana: false, cumple_criterio: true,
    url: `https://www.playbook.la/articulo/${slug}`, fuente_monto: null, ...over,
  };
}
const semana45 = [
  acuerdo('2026-11-06', 'fox-roku', { tipo: 'propiedad', monto_usd_m: 22000, monto_tipo: 'revelado', fuente_monto: 'x', destacado_semana: true }),
  acuerdo('2026-11-05', 'amex-nba', { alcance: 'mexico', pais: ['MX'] }),
  acuerdo('2026-11-05', 'adidas-milan', { alcance: 'europa', monto_usd_m: 561.2, monto_tipo: 'reportado', fuente_monto: 'x', estatus: 'reportado' }),
  acuerdo('2026-11-03', 'equinox', { monto_usd_m: 1000, monto_tipo: 'revelado', fuente_monto: 'x' }),
  acuerdo('2026-10-28', 'anterior'),
];

check('Marcador v2: a week with no deals shows the last week with activity', () => {
  const w = activeWeek(semana45, '2026-11-10')!; // Tuesday of week 46, nothing loaded yet
  assert.equal(w.week, 45);
  assert.deepEqual(weekScore(w), { acuerdos: 4, mexico: 1, reportados: 1 });
});
check('Marcador v2: the flagged deal leads the week', () => {
  assert.equal(pickFeatured(activeWeek(semana45, '2026-11-10')!)?.id, '2026-11-06-fox-roku');
});
check('Marcador v2: without a flag, México leads, then the biggest disclosed amount', () => {
  const unflagged = semana45.map(a => ({ ...a, destacado_semana: false }));
  assert.equal(pickFeatured(activeWeek(unflagged, '2026-11-10')!)?.id, '2026-11-05-amex-nba');
  const noMexico = unflagged.filter(a => a.alcance !== 'mexico');
  assert.equal(pickFeatured(activeWeek(noMexico, '2026-11-10')!)?.id, '2026-11-06-fox-roku');
});
check('Marcador v2: four rows, México first, topped up from earlier weeks', () => {
  const w = activeWeek(semana45, '2026-11-10')!;
  assert.deepEqual(rowDeals(semana45, w, '2026-11-06-fox-roku').map(a => a.id), [
    '2026-11-05-amex-nba', '2026-11-03-equinox', '2026-11-05-adidas-milan', '2026-10-28-anterior',
  ]);
});
check('Marcador v2: an N/R deal never shows "N/R" as its hero figure', () => {
  assert.equal(heroFigure(acuerdo('2026-11-05', 'nr')), null);
  assert.deepEqual(heroFigure(acuerdo('2026-11-05', 'tiendas', { dato_hero: { valor: '140+', etiqueta: 'tiendas' } })), { valor: '140+', etiqueta: 'tiendas' });
});
check('Marcador v2: the summary is cut at 35 words', () => {
  const long = Array.from({ length: 50 }, (_, i) => `p${i}`).join(' ');
  assert.equal(resumenCorto(long).split(' ').length, 35);
});
check('Marcador v2: own-site links open in the same tab', () => {
  assert.equal(siteHref('https://www.playbook.la/articulo/x'), '/articulo/x');
  assert.equal(siteHref('https://example.com/a'), 'https://example.com/a');
});
check('Marcador v2: a featured deal without an approved reading renders no reading block', () => {
  const withDraft = semana45.map(a => (a.destacado_semana ? { ...a, lectura_borrador: 'BORRADOR SECRETO' } : a));
  const html = renderToStaticMarkup(createElement(MarcadorWidget, { acuerdos: withDraft, today: '2026-11-10' }));
  assert.ok(html.includes('Fox-roku × X') || html.includes('fox-roku × X'), 'featured title renders');
  assert.ok(!html.includes('Lectura Playbook'), 'no reading block');
  assert.ok(!html.includes('BORRADOR SECRETO'), 'the draft never renders');
  assert.ok(html.includes('Semana 45'));
});
check('Marcador v2: an approved reading renders with its label', () => {
  const approved = semana45.map(a => (a.destacado_semana ? { ...a, lectura: 'Lectura aprobada.' } : a));
  const html = renderToStaticMarkup(createElement(MarcadorWidget, { acuerdos: approved, today: '2026-11-10' }));
  assert.ok(html.includes('Lectura Playbook:') && html.includes('Lectura aprobada.'));
});
check('Marcador v2: 11 days after the newest deal, the widget is in archive mode', () => {
  const html = renderToStaticMarkup(createElement(MarcadorWidget, { acuerdos: semana45, today: '2026-11-17' }));
  assert.ok(html.includes('Los acuerdos de 2026') && !html.includes('Semana 45') && !html.includes('Acuerdo de la semana'));
});

if (failed) {
  console.log(`\n${failed} failing`);
  process.exit(1);
}
console.log('\nall passing');
