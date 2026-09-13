// Real asserts for the two deterministic pieces of Moat Playbook: tier word
// ranges (format-tiers.md §1) and the Moat Check severity rule
// (voice-and-style.md §12). Everything else in the Moat Check is editorial
// judgment and is validated by the ten narrative cases in this same
// directory (caso-01.md … caso-10.md), read by a human, not by an assert.
//
// Run: node --test tests/moat-playbook/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countWords, checkTierLength, TIER_RANGES } from './check-tier-length.mjs';
import { computeMoatRating, RATINGS } from './moat-rating.mjs';

test('countWords ignores markdown chrome, images and the Fuentes: line', () => {
  const md = [
    '**El plan:** Algo pasó con **US$10 millones** de por medio.',
    '',
    '![alt](https://example.com/x.jpg)',
    '',
    'Fuentes: [Outlet](https://example.com)',
  ].join('\n');
  // "El plan: Algo pasó con US$10 millones de por medio." = 10 words
  assert.equal(countWords(md), 10);
});

test('tier A: 100-180 words', () => {
  assert.equal(checkTierLength('A', 99).ok, false, '99 words fails the floor');
  assert.equal(checkTierLength('A', 100).ok, true, '100 words clears the floor');
  assert.equal(checkTierLength('A', 180).ok, true, '180 words clears the ceiling');
  assert.equal(checkTierLength('A', 181).ok, false, '181 words fails the ceiling');
});

test('tier B: 250-500 words', () => {
  assert.equal(checkTierLength('B', 249).ok, false);
  assert.equal(checkTierLength('B', 250).ok, true);
  assert.equal(checkTierLength('B', 500).ok, true);
  assert.equal(checkTierLength('B', 501).ok, false);
});

test('tier C: 700-1200 words', () => {
  assert.equal(checkTierLength('C', 699).ok, false);
  assert.equal(checkTierLength('C', 700).ok, true);
  assert.equal(checkTierLength('C', 1200).ok, true);
  assert.equal(checkTierLength('C', 1201).ok, false);
});

test('unknown tier (e.g. D) is reported, never silently passed', () => {
  const result = checkTierLength('D', 900);
  assert.equal(result.ok, false);
  assert.match(result.reason, /unknown tier/);
});

test('TIER_RANGES matches format-tiers.md §1\'s table exactly', () => {
  assert.deepEqual(TIER_RANGES, {
    A: { min: 100, max: 180 },
    B: { min: 250, max: 500 },
    C: { min: 700, max: 1200 },
  });
});

test('Moat rating: all gates pass -> craft rating stands unchanged', () => {
  const gates = { gate4Delta: true, gate5PastHeadline: true, gate6Evidenced: true };
  assert.equal(computeMoatRating(gates, RATINGS.APROBADO), RATINGS.APROBADO);
  assert.equal(computeMoatRating(gates, RATINGS.AJUSTES_MENORES), RATINGS.AJUSTES_MENORES);
});

test('Moat rating: a single failed gate caps an otherwise-APROBADO draft at REQUIERE REEDICIÓN', () => {
  const gates = { gate4Delta: false, gate5PastHeadline: true, gate6Evidenced: true };
  assert.equal(computeMoatRating(gates, RATINGS.APROBADO), RATINGS.REQUIERE_REEDICION);
});

test('Moat rating: a failed gate never gets rounded up from REQUIERE REEDICIÓN to AJUSTES MENORES', () => {
  const gates = { gate4Delta: true, gate5PastHeadline: false, gate6Evidenced: true };
  assert.equal(computeMoatRating(gates, RATINGS.AJUSTES_MENORES), RATINGS.REQUIERE_REEDICION);
});

test('Moat rating: all three gates failing is still just REQUIERE REEDICIÓN, not worse, unless craft already was', () => {
  const gates = { gate4Delta: false, gate5PastHeadline: false, gate6Evidenced: false };
  assert.equal(computeMoatRating(gates, RATINGS.APROBADO), RATINGS.REQUIERE_REEDICION);
});

test('Moat rating: a failed gate keeps NO PUBLICAR TODAVÍA when the craft rating was already that bad', () => {
  const gates = { gate4Delta: false, gate5PastHeadline: true, gate6Evidenced: true };
  assert.equal(computeMoatRating(gates, RATINGS.NO_PUBLICAR_TODAVIA), RATINGS.NO_PUBLICAR_TODAVIA);
});
