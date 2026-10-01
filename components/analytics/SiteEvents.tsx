'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { homepageEvent, productForSource, resolvePageProduct, trackEvent } from '@/lib/analytics-events';

// Three site-wide behaviours that would otherwise mean touching dozens of
// components: every outbound link, every taxonomy chip, and any element that
// declares its own event with `data-analytics` (the homepage modules, 2026-10-01).
//
// DELEGATED, not per-component, for a specific reason. The taxonomy chips
// are rendered in two places -- components/article/TagPillRow.tsx (a SERVER
// component, on cards and archive rows) and components/article/
// ArticleTopics.tsx (the article foot) -- and outbound links are scattered
// across the article CTA, the sidebar, the hub modules and article bodies
// that are raw HTML strings (lib/article-devices.ts), which have no React
// components to attach handlers to at all. One listener on document catches
// every case including the raw-HTML ones, and crucially keeps TagPillRow a
// server component: converting it just to add an onClick would ship the
// whole card tree to the client for one analytics call.
//
// Listener is passive and never calls preventDefault -- navigation must
// behave identically whether or not analytics is loaded or blocked.

// Both classes render the same thing (a /tema link carrying data-tier);
// they differ only in visual language -- square chips at the article foot,
// quiet text links on cards. See each component for why.
const TAG_SELECTOR = 'a.tag-topic, a.topic-chip';

function isOutbound(anchor: HTMLAnchorElement): boolean {
  // anchor.protocol/hostname are resolved against the document, so relative
  // hrefs correctly report the current host rather than parsing as invalid.
  if (anchor.protocol !== 'http:' && anchor.protocol !== 'https:') return false;
  return anchor.hostname !== window.location.hostname;
}

export function SiteEvents() {
  const pathname = usePathname();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const tagLink = target.closest(TAG_SELECTOR);
      if (tagLink instanceof HTMLAnchorElement) {
        trackEvent('tag_nav_click', {
          tier: tagLink.dataset.tier ?? 'unknown',
          tag: tagLink.textContent?.trim().slice(0, 100) ?? '',
          product: resolvePageProduct(pathname),
        });
        return;
      }

      // Self-declared events. The element names what it is; this file owns
      // the sending. That keeps LeadStory, NewsRow, the sidebar and the
      // Temas row as SERVER components — attaching an onClick to each would
      // have shipped the whole homepage card tree to the client for one
      // analytics call, which is the same reasoning as the chips above.
      //
      // No `return` afterwards, unlike the chip branch: an off-site deal
      // link in El Marcador is both a homepage-module click and a traffic
      // leak, and those are two different questions. Both events fire; they
      // carry different names, so nothing is double-counted.
      const declared = target.closest('[data-analytics]');
      if (declared) {
        const name = homepageEvent(declared.getAttribute('data-analytics'));
        if (name) {
          // The headline alone, not the whole card: textContent on a story
          // card concatenates badge + title + byline into
          // "FinanzasSin Champions, el AC Milan pierde…30 sep 2026 · 4 min",
          // which burns most of GA4's 100 chars before reaching the part
          // that identifies the story. The rail cards have no heading, so
          // they fall back to the full text.
          const heading = declared.querySelector('h1, h2, h3, h4')?.textContent?.trim();
          // The destination's product, read from the `data-source` the story
          // surfaces already carry for their own styling — so "the homepage
          // list sends most of its clicks to La Lana" is one group-by rather
          // than a guess. The rail modules and the Temas chips have no
          // source, and fall back to the page's product: on "/" that is
          // 'unknown', which is honest — the homepage is not a product.
          const source = declared.closest('[data-source]')?.getAttribute('data-source');
          trackEvent(name, {
            link_url: declared.getAttribute('href')?.slice(0, 100),
            link_text: (heading || declared.textContent?.trim())?.slice(0, 100) || undefined,
            product: source ? productForSource(source) : resolvePageProduct(pathname),
          });
        }
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || !isOutbound(anchor)) return;

      trackEvent('outbound_click', {
        // Full href is capped at GA4's 100-char parameter limit; the host
        // is sent separately so "where does our traffic leak to" stays a
        // clean group-by even when a long URL is truncated.
        link_url: anchor.href.slice(0, 100),
        link_host: anchor.hostname,
        // Substack is the publication's other living surface, not a generic
        // outbound link -- worth being able to isolate in one filter.
        is_substack: anchor.hostname.endsWith('substack.com'),
        product: resolvePageProduct(pathname),
      });
    }

    // Capture phase: a click on a chip inside an element that stops
    // propagation (the article-foot disclosure intercepts its own summary
    // clicks) would never reach a bubble-phase listener on document.
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [pathname]);

  return null;
}
