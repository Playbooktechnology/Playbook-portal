'use client';

import { useMemo, useState } from 'react';
import {
  DEAL_STATUS_LABEL,
  DEAL_TYPES,
  DEAL_TYPE_LABEL,
  PERIODS,
  dealAmountLabel,
  dealTitle,
  filterDeals,
  shortDate,
  type Deal,
  type DealFilters,
  type DealStatus,
} from '@/lib/deals';
import { safeUrl } from '@/lib/safe-url';

// `today` comes from the server (CDMX date) so the period filter and the
// first client render agree with what the server rendered.
export function DealsTable({ deals, today }: { deals: Deal[]; today: string }) {
  const [filters, setFilters] = useState<DealFilters>({ type: '', country: '', sport: '', period: 'anio', query: '' });

  const countries = useMemo(() => [...new Set(deals.map(d => d.country).filter(Boolean))].sort(), [deals]);
  const sports = useMemo(() => [...new Set(deals.map(d => d.sport).filter(Boolean))].sort(), [deals]);
  const rows = useMemo(() => filterDeals(deals, filters, today), [deals, filters, today]);

  const set = <K extends keyof DealFilters>(key: K) => (value: DealFilters[K]) => setFilters(f => ({ ...f, [key]: value }));
  const hasFilters = filters.type || filters.country || filters.sport || filters.query || filters.period !== 'anio';

  return (
    <div className="mk-table-wrap">
      <div className="mk-filters" role="search">
        <label className="mk-search">
          <span className="visually-hidden">Buscar acuerdos</span>
          <input
            type="search"
            placeholder="Buscar marca, club, liga…"
            value={filters.query}
            onChange={e => set('query')(e.target.value)}
          />
        </label>
        <FilterSelect label="Tipo" value={filters.type} onChange={set('type')} options={DEAL_TYPES.map(t => [t.key, t.label])} />
        <FilterSelect label="País" value={filters.country} onChange={set('country')} options={countries.map(c => [c, c])} />
        <FilterSelect label="Deporte" value={filters.sport} onChange={set('sport')} options={sports.map(s => [s, s])} />
        <FilterSelect
          label="Periodo"
          value={filters.period}
          onChange={v => set('period')(v as DealFilters['period'])}
          options={PERIODS.map(p => [p.key, p.label])}
          allowAll={false}
        />
        {hasFilters && (
          <button
            type="button"
            className="mk-clear"
            onClick={() => setFilters({ type: '', country: '', sport: '', period: 'anio', query: '' })}
          >
            Limpiar
          </button>
        )}
      </div>

      <p className="mk-count" aria-live="polite">
        {rows.length} {rows.length === 1 ? 'acuerdo' : 'acuerdos'}
      </p>

      {rows.length === 0 ? (
        <p className="mk-empty">Ningún acuerdo coincide con estos filtros.</p>
      ) : (
        <table className="mk-table">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Acuerdo</th>
              <th scope="col">Tipo</th>
              <th scope="col">País</th>
              <th scope="col">Deporte</th>
              <th scope="col">Duración</th>
              <th scope="col" className="mk-num">Monto</th>
              <th scope="col">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(d => {
              const href = safeUrl(d.articleUrl);
              const external = /^https?:/i.test(href);
              return (
                <tr key={d.id}>
                  <td className="mk-date" data-label="Fecha">{shortDate(d.date)}</td>
                  <td className="mk-deal" data-label="Acuerdo">
                    {href ? (
                      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                        {dealTitle(d)}
                      </a>
                    ) : (
                      <span>{dealTitle(d)}</span>
                    )}
                    {d.summary && <span className="mk-deal-summary">{d.summary}</span>}
                  </td>
                  <td data-label="Tipo">{DEAL_TYPE_LABEL[d.type] ?? d.type}</td>
                  <td data-label="País">{d.country || '·'}</td>
                  <td data-label="Deporte">{d.sport || '·'}</td>
                  <td data-label="Duración">{d.duration || '·'}</td>
                  <td className="mk-num mk-amount" data-label="Monto">{dealAmountLabel(d)}</td>
                  <td data-label="Estatus">
                    <span className={`mk-status mk-status--${d.status}`}>
                      {DEAL_STATUS_LABEL[d.status as DealStatus] ?? d.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allowAll = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  allowAll?: boolean;
}) {
  return (
    <label className="mk-select">
      <span className="mk-select-label">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {allowAll && <option value="">Todos</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
