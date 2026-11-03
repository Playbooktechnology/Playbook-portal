import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site-url';

// /como-trabajamos (A5, 2026-10-27) — fuentes, correcciones, patrocinios y
// conflictos de interés. BORRADOR: la estructura está; el texto lo redacta la
// dirección editorial (docs/TODO.md, "Dirección editorial"). Hasta entonces
// la página no se indexa y cada sección lo dice. Para publicarla: reemplazar
// cada DRAFT por el texto final y cambiar `index: false` a `true`.
//
// "Redacción Playbook", la firma de las notas sin autor visible, enlaza aquí.

export const metadata: Metadata = {
  title: 'Cómo trabajamos',
  description: 'Fuentes, correcciones, patrocinios y conflictos de interés en Playbook.',
  alternates: { canonical: `${SITE_URL}/como-trabajamos` },
  robots: { index: false, follow: true },
};

const DRAFT = 'Borrador: texto pendiente de la redacción.';

const SECTIONS: { id: string; title: string; prompt: string }[] = [
  {
    id: 'fuentes',
    title: 'Fuentes',
    prompt: 'Qué cuenta como fuente, cómo se atribuye cada cifra y cuándo usamos fuentes anónimas.',
  },
  {
    id: 'correcciones',
    title: 'Correcciones',
    prompt: 'Cómo se pide una corrección, en cuánto tiempo respondemos y cómo se marca una nota corregida o actualizada.',
  },
  {
    id: 'patrocinios',
    title: 'Patrocinios',
    prompt: 'Cómo se identifica el contenido patrocinado y qué no compra un patrocinio (por ejemplo, Playmaker).',
  },
  {
    id: 'conflictos',
    title: 'Conflictos de interés',
    prompt: 'Qué declaramos cuando cubrimos a socios, clientes o empresas relacionadas con la redacción.',
  },
];

export default function ComoTrabajamosPage() {
  return (
    <main className="container legal-page" id="como-trabajamos-main">
      <h1>Cómo trabajamos</h1>
      <p className="legal-updated">{DRAFT}</p>

      {SECTIONS.map(s => (
        <section key={s.id} id={s.id}>
          <h2>{s.title}</h2>
          <p>
            <em>{DRAFT}</em> {s.prompt}
          </p>
        </section>
      ))}

      <p>
        Las cuatro reglas con las que decidimos qué publicar están en{' '}
        <Link href="/estandares">Estándares editoriales</Link>. Las firmas de la redacción, en{' '}
        <Link href="/equipo">Equipo</Link>.
      </p>
    </main>
  );
}
