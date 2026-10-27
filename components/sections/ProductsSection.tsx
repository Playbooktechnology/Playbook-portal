import type { ProductCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { PRODUCT_HUBS } from '@/lib/product-hubs';

// Products can point either at an internal collection page (e.g. /archivo?
// source=...) or an external destination (Substack, a partner site) — only
// the latter should force a new tab; a same-site link behaves like every
// other internal <a> on the portal.
function isExternalUrl(url: string) {
  return /^https?:/i.test(url.trim());
}

// A card whose URL points at a product hub previews that hub's identity on
// hover (La Portada, 2026-08-05): accent color + the concept's name
// sliding in ("El Trago", "El Expediente"…). Derived from the CMS-edited
// URL rather than card position, so editorial reordering the cards — or
// pointing one back at Substack — degrades to the plain card instead of
// wearing the wrong skin.
function hubForCardUrl(url: string) {
  let path: string;
  try {
    path = (isExternalUrl(url) ? new URL(url).pathname : url).split(/[?#]/)[0];
  } catch {
    return null; // malformed CMS URL — plain card, never a crash
  }
  return PRODUCT_HUBS.find(h => h.path === path) ?? null;
}

// A8 (2026-10-27): Infinitas's concept is internally called "El Marcador",
// which on the homepage read as a second El Marcador next to El Marcador de
// Negocios. Its card no longer prints it; the other three keep theirs, and the
// line under the heading says what each one is.
//
// BORRADOR — texto para ajustar por la redacción.
const CONCEPTS_LINE =
  'El Trago son las noticias del día, servidas cortas. El Expediente abre un caso de La Lana del Deporte con sus cifras. La Sala de Juntas es la mesa de negocio de The Futbol Business Review.';

function ProductCardView({ product }: { product: ProductCard }) {
  const href = safeUrl(product.url);
  const external = isExternalUrl(product.url);
  const hub = hubForCardUrl(product.url);
  return (
    <a
      className="product reveal"
      href={href}
      {...(hub ? { 'data-hub': hub.source } : {})}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {product.variant === 'glyph' ? (
        <div className="product-mark">
          <span className="glyph" aria-hidden="true">{product.glyph}</span>
          <span className="word">{product.wordmark}</span>
        </div>
      ) : (
        // Editor-supplied URL, arbitrary host -- see AboutSection.tsx's comment.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="product-banner" src={product.image} width={900} height={160} alt={product.imageAlt || ''} loading="lazy" decoding="async" />
      )}
      <div className="product-copy">
        <p>{product.description}</p>
        {product.meta && <span className="meta">{product.meta}</span>}
        <span className="product-foot">
          {hub && hub.source !== 'infinitas' && (
            <span className="product-concept" aria-hidden="true">{hub.concept}</span>
          )}
          <span className="product-arrow" aria-hidden="true">→</span>
        </span>
      </div>
    </a>
  );
}

export function ProductsSection({ data }: { data: SiteContentData['productsSection'] }) {
  return (
    <section className="products" id="newsletters">
      <div className="container" style={{ padding: '44px 24px' }}>
        <div className="section-head reveal" style={{ paddingTop: 0 }}>
          <div>
            <h2>{data.heading}</h2>
            <p className="sub">{CONCEPTS_LINE}</p>
          </div>
        </div>
        <div className="product-grid">
          {data.products.map((p, i) => (
            <ProductCardView key={i} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
