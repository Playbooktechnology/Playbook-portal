'use client';

import { useEffect } from 'react';

// Logs one read per browser per article per month (app/api/read), the
// client-side replacement for the per-view server logging that kept Neon
// awake (lib/metering.ts, 2026-10-22). localStorage only skips repeats;
// when it is unavailable the server's unique indexes still dedupe.
function monthKey(): string {
  const now = new Date();
  return `pb_reads_${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function ReadBeacon({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = monthKey();
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      seen = [];
    }
    if (seen.includes(articleId)) return;

    fetch('/api/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
      keepalive: true,
    })
      .then(res => {
        if (!res.ok) return;
        try {
          localStorage.setItem(key, JSON.stringify([...seen, articleId].slice(-500)));
        } catch {
          // Private mode or full storage: the server dedupes anyway.
        }
      })
      .catch(() => {});
  }, [articleId]);

  return null;
}
