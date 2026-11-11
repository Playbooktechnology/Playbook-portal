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

if (failed) {
  console.log(`\n${failed} failing`);
  process.exit(1);
}
console.log('\nall passing');
