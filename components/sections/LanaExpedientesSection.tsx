import Link from 'next/link';
import type { Article } from '@/lib/data/articles';
import type { OpinionCard } from '@/lib/data/site-content';
import { articlePath } from '@/lib/article-url';
import { caseNumber, caseStatus, storyFigure, type StoryDeclarations } from '@/lib/product-hubs';
import { FRESHNESS, ageInDays } from '@/lib/freshness';

// "La Lana del Deporte · El Expediente" (2026-10-27), in the slot the
// "Artículos de opinión" grid held. That grid had fallen back to its CMS
// cards for months (no article carries source='opinion'), so the homepage
// sent readers to two June pieces on Substack and a TFBR card pointing at
// the Substack root.
//
// Same source as /la-lana (source='la-lana', the cached getAllArticles
// pool) and the same case devices — case number, stamp and the story's
// figure (storyFigure, the one sitewide rule: a declared Cifra clave with its
// caption, else a figure in the headline, never the excerpt) — from
// lib/product-hubs.ts, so the homepage and the hub can't number, stamp or
// quote a file differently. The folder cards reuse /la-lana's .lana-folder-* skin
// (styles/product-hubs.css); only the cover and the grid are new here.
//
// Everything links on-site: each file to /articulo/<id>, "Ver archivo" to
// /la-lana, and the TFBR strip to /futbol-business-review. The CMS Opinión
// tab stays as it was (its heading/cards are no longer rendered here; only
// the TFBR card's copy is read, if the editor kept one).
const MAX_FILES = 3;

export function LanaExpedientesSection({
  articles,
  cmsCards = [],
  declaredCifras = {},
  whenStale,
  now = new Date(),
}: {
  /** Every la-lana article (any order): case numbers count the whole series. */
  articles: Article[];
  cmsCards?: OpinionCard[];
  /** lib/data/articles.ts getDeclaredCifras(): article id → its declared Cifra clave / Ecuación. */
  declaredCifras?: Record<string, StoryDeclarations>;
  /**
   * What the homepage shows instead when no expediente is younger than
   * FRESHNESS.opinionMaxAgeDays (lib/freshness.ts): "Más leídas" of the
   * month. The admin's live preview passes nothing and always shows the files.
   */
  whenStale?: React.ReactNode;
  now?: Date;
}) {
  const files = articles
    .filter(a => a.source === 'la-lana')
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id));
  if (files.length === 0) return null;
  // Caducidad (lib/freshness.ts, the homepage's one table of age limits): the
  // module shows only files younger than opinionMaxAgeDays, and gives its slot
  // to whenStale when none is.
  const fresh = whenStale === undefined ? files : files.filter(a => ageInDays(a.date, now) < FRESHNESS.opinionMaxAgeDays);
  if (!fresh.length) return whenStale === undefined ? null : <>{whenStale}</>;
  const latest = fresh.slice(0, MAX_FILES);
  const tfbr = cmsCards.find(c => /futbol business review/i.test(`${c.masthead} ${c.title}`));

  return (
    <section className="analysis-section hp-lana" id="analisis" aria-labelledby="hp-lana-title">
      <div className="container">
        <div className="section-head reveal">
          <div>
            <h2 id="hp-lana-title">La Lana del Deporte · El Expediente</h2>
          </div>
          <Link className="section-link" href="/la-lana" data-analytics="hp_click_expediente">
            Ver archivo
          </Link>
        </div>

        <ol className="hp-lana-grid">
          {latest.map(article => {
            const caseNo = caseNumber(article, files);
            const status = caseStatus(article, now);
            const figure = storyFigure(article, declaredCifras[article.id]);
            return (
              <li key={article.id} className="hp-lana-item reveal">
                <Link
                  className="lana-folder lana-folder-card hp-lana-card"
                  href={articlePath(article.id)}
                  data-analytics="hp_click_expediente"
                  data-source="la-lana"
                >
                  <span className="lana-folder-tab">
                    <span className="lana-case-number">Exp. {caseNo}</span>
                    <span className="lana-case-date">{article.dateFormatted}</span>
                  </span>
                  <span className="lana-folder-body">
                    {article.imageUrl && (
                      <span className="hp-lana-cover">
                        {/* Editor-supplied URL, arbitrary host — see
                            components/sections/AboutSection.tsx's comment. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={article.imageUrl} alt="" width={640} height={400} loading="lazy" decoding="async" />
                      </span>
                    )}
                    {figure && (
                      <span className="hp-lana-figure-block">
                        <span className="lana-pull-figure hp-lana-figure">{figure.value}</span>
                        {figure.caption && <span className="hp-lana-figure-caption">{figure.caption}</span>}
                      </span>
                    )}
                    <h3>{article.title}</h3>
                    <span className="lana-folder-card-foot">
                      <span className={`lana-stamp lana-stamp-${status}`}>
                        {status === 'abierto' ? 'Caso abierto' : 'Archivado'}
                      </span>
                      <span className="hp-lana-time">{article.readingTime || 1} min de lectura</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <Link className="hp-lana-tfbr reveal" href="/futbol-business-review">
          <span className="hp-lana-tfbr-name">{tfbr?.title || 'The Futbol Business Review'}</span>
          <span className="hp-lana-tfbr-copy">
            {tfbr?.excerpt || 'El fútbol en el mercado hispano de Estados Unidos, analizado con Interticket.'}
          </span>
          <span className="hp-lana-tfbr-go" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
