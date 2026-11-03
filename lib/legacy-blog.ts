import { and, eq, sql } from 'drizzle-orm';
import { db } from './db/client';
import { articles } from './db/schema';

// ----------------------------------------- URLs del sitio anterior (/blog/)
// Antes de la migración los artículos vivían en /blog/<slug>, y Search
// Console sigue reportando esas URLs como 404 (2026-10-28: 48 de ellas). Los
// slugs viejos llegan en tres formas para la misma palabra:
//
//   /blog/la-oportunidad-que-méxico-no-ve          acento literal
//   /blog/la-oportunidad-que-m%C3%A9xico-no-ve     acento percent-encoded
//   /blog/es-viable-una-franquicia-nba-en-me-xico  acento partido con guion
//
// La tercera es la que impide un mapeo directo: el sitio viejo descomponía
// "é" en "e" + acento y cambiaba el acento por un guion, así que "me-xico" es
// una sola palabra y "en-me" son dos. Desde el texto no se puede saber cuál
// guion es cuál, y no hace falta: `articles.id` sale de lib/slugify.ts, que
// sólo produce [a-z0-9-], así que se comparan las dos llaves SIN guiones.
// "me-xico", "méxico" y "m%C3%A9xico" dan la misma llave que "mexico".
//
// Verificado contra producción el 2026-10-28: ninguna de las 53 URLs
// reportadas tiene artículo actual (la tabla empieza el 2025-11-26 y esos
// artículos son del sitio anterior). La regla queda para las que sí lo
// tengan — un artículo republicado con el mismo título resuelve solo.

export function legacyBlogKey(rawSlug: string): string {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // Secuencia % malformada: se compara tal cual, sin decodificar.
  }
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

/** El id del artículo publicado equivalente a un slug de /blog/, o null. */
export async function findArticleIdForLegacyBlogSlug(rawSlug: string): Promise<string | null> {
  const key = legacyBlogKey(rawSlug);
  // Una llave muy corta empataría por casualidad con algo; mejor un 404.
  if (key.length < 8) return null;
  const rows = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.status, 'published'), sql`replace(${articles.id}, '-', '') = ${key}`))
    .orderBy(articles.id)
    .limit(1);
  return rows[0]?.id ?? null;
}
