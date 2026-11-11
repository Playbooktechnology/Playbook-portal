import type { Metadata } from 'next';
import Link from 'next/link';
import { getAcuerdosPublicos } from '@/lib/data/marcador';
import { MARCADOR_ARCHIVE_AFTER_DAYS, todayInMexico } from '@/lib/deals';
import {
  ALCANCE_LABEL,
  DEPORTE_LABEL,
  ESTATUS_LABEL,
  TIPO_LABEL,
  activeWeek,
  countByTipo,
  dateLabel,
  daysBetween,
  heroFigure,
  lastUpdated,
  montoCell,
  paisLabel,
  pickFeatured,
  siteHref,
  topAcuerdos,
  weekScore,
  yearKpis,
} from '@/lib/marcador';
import { SITE_URL } from '@/lib/site-url';
import { MarcadorTable } from '@/components/marcador/MarcadorTable';
import { DealLink } from '@/components/marcador/DealLink';
import { NewsletterForm } from '@/components/shared/NewsletterForm';

// /marcador — the full view behind the homepage's "El Marcador de Negocios"
// (components/home/MarcadorWidget.tsx). v2 since 2026-11-11: same source
// (data/marcador.json, only cumple_criterio: true) and the same rules
// (lib/marcador.ts) as the widget, so the two surfaces can't disagree on the
// week, the featured deal or a number.

export const metadata: Metadata = {
  title: 'El Marcador de Negocios',
  description:
    'Los acuerdos comerciales que mueven el negocio del deporte, registrados semana a semana: ' +
    'patrocinios, derechos de transmisión, propiedad, retail e infraestructura.',
  alternates: { canonical: `${SITE_URL}/marcador` },
  robots: { index: true, follow: true },
};

function millones(m: number): string {
  return `US$${Math.round(m).toLocaleString('en-US')} millones`;
}

