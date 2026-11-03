import type { Article } from './data/articles';
import { firstBlock } from './home-blocks';

// Conteo de mezcla México / LATAM en portada (A10, vista interna).
//
// MÉXICO sale de la etiqueta de alcance que ya existe: "Nacional"
// (articles.tags_scope) significa México. LATAM NO tiene etiqueta: la
// taxonomía solo distingue Nacional / Internacional, así que una nota de
// Brasil y una de la Premier League son igual de "Internacional". Mientras no
// exista la etiqueta, LATAM se ESTIMA buscando países y torneos de la región
// en titular y bajada, y la vista lo marca como estimado. La propuesta para
// agregarla está en docs/PROPUESTA_ETIQUETA_LATAM.md.
//
// "Cada día" sin guardar nada: la portada se decide con funciones puras de la
// fecha (lib/rank.ts), así que la de un día pasado se reconstruye corriendo la
// misma selección con las notas publicadas hasta ese día, a las 9:00 de la
// Ciudad de México. Es una reconstrucción: no ve cambios manuales de ese día
// (hero fijado, destacados) que después se hayan quitado.

export const MIX_POSITIONS = 10;

const LATAM =
  /\b(latinoam[eé]rica|latam|sudam[eé]rica|conmebol|libertadores|sudamericana|concacaf|centroam[eé]rica|brasil(?:eñ[oa]s?|eir[oa]s?)?|argentin[oa]s?|colombi(?:a|an[oa]s?)|chile(?:n[oa]s?)?|per[uú](?:an[oa]s?)?|uruguay(?:[oa]s?)?|paraguay(?:[oa]s?)?|ecuador(?:ian[oa]s?)?|bolivia(?:n[oa]s?)?|venezuela|venezolan[oa]s?|costa rica|panam[aá]|guatemala|honduras|el salvador|puerto rico|rep[uú]blica dominicana|cuba|flamengo|palmeiras|corinthians|boca juniors|river plate|caz[eé]tv|globo)\b/i;

export type MixKind = 'mexico' | 'latam' | 'otro';

export function mixKind(a: Pick<Article, 'tagsScope' | 'title' | 'excerpt'>): MixKind {
  if (a.tagsScope.includes('Nacional')) return 'mexico';
  if (LATAM.test(`${a.title} ${a.excerpt}`)) return 'latam';
  return 'otro';
}

export type DayMix = {
  day: string;
  mexico: number;
  latam: number;
  total: number;
  lead: MixKind | null;
  items: { id: string; title: string; kind: MixKind }[];
};

/** The first MIX_POSITIONS homepage slots as they stood at `at`. */
export function mixAt(articles: Article[], day: string, at: Date): DayMix {
  const pool = articles.filter(a => a.date <= day);
  const top = firstBlock(pool, at).slice(0, MIX_POSITIONS);
  const items = top.map(a => ({ id: a.id, title: a.title, kind: mixKind(a) }));
  return {
    day,
    mexico: items.filter(i => i.kind === 'mexico').length,
    latam: items.filter(i => i.kind === 'latam').length,
    total: items.length,
    lead: items[0]?.kind ?? null,
    items,
  };
}

/** Today (now) plus the previous `days` days at 9:00 CDMX, newest first. */
export function mixHistory(articles: Article[], today: string, days = 14, now: Date = new Date()): DayMix[] {
  const out = [mixAt(articles, today, now)];
  for (let i = 1; i <= days; i++) {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    out.push(mixAt(articles, day, new Date(`${day}T09:00:00-06:00`)));
  }
  return out;
}
