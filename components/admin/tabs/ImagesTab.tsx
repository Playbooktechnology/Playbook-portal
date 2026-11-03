'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RewriteItem, RunReport, Scope } from '@/lib/images/localize';

type Props = { onToast: (message: string, error?: boolean) => void };
type Batch = { batchId: string; count: number; reverted: number; createdAt: string };

const SCOPE_LABEL: Record<Scope, string> = {
  cover: 'Portadas de las notas (también son su og:image)',
  body: 'Imágenes dentro de las notas',
  cms: 'Imágenes del contenido del sitio (CMS)',
};

async function call<T>(body: unknown): Promise<T> {
  const res = await fetch('/api/admin/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}

function host(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// /admin → Imágenes. Moves images served from other domains into Vercel
// Blob in small batches (lib/images/localize.ts): first "Ver inventario"
// (a dry run, nothing changes), then "Migrar siguiente lote" as many times
// as needed. Every batch is listed with a "Revertir" that restores the
// original URLs. Photo credits are never touched.
export function ImagesTab({ onToast }: Props) {
  const [scope, setScope] = useState<Scope[]>(['cover']);
  const [limit, setLimit] = useState(20);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<RunReport | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesError, setBatchesError] = useState('');

  const loadBatches = useCallback(async () => {
    try {
      setBatches((await call<{ batches: Batch[] }>({ action: 'batches' })).batches);
      setBatchesError('');
    } catch (err) {
      setBatchesError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  function toggle(s: Scope) {
    setScope(cur => (cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]));
  }

  async function run(action: 'plan' | 'migrate') {
    if (action === 'migrate' && !window.confirm(`¿Copiar y reescribir las imágenes de hasta ${limit} notas? Podrás revertir el lote.`)) return;
    setBusy(true);
    try {
      const r = await call<RunReport>({ action, scope, limit });
      setReport(r);
      if (action === 'migrate') {
        const ok = r.items.filter(i => i.newUrl).length;
        const failed = r.items.filter(i => i.error).length;
        onToast(`Lote ${r.batchId}: ${ok} imágenes copiadas, ${failed} con error. Quedan ${r.remaining} notas.`, failed > 0 && ok === 0);
        await loadBatches();
      }
    } catch (err) {
      onToast(`No se pudo: ${(err as Error).message}`, true);
    } finally {
      setBusy(false);
    }
  }

  async function revert(batchId: string) {
    if (!window.confirm(`¿Revertir el lote ${batchId}? Las notas vuelven a sus URLs originales.`)) return;
    setBusy(true);
    try {
      const r = await call<{ reverted: number; articles: number }>({ action: 'revert', batchId });
      onToast(`Revertido: ${r.reverted} imágenes en ${r.articles} notas.`);
      await loadBatches();
    } catch (err) {
      onToast(`No se pudo revertir: ${(err as Error).message}`, true);
    } finally {
      setBusy(false);
    }
  }

  const failed = report?.items.filter(i => i.error) ?? [];
  const byHost = new Map<string, number>();
  for (const i of report?.items ?? []) byHost.set(host(i.oldUrl), (byHost.get(host(i.oldUrl)) ?? 0) + 1);

  return (
    <div>
      <h2 className="admin-section-title">Imágenes en almacenamiento propio</h2>
      <p className="admin-section-desc">
        Copia a Vercel Blob las imágenes que hoy se sirven desde otros dominios y reescribe sus URLs. Los créditos de
        foto no se tocan. Si una imagen no se puede descargar, se queda con su URL original y aparece en la lista de
        errores. Cada lote se puede revertir.
      </p>

      <fieldset className="images-scope">
        <legend className="field-label">Qué migrar</legend>
        {(Object.keys(SCOPE_LABEL) as Scope[]).map(s => (
          <label key={s} className="field field-check">
            <input type="checkbox" checked={scope.includes(s)} onChange={() => toggle(s)} />
            <span className="field-label">{SCOPE_LABEL[s]}</span>
          </label>
        ))}
        <label className="field">
          <span className="field-label">Notas por lote</span>
          <input
            className="input"
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={e => setLimit(Number(e.target.value) || 20)}
          />
        </label>
      </fieldset>

      <div className="deal-form-actions">
        <button type="button" className="btn-mini" disabled={busy || !scope.length} onClick={() => run('plan')}>
          Ver inventario (no cambia nada)
        </button>
        <button type="button" className="btn" disabled={busy || !scope.length} onClick={() => run('migrate')}>
          {busy ? 'Trabajando…' : 'Migrar siguiente lote'}
        </button>
      </div>

      {report && (
        <div className="images-report">
          <h3 className="admin-section-title">
            {report.dryRun ? 'Inventario' : `Lote ${report.batchId}`}: {report.items.length} imágenes
            {report.dryRun ? ` en ${report.remaining} notas` : ` · quedan ${report.remaining} notas`}
          </h3>
          <ul className="team-list">
            {[...byHost.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 25)
              .map(([h, n]) => (
                <li key={h} className="team-row">
                  <span className="team-row-main">
                    <b>{h}</b>
                  </span>
                  <span className="team-row-meta">{n}</span>
                </li>
              ))}
          </ul>
          {failed.length > 0 && (
            <>
              <h3 className="admin-section-title">No se pudieron copiar ({failed.length})</h3>
              <ul className="team-list">
                {failed.map((i: RewriteItem, n) => (
                  <li key={n} className="team-row">
                    <span className="team-row-main">
                      <b>{i.articleId ?? i.location}</b>
                      <span className="team-row-meta">
                        {host(i.oldUrl)} · {i.error}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <h3 className="admin-section-title">Lotes aplicados</h3>
      {batchesError && <p className="field-error">{batchesError}</p>}
      {batches.length === 0 ? (
        <p className="array-empty">Todavía no se ha migrado ningún lote.</p>
      ) : (
        <ul className="team-list">
          {batches.map(b => (
            <li key={b.batchId} className="team-row">
              <div className="team-row-main">
                <b>{b.batchId}</b>
                <span className="team-row-meta">
                  {b.count} imágenes{b.reverted ? ` · ${b.reverted} revertidas` : ''}
                </span>
              </div>
              {b.reverted < b.count && (
                <button type="button" className="btn-mini btn-danger" disabled={busy} onClick={() => revert(b.batchId)}>
                  Revertir
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
