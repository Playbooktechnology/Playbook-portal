import Link from 'next/link';
import { getAllDeals } from '@/lib/data/deals';
import {
  DEAL_TYPE_LABEL,
  dealAmountLabel,
  dealTitle,
  featuredFigures,
  featuredKicker,
  formatUsdShort,
  isoWeek,
  railDeals,
  selectFeatured,
  todayInMexico,
  weekLabel,
  yearTotal,
} from '@/lib/deals';
import { DealLink } from '@/components/marcador/DealLink';

// ——— "El Marcador de Negocios" (sidebar module, replaced El tablero de la
// FIFA 2026-09-23). Reads the `deals` table through lib/data/deals.ts, on the
// same 60s tagged cache as the articles pool, so saving a deal in /admin shows
// up here without a deploy.
//
// Never blank between weekly updates: with nothing flagged this week the card
// shows the last flagged deal for up to two weeks, then the newest confirmed
// deal (lib/deals.ts selectFeatured says which, and the kicker says so), and the list
// below falls back to the latest deals. Renders nothing only when the table
// is empty.
export async function DealsBoard() {
  const deals = await getAllDeals();
  const today = todayInMexico();
  const week = isoWeek(today);
  const pick = selectFeatured(deals, today);
  if (!pick) return null;

  const featured = pick.deal;
  const label = weekLabel(deals, today);
  const rail = railDeals(deals, week, featured.id);
  const year = Number(today.slice(0, 4));
  const { total, count } = yearTotal(deals, year);

  return (
    <section className="side-module side-deals" aria-labelledby="side-deals-title">
      <div className="side-deals-head">
        <h2 className="side-title" id="side-deals-title">El Marcador de Negocios</h2>
        <span className="side-deals-week">{label.short}</span>
      </div>

      <article className="side-deals-card">
        <p className="side-deals-kicker">
          {featuredKicker(pick)}
        </p>
        <h3 className="side-deals-name">{dealTitle(featured)}</h3>
        {featured.summary && <p className="side-deals-summary">{featured.summary}</p>}
        <dl className="side-deals-figures">
          {featuredFigures(featured).map(f => (
            <div key={f.label} className="side-deals-figure">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <DealLink href={featured.articleUrl || '/marcador'} className="side-deals-read" analyticsEvent="hp_click_marcador">
          Leer el análisis →
        </DealLink>
      </article>

      {rail.deals.length > 0 && (
        <>
          <p className="side-deals-sub">{rail.thisWeek ? 'También esta semana' : 'Lo más reciente'}</p>
          <ul className="side-deals-list">
            {rail.deals.map(d => (
              <li key={d.id}>
                <DealLink href={d.articleUrl || '/marcador'} className="side-deals-row" analyticsEvent="hp_click_marcador">
                  <span className="side-deals-row-name">{dealTitle(d)}</span>
                  <span className="side-deals-row-amount">{dealAmountLabel(d)}</span>
                  <span className="side-deals-row-type">{DEAL_TYPE_LABEL[d.type] ?? d.type}</span>
                </DealLink>
              </li>
            ))}
          </ul>
        </>
      )}

      {count > 0 && (
        <p className="side-deals-total">
          <span className="side-deals-total-value">{formatUsdShort(total)}</span>
          <span>
            en {count} {count === 1 ? 'acuerdo confirmado' : 'acuerdos confirmados'} en {year}
          </span>
        </p>
      )}

      <Link className="side-deals-cta" data-analytics="hp_click_marcador" href="/marcador">
        Ver el marcador completo →
      </Link>
    </section>
  );
}
