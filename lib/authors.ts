import { slugify } from './slugify';
import { authorDisplayName } from './author-name';

// Firmas y páginas de autor (A5, 2026-10-27).
//
// DE DÓNDE SALE EL AUTOR: el CMS guarda la firma como texto libre en
// `articles.author` (pestaña Artículos → "Autor"), y la casilla "Mostrar autor"
// (`articles.mostrar_autor`) decide si se imprime; Ajustes → "Mostrar autor en
// todas las notas" (`siteSettings.mostrarAutorGlobal`) la enciende para todo el
// sitio. No hay tabla de personas: foto, cargo, bio y LinkedIn no existen en
// la base. Viven aquí, en código, como el resto de los datos editoriales
// fijos (lib/hubs, lib/data/leadership.ts) — sin migración.
//
// Una persona aparece con página completa en /autor/<slug> en cuanto tiene
// una entrada aquí. Sin entrada, su página muestra solo su nombre y sus notas.
// Nada de lo que va en estos campos se inventa: se llena con lo que entregue
// la redacción.

export type AuthorProfile = {
  /** Nombre exactamente como aparece en la firma. */
  name: string;
  /** Otras formas en que la firma está escrita en notas viejas ("Guillermo Mejia"). */
  aliases?: string[];
  /** Cargo: "Director editorial". */
  role: string;
  /** "Qué cubro": una o dos frases. */
  covers: string;
  /** "Trayectoria": un párrafo por elemento. */
  career: string[];
  /** URL completa del perfil de LinkedIn. */
  linkedin?: string;
  /** Foto cuadrada, mínimo 400 px, ruta en /public (p. ej. /assets/autores/nombre.jpg). */
  photo?: string;
};

export const AUTHOR_PROFILES: AuthorProfile[] = [
  // Plantilla — copiar, llenar y quitar las barras:
  // {
  //   name: 'Nombre Apellido',
  //   role: 'Cargo',
  //   covers: 'Qué cubre, en una o dos frases.',
  //   career: ['Primer párrafo de trayectoria.', 'Segundo párrafo.'],
  //   linkedin: 'https://www.linkedin.com/in/usuario/',
  //   photo: '/assets/autores/nombre-apellido.jpg',
  // },
];

/** La firma de las notas sin autor visible. */
export const NEWSROOM_BYLINE = 'Redacción Playbook';

export function authorSlug(name: string): string {
  return slugify(authorDisplayName(name));
}

export function authorPath(name: string): string {
  return `/autor/${authorSlug(name)}`;
}

/** El perfil de una firma (por nombre, alias o slug), si existe. */
export function profileFor(nameOrSlug: string): AuthorProfile | null {
  const slug = authorSlug(nameOrSlug);
  return (
    AUTHOR_PROFILES.find(p => [p.name, ...(p.aliases ?? [])].some(n => authorSlug(n) === slug)) ?? null
  );
}

/**
 * La firma que se imprime: el autor cuando la nota (o el sitio) lo muestra,
 * "Redacción Playbook" en cualquier otro caso — nunca una línea sin firma.
 */
export function bylineName(
  article: { author: string; mostrarAutor: boolean },
  mostrarAutorGlobal: boolean,
): { name: string; href: string | null; isNewsroom: boolean } {
  const show = article.mostrarAutor === true || mostrarAutorGlobal === true;
  const name = show ? authorDisplayName(article.author) : '';
  if (!name) return { name: NEWSROOM_BYLINE, href: '/como-trabajamos', isNewsroom: true };
  return { name, href: authorPath(name), isNewsroom: false };
}