export default function MarcadorPage() {
  const acuerdos = getAcuerdosPublicos();
  const today = todayInMexico();
  const year = today.slice(0, 4);
  const latest = lastUpdated(acuerdos);
  const archive = !latest || daysBetween(latest, today) > MARCADOR_ARCHIVE_AFTER_DAYS;
  const week = archive ? null : activeWeek(acuerdos, today);
  const score = week && weekScore(week);
  const featured = week && pickFeatured(week);
  const hero = featured && heroFigure(featured);
  const kpis = yearKpis(acuerdos, year);
  const top = topAcuerdos(acuerdos, year);
  const byTipo = countByTipo(acuerdos, year);
  const maxTipo = Math.max(1, ...byTipo.map(t => t.count));

  return (
    <main className="container mk-page" id="marcador-main">
      <header className="mk-hero">
        <p className="mk-kicker">Playbook · Datos</p>
        <h1>El Marcador de Negocios</h1>
        <p className="mk-dek">
          Los acuerdos comerciales que mueven el negocio del deporte, registrados semana a semana:
          patrocinios, derechos de transmisión, propiedad, retail e infraestructura.
        </p>
        <p className="mk-updated">
          {week
            ? `Semana ${week.week} · ${dateLabel(week.start)} al ${dateLabel(week.end)}`
            : latest && `Último acuerdo registrado: ${dateLabel(latest)}`}
        </p>
      </header>

      {acuerdos.length === 0 ? (
        <p className="mk-empty mk-empty--page">Todavía no hay acuerdos registrados.</p>
      ) : (
        <>
          {week && score && (
            <section className="mk-week" aria-labelledby="mk-week-title">
              <h2 className="visually-hidden" id="mk-week-title">
                La semana {week.week}
              </h2>
              {/* dt before dd (valid dl grouping); column-reverse puts the number on top. */}
              <dl className="side-mk-score mk-week-score">
                <div>
                  <dt>{score.acuerdos === 1 ? 'acuerdo esta semana' : 'acuerdos esta semana'}</dt>
                  <dd>{score.acuerdos}</dd>
                </div>
                <div>
                  <dt>en México</dt>
                  <dd>{score.mexico}</dd>
                </div>
                <div>
                  <dt>{score.reportados === 1 ? 'reportado' : 'reportados'}</dt>
                  <dd>{score.reportados}</dd>
                </div>
              </dl>

              {featured && (
                <article className="mk-featured" aria-labelledby="mk-featured-title">
                  <div className="mk-featured-main">
                    <p className="side-mk-tags">
                      <span className="side-mk-tag side-mk-tag--lead">Acuerdo de la semana</span>
                      <span className="side-mk-tag">{ALCANCE_LABEL[featured.alcance]}</span>
                      <span className="side-mk-tag">{TIPO_LABEL[featured.tipo]}</span>
                    </p>
                    <h2 id="mk-featured-title" className="mk-featured-name">
                      {featured.titulo}
                    </h2>
                    {hero && (
                      <p className="side-mk-hero mk-featured-hero">
                        <span className="side-mk-hero-value">{hero.valor}</span>
                        <span className="side-mk-hero-label">{hero.etiqueta}</span>
                      </p>
                    )}
                    <p className="mk-featured-summary">{featured.resumen}</p>
                    <p className="mk-featured-meta">
                      {[paisLabel(featured), DEPORTE_LABEL[featured.deporte] ?? featured.deporte, featured.duracion, ESTATUS_LABEL[featured.estatus]]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <DealLink href={siteHref(featured.url)} className="side-mk-read">
                      Leer el análisis →
                    </DealLink>
                  </div>
                  {/* Only an approved reading; lectura_borrador never renders. */}
                  {featured.lectura && (
                    <aside className="mk-featured-read">
                      <p className="mk-featured-read-label">Lectura Playbook</p>
                      <p>{featured.lectura}</p>
                    </aside>
                  )}
                </article>
              )}
            </section>
          )}

          <section className="mk-stats" aria-label={`Las cifras de ${year}`}>
            <div className="mk-stat">
              <span className="mk-stat-value mk-stat-value--chip">{millones(kpis.sumaUsdM)}</span>
              <span className="mk-stat-label">
                en {kpis.conMonto} {kpis.conMonto === 1 ? 'acuerdo' : 'acuerdos'} con monto revelado (de {kpis.registrados}{' '}
                registrados)
              </span>
            </div>
            <div className="mk-stat">
              <span className="mk-stat-value">{kpis.registrados}</span>
              <span className="mk-stat-label">acuerdos registrados en {year}</span>
            </div>
            <div className="mk-stat">
              <span className="mk-stat-value">{kpis.registrados ? Math.round((100 * kpis.conMonto) / kpis.registrados) : 0}%</span>
              <span className="mk-stat-label">revelaron su monto</span>
            </div>
            <div className="mk-stat">
              <span className="mk-stat-value">{kpis.paises}</span>
              <span className="mk-stat-label">{kpis.paises === 1 ? 'país' : 'países'} con acuerdos</span>
            </div>
          </section>

          <section className="mk-section" aria-labelledby="mk-all-title">
            <h2 className="mk-section-title" id="mk-all-title">Todos los acuerdos</h2>
            <MarcadorTable acuerdos={acuerdos} today={today} />
          </section>

          <div className="mk-split">
            <section className="mk-section" aria-labelledby="mk-top-title">
              <h2 className="mk-section-title" id="mk-top-title">Top 5 de {year}</h2>
              {top.length === 0 ? (
                <p className="mk-empty">Ningún acuerdo de {year} tiene monto todavía.</p>
              ) : (
                <ol className="mk-top">
                  {top.map((a, i) => {
                    const monto = montoCell(a);
                    return (
                      <li key={a.id} className="mk-top-item">
                        <span className="mk-top-rank">{i + 1}</span>
                        <DealLink href={siteHref(a.url)} className="mk-top-link">
                          <span className="mk-top-name">{a.titulo}</span>
                          <span className="mk-top-meta">
                            {TIPO_LABEL[a.tipo]} · {ALCANCE_LABEL[a.alcance]} · {dateLabel(a.fecha)}
                          </span>
                        </DealLink>
                        <span className="mk-top-amount">
                          {monto.valor}
                          {monto.nota && <small className="mk-amount-note">{monto.nota}</small>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="mk-section" aria-labelledby="mk-types-title">
              <h2 className="mk-section-title" id="mk-types-title">Acuerdos por tipo en {year}</h2>
              <ul className="mk-types">
                {byTipo.map(t => (
                  <li key={t.key} className="mk-type">
                    <span className="mk-type-label">{t.label}</span>
                    <span className="mk-type-bar" aria-hidden="true">
                      <span className="mk-type-fill" style={{ width: `${(100 * t.count) / maxTipo}%` }} />
                    </span>
                    <span className="mk-type-count">{t.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      <section className="mk-method" id="metodologia" aria-labelledby="mk-method-title">
        <h2 id="mk-method-title">Metodología</h2>
        <h3>Qué entra</h3>
        <ul>
          <li>
            Patrocinios principales o de categoría relevante: camiseta, naming, título y socios oficiales de ligas,
            eventos o federaciones.
          </li>
          <li>Derechos de transmisión, incluidas sublicencias y acuerdos de producción y distribución.</li>
          <li>
            Compra o venta de participación en propiedades deportivas: equipos, ligas, eventos y plataformas
            deportivas.
          </li>
          <li>Retail y licencias de marcas deportivas.</li>
          <li>Infraestructura con operador deportivo: estadios, arenas y el naming de sus recintos.</li>
        </ul>
        <h3>Qué no entra</h3>
        <ul>
          <li>Fusiones y adquisiciones entre operadores de apuestas sin una propiedad deportiva de por medio.</li>
          <li>Fichajes y contratos de jugadores, pilotos o entrenadores.</li>
          <li>Proveedores menores y acuerdos sin una fuente verificable.</li>
          <li>Si hay duda, el acuerdo se registra pero no se muestra ni cuenta hasta resolverla.</li>
        </ul>
        <h3>Montos</h3>
        <ul>
          <li>
            Los montos están en dólares estadounidenses. Si el anuncio fue en otra moneda, lo convertimos con el tipo
            de cambio del Banco Central Europeo del día del anuncio.
          </li>
          <li>
            Solo sumamos montos <strong>revelados</strong>: los que anunció alguna de las partes o un documento
            regulatorio. Los <strong>reportados</strong> (publicados por un medio) y los <strong>estimados</strong> se
            muestran con su etiqueta y no se suman. Si nadie publicó la cifra, aparece como N/R: nunca estimamos
            montos por nuestra cuenta.
          </li>
        </ul>
        <h3>Estatus y alcance</h3>
        <ul>
          <li>
            <strong>Anunciado:</strong> las partes lo anunciaron, pero falta firma, cierre o aprobación.{' '}
            <strong>Reportado:</strong> lo publicó un medio sin confirmación oficial. <strong>Confirmado:</strong> las
            partes confirman el acuerdo. <strong>Cerrado:</strong> la compraventa se completó.
          </li>
          <li>
            <strong>Alcance:</strong> México si al menos una parte es mexicana o el acuerdo opera en México; Latam si es
            de otro país latinoamericano; Global si las partes o el efecto son multinacionales; si no, EE. UU. o Europa.
          </li>
          <li>
            La semana va de lunes a domingo, en hora de Ciudad de México. Si la semana en curso todavía no tiene
            acuerdos, mostramos la última semana con actividad.
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
