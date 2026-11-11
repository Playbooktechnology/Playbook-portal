import { NewsletterForm } from '@/components/shared/NewsletterForm';
import { DailyFigure } from './DailyFigure';
import { DealsBoard } from './DealsBoard';
import { AdSlot } from '@/components/ads/AdSlot';
import { getPublicArticles, getDeclaredCifras } from '@/lib/data/articles';
import { cifraDateLabel, cifraHeading, selectDailyFigure } from '@/lib/daily-figure';
import { articlePath } from '@/lib/article-url';

// Right rail of the homepage news package (Fase 7 UX). Server component:
// MostReadSection needs GA4 data access. Rendered by
// app/(public)/page.tsx and passed INTO the client-side NewsGrid as a
// ReactNode prop — the sidebar never re-renders when the reader changes
// source filters, only the stories do.
//
// Modules, top to bottom:
// - compact newsletter module (from the Fase 9 plan's sidebar spec) —
//   a conversion point the sales side asked to keep close to the top of
//   the page. Moved above Más leídas 2026-08-01 (Roadmap Agosto 2026,
//   Fase 1, item 4: "reubicar Más leídas debajo del bloque de
//   suscripción") -- was the first module in the rail before that.
//   Stays FIRST — the sales position is negotiated; new modules go below.
// - La cifra del día (La Portada round 2, 2026-08-05): the biggest figure
//   among today's ranked stories, counting up, linking to its story. Zero
//   CMS work — derived from the same ranked pool the news package uses
//   (React-cached, no extra query) with the same extractPullFigure the
//   hub heroes use. Skips the hero story so the rail adds information
//   instead of repeating the headline sitting next to it; collapses to
//   nothing on days when no ranked story carries a figure.
//   Declared Cifra clave first, else a figure in the HEADLINE — never the
//   excerpt, since 2026-10-21 (lib/daily-figure.ts). Since 2026-11-11 the
//   heading reads "La cifra" with the figure's date when its story is not
//   from today (CDMX), and the block hides past FRESHNESS.cifraMaxAgeDays.
// - El Marcador de Negocios (2026-09-23, replaced El tablero de la FIFA):
//   the week's featured deal, three more, and the year's confirmed total
//   (or, past FRESHNESS.marcadorArchiveAfterDays, the latest dated deals),
//   read from the `deals` table (components/home/DealsBoard.tsx). Edited in
//   /admin, same 60s tagged cache as the articles pool. Placed here per the
//   rule above — new modules go below the newsletter block.
// - rail-home ad. Más leídas moved OUT of the rail (2026-08-06, user
//   feedback from an iPad: the rail stretched far past the 1+5 columns
//   and left a page-tall hole) — it's now the full-width band under the
//   news package (see app/(public)/page.tsx), and the ad closes the rail.
export async function HomeSidebar() {
  const [articles, declaredFigures] = await Promise.all([getPublicArticles(), getDeclaredCifras()]);
  // The choice (declared Cifra clave first, else a headline figure, never the
  // excerpt) and its age limit live in lib/daily-figure.ts, shared with the
  // daily freshness alert.
  const now = new Date();
  const cifra = selectDailyFigure(articles, declaredFigures, now);

  return (
    <div className="sidebar-sticky">
      <section className="side-module side-newsletter" aria-labelledby="side-nl-title">
        <h2 className="side-title" id="side-nl-title">Newsletter</h2>
        <p className="side-newsletter-copy">
          Lo que mueve al negocio del deporte, directo a tu correo.
        </p>
        <NewsletterForm
          placement="sidebar"
          formClassName="side-newsletter-form"
          action="https://playbookmedia.substack.com/"
          emailId="nl-email-side"
          emailLabel="Tu correo"
          buttonLabel="Suscribirme"
          successMessage="Te abrimos Substack para confirmar."
        />
      </section>
      {cifra && (
        <section className="side-module side-cifra" aria-labelledby="side-cifra-title">
          <div className="side-cifra-head">
            <h2 className="side-title" id="side-cifra-title">{cifraHeading(cifra.date, now)}</h2>
            <time className="side-cifra-date" dateTime={cifra.date}>{cifraDateLabel(cifra.date)}</time>
          </div>
          <a className="side-cifra-card" data-analytics="hp_click_cifra" href={articlePath(cifra.id)}>
            <DailyFigure figure={cifra.figure} />
            {cifra.caption && <span className="side-cifra-caption">{cifra.caption}</span>}
            <span className="side-cifra-story">{cifra.title}</span>
            <span className="side-cifra-cta" aria-hidden="true">Leer la historia →</span>
          </a>
        </section>
      )}
      <DealsBoard />
      <AdSlot slot="rail-home" />
    </div>
  );
}
