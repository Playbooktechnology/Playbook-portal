// The one piece of Cambio 8 (the Moat Check) that is a rule about a RATING,
// not about a piece of prose, so it gets a real function instead of only
// living as a paragraph in voice-and-style.md §12: whether any of gates 4/5/6
// failed determines the CEILING on the rating, mechanically, regardless of
// how clean everything else is. The content of each gate question (is there
// a delta, does the piece go past the headline, is the extra layer evidenced)
// is still an editorial judgment call — this function only enforces what
// happens to the rating once those three yes/no answers are in.

export const RATINGS = Object.freeze({
  APROBADO: 'APROBADO',
  AJUSTES_MENORES: 'AJUSTES MENORES',
  REQUIERE_REEDICION: 'REQUIERE REEDICIÓN',
  NO_PUBLICAR_TODAVIA: 'NO PUBLICAR TODAVÍA',
});

const RATING_ORDER = [
  RATINGS.NO_PUBLICAR_TODAVIA,
  RATINGS.REQUIERE_REEDICION,
  RATINGS.AJUSTES_MENORES,
  RATINGS.APROBADO,
];

function worseOf(a, b) {
  return RATING_ORDER.indexOf(a) <= RATING_ORDER.indexOf(b) ? a : b;
}

/**
 * @param {{gate4Delta: boolean, gate5PastHeadline: boolean, gate6Evidenced: boolean}} gates
 *   Each true = the gate PASSES (there is a delta / it goes past the headline / it's evidenced).
 * @param {RATINGS[keyof RATINGS]} craftRating
 *   The rating the twelve-point checklist alone would give, ignoring the Moat gates.
 * @returns {RATINGS[keyof RATINGS]}
 */
export function computeMoatRating(gates, craftRating) {
  const { gate4Delta, gate5PastHeadline, gate6Evidenced } = gates;
  const anyGateFailed = !gate4Delta || !gate5PastHeadline || !gate6Evidenced;

  if (!anyGateFailed) return craftRating;

  // Severity rule (Moat Playbook, 2026-09-13): a failed gate caps the rating
  // at REQUIERE REEDICIÓN. It can still be worse (NO PUBLICAR TODAVÍA) if the
  // craft rating already was, but it can never be better.
  return worseOf(craftRating, RATINGS.REQUIERE_REEDICION);
}
