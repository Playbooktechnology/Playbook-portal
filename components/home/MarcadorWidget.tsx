import Link from 'next/link';
import type { Acuerdo } from '@/lib/marcador-schema';
import {
  ALCANCE_LABEL,
  TIPO_LABEL,
  activeWeek,
  dateLabel,
  dayLabel,
  heroFigure,
  isArchive,
  lastUpdated,
  montoCell,
  featuredTag,
  pickFeatured,
  registeredInYear,
  resumenCorto,
  rowDeals,
  rowDescription,
  siteHref,
  weekScore,
} from '@/lib/marcador';
import { DealLink } from '@/components/marcador/DealLink';

// ——— El Marcador de Negocios v2 (Fase 4, 2026-11-11). Reference:
// docs/referencias/playbook-home.html, block id="marcador". Pure: it gets the
// public records and today's CDMX date, so scripts/test-frescura.ts renders
// it on simulated dates. components/home/DealsBoard.tsx loads the data.
//
// Two modes:
//   activo  — the most recent week with deals: score, featured card, four
//             rows, footer. A week with nothing loaded yet shows the last
//             week that had activity.
//   archivo — the newest deal is more than 10 days old: no week, no score,
//             no card; the four newest deals with their real dates (Fase 2).
//
// Mobile (≤640px, styles/portada.css): score + card + the first row, and the
// CTA becomes "Ver los N acuerdos →".
export function MarcadorWidget({ acuerdos, today }: { acuerdos: Acuerdo[]; today: string }) {
  const latest = lastUpdated(acuerdos);
  if (!latest) return null;
  const year = today.slice(0, 4);
  const registered = registeredInYear(acuerdos, year);

  const footer = (
    <p className="side-mk-foot">
      Actualizado {dayLabel(latest)} · {registered} {registered === 1 ? 'acuerdo registrado' : 'acuerdos registrados'} en {year} ·{' '}
      <Link href="/marcador#metodologia">Metodología</Link>
    </p>
  );
  const cta = (
    <>
      <Link className="side-mk-cta side-mk-cta--full" data-analytics="hp_click_marcador" href="/marcador">
        Ver el marcador completo →
      </Link>
      <Link className="side-mk-cta side-mk-cta--compact" data-analytics="hp_click_marcador" href="/marcador">
        Ver los {registered} acuerdos →
      </Link>
    </>
  );

  if (isArchive(acuerdos, today)) {
    return (
      <section className="side-module side-mk side-mk--archive" aria-labelledby="side-mk-title">
        <div className="side-mk-head">
          <h2 className="side-title" id="side-mk-title">El Marcador de Negocios</h2>
        </div>
        <p className="side-mk-sub">Los acuerdos de {year}</p>
        <ul className="side-mk-rows">
          {[...acuerdos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 4).map((a, i) => (
            <Row key={a.id} acuerdo={a} extra={i > 0} withDate />
          ))}
        </ul>
        {cta}
        {footer}
      </section>
    );
  }

  const week = activeWeek(acuerdos, today)!;
  const score = weekScore(week);
  const featured = pickFeatured(week, acuerdos);
  const rows = rowDeals(acuerdos, week, featured?.id ?? null);
  const hero = featured && heroFigure(featured);

  return (
    <section className="side-module side-mk" aria-labelledby="side-mk-title">
      <div className="side-mk-head">
        <h2 className="side-title" id="side-mk-title">El Marcador de Negocios</h2>
        <span className="side-mk-week">Semana {week.week}</span>
      </div>

      {/* dt before dd (valid dl grouping); column-reverse puts the number on top. */}
      <dl className="side-mk-score">
        <div>
          <dt>{score.acuerdos === 1 ? 'acuerdo' : 'acuerdos'}</dt>
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
        <article className="side-mk-deal">
          <p className="side-mk-tags">
            <span className="side-mk-tag side-mk-tag--lead">{featuredTag(featured, week)}</span>
            <span className="side-mk-tag">{ALCANCE_LABEL[featured.alcance]}</span>
            <span className="side-mk-tag">{TIPO_LABEL[featured.tipo]}</span>
          </p>
          <h3 className="side-mk-name">{featured.titulo}</h3>
          {hero && (
            <p className="side-mk-hero">
              <span className="side-mk-hero-value">{hero.valor}</span>
              <span className="side-mk-hero-label">{hero.etiqueta}</span>
            </p>
          )}
          <p className="side-mk-summary">{resumenCorto(featured.resumen)}</p>
          {/* Only an approved reading. lectura_borrador never renders. */}
          {featured.lectura && (
            <p className="side-mk-lectura">
              <b>Lectura Playbook:</b> {featured.lectura}
            </p>
          )}
          <DealLink href={siteHref(featured.url)} className="side-mk-read" analyticsEvent="hp_click_marcador">
            Leer el análisis →
          </DealLink>
        </article>
      )}

      {rows.length > 0 && (
        <ul className="side-mk-rows">
          {rows.map((a, i) => (
            <Row key={a.id} acuerdo={a} extra={i > 0} withDate={a.fecha < week.start} />
          ))}
        </ul>
      )}
      {cta}
      {footer}
    </section>
  );
}

function Row({ acuerdo: a, extra, withDate }: { acuerdo: Acuerdo; extra: boolean; withDate: boolean }) {
  const monto = montoCell(a);
  return (
    <li className={extra ? 'side-mk-row-item side-mk-row-item--extra' : 'side-mk-row-item'}>
      <DealLink href={siteHref(a.url)} className="side-mk-row" analyticsEvent="hp_click_marcador">
        <span className="side-mk-row-main">
          <span className="side-mk-row-name">{a.titulo}</span>
          <span className={a.alcance === 'mexico' ? 'side-mk-scope side-mk-scope--mx' : 'side-mk-scope'}>{ALCANCE_LABEL[a.alcance]}</span>
          <span className="side-mk-row-desc">
            {withDate && (
              <>
                <time dateTime={a.fecha}>{dateLabel(a.fecha)}</time> ·{' '}
              </>
            )}
            {rowDescription(a)}
          </span>
        </span>
        <span className="side-mk-row-amount">
          {monto.valor}
          {monto.nota && <small>{monto.nota}</small>}
        </span>
      </DealLink>
    </li>
  );
}
