import { getPublicArticles } from '@/lib/data/articles';
import { todayInMexico, shortDate } from '@/lib/deals';
import { MIX_POSITIONS, mixHistory, type MixKind } from '@/lib/home-mix';

// /admin/mezcla — vista interna (A10): cuántas de las primeras posiciones de
// portada son México o LATAM, día por día, y si la nota principal lo es.
// Solo editores (el layout de (protected) lo exige) y fuera del sitemap.

export const metadata = { title: 'Mezcla México/LATAM', robots: { index: false, follow: false } };

const KIND_LABEL: Record<MixKind, string> = { mexico: 'México', latam: 'LATAM (est.)', otro: 'Resto' };

export default async function MixPage() {
  const articles = await getPublicArticles();
  const today = todayInMexico();
  const history = mixHistory(articles, today);
  const [now] = history;

  return (
    <main className="admin-main mix-main">
      <h1 className="admin-section-title">Mezcla México / LATAM en portada</h1>
      <p className="field-help mix-help">
        Primeras {MIX_POSITIONS} posiciones (hero + lista). México = etiqueta de alcance «Nacional». LATAM no tiene
        etiqueta todavía: se estima por países y torneos en titular y bajada. Hoy es la portada en este momento; los
        días anteriores se reconstruyen a las 9:00 (CDMX) con la misma regla de orden.
      </p>

      <table className="mix-table">
        <thead>
          <tr>
            <th>Día</th>
            <th>México</th>
            <th>LATAM (est.)</th>
            <th>México + LATAM</th>
            <th>Nota principal</th>
          </tr>
        </thead>
        <tbody>
          {history.map((d, i) => (
            <tr key={d.day}>
              <td>{i === 0 ? `Hoy (${shortDate(d.day)})` : shortDate(d.day)}</td>
              <td>
                {d.mexico}/{d.total}
              </td>
              <td>
                {d.latam}/{d.total}
              </td>
              <td>
                <b>
                  {d.mexico + d.latam}/{d.total}
                </b>
              </td>
              <td>{d.lead ? KIND_LABEL[d.lead] : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="admin-section-title">Portada ahora</h2>
      <ol className="mix-list">
        {now.items.map(item => (
          <li key={item.id} data-kind={item.kind}>
            <span className="mix-kind">{KIND_LABEL[item.kind]}</span> {item.title}
          </li>
        ))}
      </ol>
    </main>
  );
}
