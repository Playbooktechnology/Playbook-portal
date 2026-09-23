import type { ReactNode } from 'react';
import Link from 'next/link';
import { safeUrl } from '@/lib/safe-url';

// Deal links are editor input: scheme-checked through safeUrl, and anything
// pointing off-site (a deal reported by another outlet) opens in a new tab.
export function DealLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const url = safeUrl(href) || '/marcador';
  if (/^https?:/i.test(url)) {
    return (
      <a className={className} href={url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={url}>
      {children}
    </Link>
  );
}
