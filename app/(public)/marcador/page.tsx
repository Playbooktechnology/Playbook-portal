import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllDeals } from '@/lib/data/deals';
import {
  DEAL_STATUS_LABEL,
  DEAL_TYPE_LABEL,
  countByType,
  dealAmountLabel,
  dealTitle,
  featuredFigures,
  formatUsdLong,
  isoWeek,
  selectFeatured,
  shortDate,
  todayInMexico,
  topDeals,
  yearStats,
  type DealStatus,
} from '@/lib/deals';
import { SITE_URL } from '@/lib/site-url';
import { DealsTable } from '@/components/marcador/DealsTable';
import { DealLink } from '@/components/marcador/DealLink';
import { NewsletterForm } from '@/components/shared/NewsletterForm';

// /marcador — the full view behind the homepage rail's "El Marcador de
// Negocios" (components/home/DealsBoard.tsx). Same source (the `deals` table
// via lib/data/deals.ts), same week and total rules (lib/deals.ts), so the
// two surfaces can never disagree on a number.

export const metadata: Metadata = {
  title: 'El Marcador de Negocios',
  description:
    'Los acuerdos comerciales del deporte en México y Latinoamérica, semana a semana: patrocinios, ' +
    'derechos de transmisión, retail, inversión y estadios, con monto, duración y estatus.',
  alternates: { canonical: `${SITE_URL}/marcador` },
  robots: { index: true, follow: true },
};

