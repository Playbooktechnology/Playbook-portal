import { NewsletterForm } from '@/components/shared/NewsletterForm';
import { DailyFigure } from './DailyFigure';
import { DealsBoard } from './DealsBoard';
import { AdSlot } from '@/components/ads/AdSlot';
import { getPublicArticles, getDeclaredCifras } from '@/lib/data/articles';
import { rankArticles, selectHero } from '@/lib/rank';
import { storyFigure } from '@/lib/product-hubs';
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
//   excerpt, since 2026-10-21. See the rule at the top of the function.
// - El Marcador de Negocios (2026-09-23, replaced El tablero de la FIFA):
//   the week's featured deal, three more, and the year's confirmed total,
//   read from the `deals` table (components/home/DealsBoard.tsx). Edited in
//   /admin, same 60s tagged cache as the articles pool. Placed here per the
//   rule above — new modules go below the newsletter block.
// - rail-home ad. Más leídas moved OUT of the rail (2026-08-06, user
//   feedback from an iPad: the rail stretched far past the 1+5 columns
//   and left a page-tall hole) — it's now the full-width band under the
//   news package (see app/(public)/page.tsx), and the ad closes the rail.
export async function HomeSidebar() {
  const articles = await getPublicArticles();
  const ranked = rankArticles(articles.filter(a => a.source !== 'opinion' || a.featured));
  const hero = selectHero(ranked);
  // ------------------------------------------------------ Choosing the figure
  // ONE RULE: the number only goes up if something says what it measures.
  //
  // Two sources satisfy that, and the order between them is the whole design.
  //
  //   1. A DECLARED "Cifra clave:" in the body. The editor picked the number
  //      AND wrote the line under it ("US$25 millones — lo que la FIFA ofrece
  //      por federación"), optionally with its source. This is the only path
  //      that can promote a figure living in the middle of a story, which is
  //      where the best ones live: a deal's value, a study's result, the size
  //      of a fine. It wins even over a higher-ranked story's headline figure
  //      — a human vouched for it, and the scrape below never does.
  //
  //   2. A figure in the HEADLINE. No caption needed: the headline is sitting
  //      right under the number and it IS the caption, by construction.
  //
  // What is NOT a source any more is the excerpt (publisher, 2026-10-21). The
  // excerpt is where a story keeps its CONTEXT numbers and nothing here can
  // tell one from the news. Siroko × Chicago Bulls is the case that settled
  // it: the deal's value was never disclosed, the excerpt closed on the
  // brand's €42 millones of 2024 revenue, and the rail printed "€42 millones"
  // over a headline about a sponsorship — every reader gets the same wrong
  // answer, that the deal is worth €42M. Five of that day's fourteen front-page
  // stories would have surfaced a context number the same way, among them a
  // jersey's €210 price as "La cifra del día".
  //
  // Deriving the caption from the excerpt automatically was tried before this
  // (2026-10-21) and rejected on its own output: "Facturación en 2024" came
  // out right for Siroko, but four of nine captions came out as severed
  // fragments — "Entregará al menos", "Netflix proyecta". A machine can find
  // the number; it cannot say what the number measures. So the rule stands at
  // declared-or-headline, and the way to bring an excerpt-grade figure back is
  // to declare it — which is what the publish skills now ask for
  // (.claude/playbook-editorial/dynamic-element-library.md, "Cifra clave").
  let cifra: { figure: string; caption?: string; id: string; title: string } | null = null;
  let fromHeadline: { figure: string; id: string; title: string } | null = null;
  const declaredFragments = await getDeclaredCifras();
  for (const article of ranked) {
    if (article === hero) continue;
    // Per-story resolution is lib/product-hubs.ts's storyFigure — the same
    // rule every other figure surface uses. What stays HERE is the one thing
    // only this rail does: choosing ACROSS stories, where a declared figure
    // further down the ranking beats a headline figure higher up.
    const found = storyFigure(article, declaredFragments[article.id]);
    if (found?.declared) {
      // The caption is what the figure MEANS, and the rail used to drop it:
      // "US$8,000 a US$20,000" over a headline about talent factories left the
      // reader with a number and no unit (user feedback, 2026-08-07). The
      // article page has always shown it under the pull-figure; showing the
      // same line here keeps the two surfaces explaining the number
      // identically.
      cifra = {
        figure: found.value,
        caption: found.caption || undefined,
        id: article.id,
        title: article.title,
      };
      break;
    }
    // Remembered, not taken: a declared figure further down the ranking still
    // outranks it, so the walk continues.
    if (!fromHeadline && found) {
      fromHeadline = { figure: found.value, id: article.id, title: article.title };
    }
  }
  cifra = cifra ?? fromHeadline;

  return (
    <div className="sidebar-sticky">
      <section className="side-module side-newsletter" aria-labelledby="side-nl-title">
        <h2 className="side-title" id="side-nl-title">Newsletter</h2>
        <p className="side-newsletter-copy">
          Lo que mueve al negocio del deporte, directo a tu correo.
        </p>
        <NewsletterForm
          placement="home-sidebar"
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
          <h2 className="side-title" id="side-cifra-title">La cifra del día</h2>
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
