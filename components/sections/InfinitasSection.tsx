import Link from 'next/link';
import type { Article } from '@/lib/data/articles';
import type { InfinitasCard, SiteContentData } from '@/lib/data/site-content';
import { articlePath } from '@/lib/article-url';
import { safeUrl } from '@/lib/safe-url';
import { AdSlot } from '@/components/ads/AdSlot';

// "El Marcador en portada" (2026-08-14 redesign, user directive: the old
// three-column dark-overlay photo grid read flatter than the rest of the
// homepage's editorial system, and its eyebrow dot was even green). The
// section now speaks the same language as the /infinitas hub after its
// same-day tint reduction: violet as ACCENT on the site's own paper — a
// thick top rule, the lowercase wordmark, a clean editorial split lead
// (photo with violet baseline, serif headline), and the side stories as a
// scoreboard-numbered ranking list, which is the product's thesis
// ("women's sports as a business force") expressed as layout. Data shape
// (featured + sideCards) and the CMS Infinitas tab are untouched.
// Classes are infsec-* — the old inf-* block in sections.css is gone, but
// the prefix stays distinct from the hub's infhub-* on purpose (the
// 2026-08-05 collision lesson).
//
// ——— 2026-10-27: the cards come from PUBLISHED ARTICLES (source='infinitas'),
// the same move El Expediente made for La Lana. The CMS cards had been
// hand-picked once in September and never updated, and "Ir a Infinitas"
// went to the Substack root. Now the lead and the two rows are the three
// latest Infinitas notes, everything links on-site (/articulo/…, and the
// head link to the /infinitas hub), and each click sends hp_click_infinitas.
// The CMS cards stay as the fallback for an empty source, and the tab still
// edits the heading, sub and link label.
const LIVE_CARDS = 3;

type Card = InfinitasCard & { internal: boolean };

function fromArticle(a: Article): Card {
  return {
    eyebrow: a.dateFormatted ? `Infinitas · ${a.dateFormatted}` : 'Infinitas',
    title: a.title,
    body: a.excerpt,
    image: a.imageUrl,
    url: articlePath(a.id),
    internal: true,
  };
}

// Internal cards navigate in-app; only the CMS fallback's URLs are external.
function CardLink({ card, className, children }: { card: Card; className: string; children: React.ReactNode }) {
  return card.internal ? (
    <Link className={className} href={card.url} data-analytics="hp_click_infinitas" data-source="infinitas">
      {children}
    </Link>
  ) : (
    <a className={className} href={safeUrl(card.url)} target="_blank" rel="noopener noreferrer" data-analytics="hp_click_infinitas">
      {children}
    </a>
  );
}

function InfinitasSideRow({ card, index }: { card: Card; index: number }) {
  return (
    <CardLink card={card} className="infsec-row reveal">
      <span className="infsec-num" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="infsec-row-copy">
        <span className="eyebrow">{card.eyebrow}</span>
        <h4>{card.title}</h4>
      </span>
      {card.image && (
        // Editor-supplied URL, arbitrary host -- see AboutSection.tsx's comment.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="infsec-thumb" src={card.image} width={368} height={276} alt="" loading="lazy" decoding="async" />
      )}
    </CardLink>
  );
}

export function InfinitasSection({
  data,
  articles = [],
}: {
  data: SiteContentData['infinitasSection'];
  /** Every published article; the section keeps the source='infinitas' ones. */
  articles?: Article[];
}) {
  const live = articles
    .filter(a => a.source === 'infinitas')
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id))
    .slice(0, LIVE_CARDS)
    .map(fromArticle);
  const [lead, ...side]: Card[] = live.length
    ? live
    : [data.featured, ...data.sideCards].map(c => ({ ...c, internal: false }));
  // When the CMS heading is just the brand name, the h2 IS the wordmark —
  // rendering a violet "infinitas" directly above an uppercase "INFINITAS"
  // read as a stutter (caught on the first screenshot pass). A custom
  // heading gets the small wordmark above it as the section brand.
  const headingIsBrand = data.heading.trim().toLowerCase() === 'infinitas';
  return (
    <section className="container infsec" id="infinitas">
      <div className="infsec-mast reveal">
        {!headingIsBrand && (
          <span className="infsec-wordmark" aria-hidden="true">
            infinitas
          </span>
        )}
        <div className="section-head infsec-head">
          <div>
            <h2 className={headingIsBrand ? 'infsec-heading-brand' : undefined}>{data.heading}</h2>
            <p className="sub">{data.sub}</p>
          </div>
          {live.length ? (
            <Link className="section-link" href="/infinitas" data-analytics="hp_click_infinitas">
              {data.linkLabel}
            </Link>
          ) : (
            <a className="section-link" href={safeUrl(data.linkUrl)} target="_blank" rel="noopener noreferrer">
              {data.linkLabel}
            </a>
          )}
        </div>
      </div>

      <div className="infsec-grid">
        {lead && (
          <CardLink card={lead} className="infsec-lead reveal">
            {lead.image && (
              <span className="infsec-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lead.image} width={1200} height={675} alt="" loading="lazy" decoding="async" />
              </span>
            )}
            <span className="infsec-lead-copy">
              <span className="eyebrow">{lead.eyebrow}</span>
              <h3>{lead.title}</h3>
              {lead.body && <p>{lead.body}</p>}
              <span className="infsec-cta">Leer la historia →</span>
            </span>
          </CardLink>
        )}

        <div className="infsec-rows">
          {side.map((card, i) => (
            <InfinitasSideRow key={i} card={card} index={i} />
          ))}
        </div>
      </div>

      <AdSlot slot="vertical-sponsor-infinitas" />
    </section>
  );
}
