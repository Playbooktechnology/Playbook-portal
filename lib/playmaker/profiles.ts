import { PLAYMAKER } from './config';
import { mexicoDay } from '../freshness';

// Los perfiles de Playmaker. Uno por semana; se agregan al final de la lista.
//
// Cada perfil sale publicado solo cuando llega su fecha (`publishedAt`, día
// de calendario en la Ciudad de México): se puede dejar listo el miércoles y
// aparece el jueves sin otro deploy. `draft: true` lo esconde en producción y
// lo deja ver en los preview de Vercel, para revisarlo antes.
//
// Regla de la sección: el patrocinador NO se menciona en el texto (cuerpo,
// frases, ficha). getPlaymakerProfiles() lo comprueba y rompe el build si
// aparece, para que no dependa de que alguien lo note en una revisión.

export type PlaymakerProfile = {
  slug: string;
  name: string;
  /** Cargo actual: "Presidente ejecutivo". */
  role: string;
  /** Organización: "Liga MX". */
  organization: string;
  /** Ficha: en el cargo desde (texto libre: "marzo de 2024"). */
  inRoleSince: string;
  /** Ficha: mandato (texto libre: "hasta 2028", "sin plazo definido"). */
  mandate: string;
  /** Ficha: cargo anterior. */
  previousRole: string;
  /** Retrato vertical 4:5, mínimo 1080×1350, en /public. */
  portrait: string;
  portraitCredit?: string;
  /** YYYY-MM-DD, el jueves de publicación. */
  publishedAt: string;
  /** Firma de la nota. */
  author: string;
  /** Bajada, una o dos frases. */
  dek: string;
  /** Cuerpo de la nota, un párrafo por elemento. */
  body: string[];
  /** 2 o 3 frases citables, textuales. */
  quotes: string[];
  draft?: boolean;
};

const PROFILES: PlaymakerProfile[] = [
  // Perfil de muestra para revisar la plantilla en el preview. No es una
  // persona real ni se publica en producción (draft). Borrarlo al cargar el
  // primer perfil real.
  {
    slug: 'perfil-de-muestra',
    name: 'Nombre Apellido',
    role: 'Cargo de la persona',
    organization: 'Organización',
    inRoleSince: 'mes de año',
    mandate: 'hasta año',
    previousRole: 'Cargo anterior en otra organización',
    portrait: '',
    publishedAt: '2026-11-05',
    author: 'Redacción Playbook',
    dek: 'Bajada del perfil: por qué esta persona importa esta semana, en una o dos frases.',
    body: [
      'Primer párrafo del perfil. Aquí va el texto que entregue la redacción; esta plantilla solo muestra cómo se acomoda.',
      'Segundo párrafo. El cuerpo es una lista de párrafos en lib/playmaker/profiles.ts.',
      'Tercer párrafo, para ver el ritmo de una nota de largo normal.',
    ],
    quotes: [
      'Primera frase citable, textual, entre comillas.',
      'Segunda frase citable.',
    ],
    draft: true,
  },
];

const showDrafts = process.env.VERCEL_ENV !== 'production';

function mentionsSponsor(p: PlaymakerProfile): boolean {
  const sponsor = PLAYMAKER.sponsor.name.toLowerCase();
  return [p.dek, p.inRoleSince, p.mandate, p.previousRole, ...p.body, ...p.quotes].some(t =>
    t.toLowerCase().includes(sponsor),
  );
}

/** Perfiles visibles hoy, el más reciente primero. */
export function getPlaymakerProfiles(now: Date = new Date()): PlaymakerProfile[] {
  const offending = PROFILES.filter(mentionsSponsor).map(p => p.slug);
  if (offending.length) {
    throw new Error(
      `Playmaker: ${offending.join(', ')} menciona a ${PLAYMAKER.sponsor.name} en el texto. ` +
        'La regla de la sección es no mencionar la marca dentro del perfil.',
    );
  }
  const today = mexicoDay(now);
  return PROFILES.filter(p => (showDrafts || !p.draft) && p.publishedAt <= today)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPlaymakerProfile(slug: string, now: Date = new Date()): PlaymakerProfile | null {
  getPlaymakerProfiles(now); // enforces the no-sponsor-in-text rule
  const p = PROFILES.find(x => x.slug === slug);
  if (!p) return null;
  // Previews show drafts and upcoming Thursdays, so a profile can be reviewed
  // before it goes out; production shows only what is published.
  if (showDrafts) return p;
  return !p.draft && p.publishedAt <= mexicoDay(now) ? p : null;
}

export function playmakerPath(slug?: string): string {
  return slug ? `${PLAYMAKER.path}/${slug}` : PLAYMAKER.path;
}
