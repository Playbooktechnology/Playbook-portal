import { getMostReadArticles } from '@/lib/most-read';
import { articlePath } from '@/lib/article-url';
import { hubForArticle } from '@/lib/hubs';

// "Lo más leído" — the homepage top 5, sitting in the LEFT column directly
// under the lead story (2026-09-25, publisher's call). It replaces the
// full-width `.mr-band` that used to run under the news package: two
// identical top-5 rankings on one screen is duplication, and the band did
// nothing for the real problem, which is column heights. The rail
// (newsletter + La cifra + El Marcador) measured 1122px against the lead
// story's 636px, leaving a ~460px hole under the hero; this block fills it
// with the left column's own content instead of stretching the rail.
//
// Note this is the THIRD home for the module. It started in the rail, moved
// to a full-width band on 2026-08-06 (an iPad screenshot: in the rail it
// stretched the sidebar far past the 1+5 columns), and lands here. The
// 2026-08-06 objection was specifically about the RAIL — a 300px column
// where five stacked entries tower over everything beside them. The left
// column is the widest one on the page and already anchors the hero, so the
// same five entries read as a continuation of it.
//
// Read counts stay unrendered (standing user directive: "don't open our
// numbers like that") — the ranking is the signal, the numbers are ours.
// Unlike the band, this block shows sección · fecha per entry, since the
// column is wide enough for a real line of metadata.
//
// Renders nothing when neither GA4 nor the first-party read log has data
// (lib/most-read.ts) — the left column then just holds the hero, exactly as
// it does today.
export async function MostReadColumn() {
  const items = await getMostReadArticles();
  if (!items || !items.length) return null;

  return (
    <section className="lr-block" aria-labelledby="lo-mas-leido-title">
      <div className="lr-head">
        <h2 className="side-title" id="lo-mas-leido-title">Lo más leído</h2>
        <span className="lr-window">Últimos 7 días</span>
      </div>
      <ol className="lr-list">
        {items.map(({ article }, i) => (
          <li key={article.id} className="lr-item">
            <a className="lr-link" href={articlePath(article.id)}>
              <span className="lr-rank" aria-hidden="true">{i + 1}</span>
              <span className="lr-body">
                <span className="lr-title">{article.title}</span>
                <span className="lr-meta">
                  {/* Badged by hub destination, same rule as NewsRow: the
                      same piece must not read "Noticias" here and "LFA" on
                      its own page. */}
                  {hubForArticle(article.tagsProperty)?.name ?? article.publication}
                  {' · '}
                  {article.dateFormatted}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
