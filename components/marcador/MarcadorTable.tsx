'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Acuerdo } from '@/lib/marcador-schema';
import { PERIODS, type PeriodKey } from '@/lib/deals';
import {
  ALCANCE_LABEL,
  DEPORTE_LABEL,
  EMPTY_FILTERS,
  ESTATUS_LABEL,
  TIPO_LABEL,
  dateLabel,
  filterAcuerdos,
  montoCell,
  nombrePais,
  paisLabel,
  siteHref,
  type MarcadorFilters,
} from '@/lib/marcador';
import { safeUrl } from '@/lib/safe-url';
import { trackEvent } from '@/lib/analytics-events';

// /marcador's filterable table (v2, 2026-11-11). Reads data/marcador.json
// records (public ones only). `today` comes from the server (CDMX date) so the
// period filter and the first client render agree with the server's.
export function MarcadorTable({ acuerdos, today }: { acuerdos: Acuerdo[]; today: string }) {
  const [filters, setFilters] = useState<MarcadorFilters>(EMPTY_FILTERS);

  const paises = useMemo(
    () => [...new Set(acuerdos.flatMap(a => a.pais))].sort((a, b) => nombrePais(a).localeCompare(nombrePais(b), 'es')),
    [acuerdos],
  );
  const deportes = useMemo(() => [...new Set(acuerdos.map(a => a.deporte))].sort(), [acuerdos]);
  const rows = useMemo(() => filterAcuerdos(acuerdos, filters, today), [acuerdos, filters, today]);

  // marcador_filter: one event per deliberate choice. The dropdowns report on
  // change; the search box reports once, on blur, so typing "Nike" is one
  // event and not four.
  const set = <K extends keyof MarcadorFilters>(key: K) => (value: MarcadorFilters[K]) => {
    setFilters(f => ({ ...f, [key]: value }));
    if (key !== 'query') trackEvent('marcador_filter', { filter: key, value: String(value) || 'todos' });
  };
  const hasFilters = Object.entries(filters).some(([k, v]) => (k === 'period' ? v !== 'anio' : v));
  const onlyThisWeek = filters.period === 'semana' && !filters.tipo && !filters.alcance && !filters.pais && !filters.deporte && !filters.query;

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
            onBlur={e => {
              const q = e.target.value.trim();
              if (q) trackEvent('marcador_filter', { filter: 'query', value: q.slice(0, 100) });
            }}
          />
        </label>
        <FilterSelect label="Tipo" value={filters.tipo} onChange={set('tipo')} options={Object.entries(TIPO_LABEL)} />
        <FilterSelect label="Alcance" value={filters.alcance} onChange={set('alcance')} options={Object.entries(ALCANCE_LABEL)} />
        <FilterSelect label="País" value={filters.pais} onChange={set('pais')} options={paises.map(p => [p, nombrePais(p)])} />
        <FilterSelect label="Deporte" value={filters.deporte} onChange={set('deporte')} options={deportes.map(d => [d, DEPORTE_LABEL[d] ?? d])} />
        <FilterSelect
          label="Periodo"
          value={filters.period}
          onChange={v => set('period')(v as PeriodKey)}
          options={PERIODS.map(p => [p.key, p.label])}
          allowAll={false}
        />
        {hasFilters && (
          <button
            type="button"
            className="mk-clear"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              trackEvent('marcador_filter', { filter: 'limpiar', value: 'todos' });
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      <p className="mk-count" aria-live="polite">
        {rows.length} {rows.length === 1 ? 'acuerdo' : 'acuerdos'}
      </p>

      {rows.length === 0 ? (
        <p className="mk-empty">
          {onlyThisWeek ? 'Todavía no hay acuerdos registrados esta semana.' : 'Ningún acuerdo coincide con estos filtros.'}
        </p>
      ) : (
        <table className="mk-table">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Acuerdo</th>
              <th scope="col">Alcance</th>
              <th scope="col">Tipo</th>
              <th scope="col">País</th>
              <th scope="col">Deporte</th>
              <th scope="col">Duración</th>
              <th scope="col" className="mk-num">Monto</th>
              <th scope="col">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(a => {
              const href = safeUrl(siteHref(a.url));
              const monto = montoCell(a);
              return (
                <tr key={a.id}>
                  <td className="mk-date" data-label="Fecha">{dateLabel(a.fecha)}</td>
                  <td className="mk-deal" data-label="Acuerdo">
                    {href.startsWith('/') ? <Link href={href}>{a.titulo}</Link> : <a href={href} target="_blank" rel="noopener noreferrer">{a.titulo}</a>}
                    <span className="mk-deal-summary">{a.resumen}</span>
                  </td>
                  <td data-label="Alcance">
                    <span className={a.alcance === 'mexico' ? 'side-mk-scope side-mk-scope--mx mk-scope' : 'side-mk-scope mk-scope'}>
                      {ALCANCE_LABEL[a.alcance]}
                    </span>
                  </td>
                  <td data-label="Tipo">{TIPO_LABEL[a.tipo]}</td>
                  <td data-label="País">{paisLabel(a)}</td>
                  <td data-label="Deporte">{DEPORTE_LABEL[a.deporte] ?? a.deporte}</td>
                  <td className={a.duracion ? undefined : 'mk-blank'} data-label="Duración">{a.duracion || '·'}</td>
                  <td className="mk-num mk-amount" data-label="Monto">
                    {monto.valor}
                    {monto.nota && <small className="mk-amount-note">{monto.nota}</small>}
                  </td>
                  <td data-label="Estatus">
                    <span className={`mk-status mk-status--${a.estatus}`}>{ESTATUS_LABEL[a.estatus]}</span>
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