export default async function MarcadorPage() {
  const deals = await getAllDeals();
  const today = todayInMexico();
  const week = isoWeek(today);
  const year = Number(today.slice(0, 4));
  const stats = yearStats(deals, year);
  const featured = selectFeatured(deals, week);
  const featuredThisWeek = !!featured && featured.date >= week.start && featured.date <= week.end;
  const top = topDeals(deals, year);
  const byType = countByType(deals, year);
  const maxType = Math.max(1, ...byType.map(t => t.count));

  return (
    <main className="container mk-page" id="marcador-main">
      <header className="mk-hero">
        <p className="mk-kicker">Playbook · Datos</p>
        <h1>El Marcador de Negocios</h1>
        <p className="mk-dek">
          Los acuerdos comerciales del deporte en México y Latinoamérica, registrados semana a semana:
          quién firmó con quién, por cuánto y por cuánto tiempo.
        </p>
        <p className="mk-updated">
          Semana {week.week} · {shortDate(week.start)} al {shortDate(week.end)}
        </p>
      </header>

      {deals.length === 0 ? (
        <p className="mk-empty mk-empty--page">Todavía no hay acuerdos registrados.</p>
      ) : (
        <>
          <section className="mk-stats" aria-label={`Las cifras de ${year}`}>
            <div className="mk-stat">
              <span className="mk-stat-value mk-stat-value--chip">{formatUsdLong(stats.total)}</span>
              <span className="mk-stat-label">
                acumulado {year} en {stats.countedDeals} {stats.countedDeals === 1 ? 'acuerdo confirmado' : 'acuerdos confirmados'} con monto revelado
              </span>
            </div>
            <div className="mk-stat">
              <span className="mk-stat-value">{stats.tracked}</span>
              <span className="mk-stat-label">acuerdos registrados en {year}</span>
            </div>
            <div className="mk-stat">
              <span className="mk-stat-value">
                {stats.tracked ? Math.round((100 * stats.disclosed) / stats.tracked) : 0}%
              </span>
              <span className="mk-stat-label">revelaron su monto</span>
            </div>
            <div className="mk-stat">
              <span className="mk-stat-value">{stats.countries}</span>
              <span className="mk-stat-label">{stats.countries === 1 ? 'país' : 'países'} con acuerdos</span>
            </div>
          </section>

          {featured && (
            <section className="mk-featured" aria-labelledby="mk-featured-title">
              <div className="mk-featured-main">
                <p className="side-deals-kicker">
                  {featuredThisWeek ? 'El acuerdo de la semana' : `Último destacado · ${shortDate(featured.date)}`}
                </p>
                <h2 id="mk-featured-title" className="mk-featured-name">
                  {dealTitle(featured)}
                </h2>
                {featured.summary && <p className="mk-featured-summary">{featured.summary}</p>}
                <p className="mk-featured-meta">
                  {DEAL_TYPE_LABEL[featured.type] ?? featured.type}
                  {featured.country && ` · ${featured.country}`}
                  {featured.sport && ` · ${featured.sport}`}
                  {` · ${DEAL_STATUS_LABEL[featured.status as DealStatus] ?? featured.status}`}
                </p>
                <dl className="side-deals-figures mk-featured-figures">
                  {featuredFigures(featured).map(f => (
                    <div key={f.label} className="side-deals-figure">
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
                {featured.articleUrl && (
                  <DealLink href={featured.articleUrl} className="side-deals-read">
                    Leer el análisis →
                  </DealLink>
                )}
              </div>
              {featured.playbookRead && (
                <aside className="mk-featured-read">
                  <p className="mk-featured-read-label">La lectura de Playbook</p>
                  <p>{featured.playbookRead}</p>
                </aside>
              )}
            </section>
          )}

          <section className="mk-section" aria-labelledby="mk-all-title">
            <h2 className="mk-section-title" id="mk-all-title">Todos los acuerdos</h2>
            <DealsTable deals={deals} today={today} />
          </section>

          <div className="mk-split">
            <section className="mk-section" aria-labelledby="mk-top-title">
              <h2 className="mk-section-title" id="mk-top-title">Top 5 de {year}</h2>
              {top.length === 0 ? (
                <p className="mk-empty">Ningún acuerdo de {year} ha revelado su monto todavía.</p>
              ) : (
                <ol className="mk-top">
                  {top.map((d, i) => (
                    <li key={d.id} className="mk-top-item">
                      <span className="mk-top-rank">{i + 1}</span>
                      <DealLink href={d.articleUrl || '/marcador'} className="mk-top-link">
                        <span className="mk-top-name">{dealTitle(d)}</span>
                        <span className="mk-top-meta">
                          {DEAL_TYPE_LABEL[d.type] ?? d.type} · {shortDate(d.date)}
                          {d.status === 'reportado' && ' · Reportado'}
                        </span>
                      </DealLink>
                      <span className="mk-top-amount">{dealAmountLabel(d)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="mk-section" aria-labelledby="mk-types-title">
              <h2 className="mk-section-title" id="mk-types-title">Acuerdos por tipo en {year}</h2>
              <ul className="mk-types">
                {byType.map(t => (
                  <li key={t.key} className="mk-type">
                    <span className="mk-type-label">{t.label}</span>
                    <span className="mk-type-bar" aria-hidden="true">
                      <span className="mk-type-fill" style={{ width: `${(100 * t.count) / maxType}%` }} />
                    </span>
                    <span className="mk-type-count">{t.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      <section className="mk-method" aria-labelledby="mk-method-title">
        <h2 id="mk-method-title">Metodología</h2>
        <ul>
          <li>
            Registramos acuerdos comerciales del deporte con impacto en México y Latinoamérica, en cinco
            tipos: patrocinio, derechos de transmisión, retail y licencias, inversión y propiedad, y
            estadios e infraestructura.
          </li>
          <li>
            <strong>Confirmado</strong> significa que al menos una de las partes lo anunció oficialmente.{' '}
            <strong>Reportado</strong> significa que lo publicó un medio sin confirmación oficial.
          </li>
          <li>
            Los montos están en dólares estadounidenses. Si el anuncio fue en otra moneda, lo convertimos con el
            tipo de cambio de referencia del Banco Central Europeo del día del anuncio.
          </li>
          <li>
            Un monto <strong>revelado</strong> es el que anunció alguna de las partes (en un comunicado o ante un
            regulador). Si la cifra solo la publicó la prensa, la mostramos como estimado (con ~). Si nadie la
            publicó, aparece como N/R.
          </li>
          <li>
            El acumulado del año suma solo acuerdos confirmados con monto revelado. Los estimados y los reportados
            se registran, pero no entran en la suma. El top 5 sí incluye estimados, marcados con ~.
          </li>
          <li>
            ¿Falta un acuerdo o hay un dato que corregir? Escríbenos desde <Link href="/contacto">Contacto</Link>.
          </li>
        </ul>
      </section>

      <aside className="article-newsletter-cta mk-newsletter">
        <div className="article-newsletter-cta-copy">
          <h2>
            El marcador, <em>cada semana en tu correo</em>
          </h2>
          <p>Recibe Playbook gratis: los acuerdos que mueven el negocio del deporte y lo que significan.</p>
        </div>
        <NewsletterForm
          placement="marcador"
          formClassName="article-newsletter-cta-form"
          action="https://playbookmedia.substack.com/subscribe"
          emailId="nl-email-marcador"
          emailLabel="Correo electrónico"
          buttonLabel="Suscríbete gratis"
          successMessage="Te abrimos Substack para confirmar tu suscripción."
        />
      </aside>
    </main>
  );
}
