'use client';

import { useCallback, useEffect, useState } from 'react';
import { deleteDeal, listDealCandidates, listDeals, saveDeal } from '@/lib/actions/deals';
import type { CandidateField, DealCandidate } from '@/lib/deal-candidates';
import {
  DEAL_STATUS_LABEL,
  DEAL_TYPES,
  DEAL_TYPE_LABEL,
  dealAmountLabel,
  dealTitle,
  shortDate,
  todayInMexico,
  type Deal,
  type DealInput,
  type DealStatus,
  type KeyFigure,
} from '@/lib/deals';
import { TextField } from '../fields/TextField';
import { SelectField } from '../fields/SelectField';

type Props = { onToast: (message: string, error?: boolean) => void };

// The form keeps the amount as typed text so an empty box means "unknown"
// (null), not zero.
type Draft = Omit<DealInput, 'amountUsd' | 'playbookRead' | 'keyFigures'> & {
  amountText: string;
  playbookRead: string;
  keyFigures: KeyFigure[];
};

function emptyDraft(): Draft {
  return {
    date: todayInMexico(),
    brand: '',
    counterparty: '',
    type: 'patrocinio',
    country: 'México',
    sport: '',
    duration: '',
    amountText: '',
    amountDisclosed: false,
    status: 'reportado',
    summary: '',
    articleUrl: '',
    featured: false,
    playbookRead: '',
    keyFigures: [],
  };
}

const CANDIDATE_FIELD_LABEL: Record<CandidateField, string> = {
  brand: 'marca',
  counterparty: 'contraparte',
  type: 'tipo',
  country: 'país',
  sport: 'deporte',
  duration: 'duración',
  amount: 'monto',
};

function toDraft(d: Deal): Draft {
  return {
    date: d.date,
    brand: d.brand,
    counterparty: d.counterparty,
    type: d.type,
    country: d.country,
    sport: d.sport,
    duration: d.duration,
    amountText: d.amountUsd == null ? '' : String(d.amountUsd),
    amountDisclosed: d.amountDisclosed,
    status: d.status,
    summary: d.summary,
    articleUrl: d.articleUrl,
    featured: d.featured,
    playbookRead: d.playbookRead ?? '',
    keyFigures: d.keyFigures,
  };
}

function fromDraft(draft: Draft): Partial<DealInput> {
  const { amountText, ...rest } = draft;
  const digits = amountText.replace(/[^\d]/g, '');
  return { ...rest, amountUsd: digits ? Number(digits) : null };
}

// Self-loading like TeamTab: deals are server state saved one at a time, so
// the dashboard's global save button doesn't apply (see SAVELESS_TABS).
export function DealsTab({ onToast }: Props) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  // A7: candidates are read alongside the deals and recomputed after every
  // save, so an approved one drops off the list on its own.
  const [candidates, setCandidates] = useState<DealCandidate[]>([]);
  const [candidateNotes, setCandidateNotes] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [list, cands] = await Promise.all([listDeals(), listDealCandidates().catch(() => [])]);
      setDeals(list);
      setCandidates(cands);
      setLoadError('');
    } catch (err) {
      setLoadError(`No se pudieron cargar los acuerdos: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const set = <K extends keyof Draft>(key: K) => (value: Draft[K]) => setDraft(d => (d ? { ...d, [key]: value } : d));

  function openNew() {
    setEditingId(null);
    setDraft(emptyDraft());
  }

  function openEdit(deal: Deal) {
    setEditingId(deal.id);
    setDraft(toDraft(deal));
  }

  function close() {
    setEditingId(null);
    setDraft(null);
    setCandidateNotes([]);
  }

  // "Revisar y aprobar": the new-deal form, pre-filled with what the story's
  // text gave us. Nothing is saved until the editor completes it and presses
  // Guardar — that save IS the approval.
  function openCandidate(c: DealCandidate) {
    setEditingId(null);
    setDraft({ ...emptyDraft(), ...c.proposed, amountText: c.proposed.amountText ?? '', playbookRead: '', keyFigures: [] });
    setCandidateNotes([
      ...c.missing.map(f => `Falta: ${CANDIDATE_FIELD_LABEL[f]}.`),
      ...c.notes,
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await saveDeal(editingId, fromDraft(draft));
      onToast(`Guardado: ${dealTitle(saved)}. Ya está en el sitio.`);
      close();
      await refresh();
    } catch (err) {
      onToast(`No se pudo guardar: ${(err as Error).message}`, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(deal: Deal) {
    if (!window.confirm(`¿Eliminar "${dealTitle(deal)}"? No se puede deshacer.`)) return;
    try {
      await deleteDeal(deal.id);
      onToast(`Eliminado: ${dealTitle(deal)}.`);
      if (editingId === deal.id) close();
      await refresh();
    } catch (err) {
      onToast(`No se pudo eliminar: ${(err as Error).message}`, true);
    }
  }

  function setFigure(i: number, key: keyof KeyFigure, value: string) {
    setDraft(d => {
      if (!d) return d;
      const figures = [0, 1, 2].map(n => d.keyFigures[n] ?? { value: '', label: '' });
      figures[i] = { ...figures[i], [key]: value };
      return { ...d, keyFigures: figures };
    });
  }

  return (
    <div>
      <h2 className="admin-section-title">El Marcador de Negocios</h2>
      <p className="admin-section-desc">
        Los acuerdos que alimentan el módulo del homepage y la página /marcador. Cada cambio se publica al
        guardar (tarda hasta un minuto en verse). El acumulado del año suma solo los confirmados con monto
        revelado.
      </p>

      {loadError && <p className="field-error">{loadError}</p>}

      {!draft && (
        <button type="button" className="btn" onClick={openNew}>
          Nuevo acuerdo
        </button>
      )}

      {draft && (
        <form className="deal-form" onSubmit={handleSave}>
          <h3 className="admin-section-title">{editingId ? 'Editar acuerdo' : 'Nuevo acuerdo'}</h3>
          {candidateNotes.length > 0 && (
            <ul className="deal-candidate-notes">
              {candidateNotes.map(n => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <div className="deal-form-grid">
            <label className="field">
              <span className="field-label">Fecha</span>
              <input className="input" type="date" required value={draft.date} onChange={e => set('date')(e.target.value)} />
            </label>
            <SelectField
              label="Tipo"
              value={draft.type}
              onChange={set('type')}
              options={DEAL_TYPES.map(t => ({ value: t.key, label: t.label }))}
            />
            <TextField label="Marca" value={draft.brand} onChange={set('brand')} />
            <TextField label="Contraparte" help="Club, liga, federación o plataforma." value={draft.counterparty} onChange={set('counterparty')} />
            <TextField label="País" value={draft.country} onChange={set('country')} />
            <TextField label="Deporte" value={draft.sport} onChange={set('sport')} />
            <TextField label="Duración" help='Ej. "5 años", "2026-2030", "Largo plazo".' value={draft.duration} onChange={set('duration')} />
            <SelectField
              label="Estatus"
              help="Confirmado: lo anunció alguna de las partes. Reportado: lo publicó un medio."
              value={draft.status}
              onChange={set('status')}
              options={[
                { value: 'reportado', label: 'Reportado' },
                { value: 'confirmado', label: 'Confirmado' },
              ]}
            />
            <label className="field">
              <span className="field-label">Monto (US$)</span>
              <span className="field-help">
                En dólares enteros, ej. 250000000. Vacío si no se conoce. Si fue en otra moneda, conviértelo con el
                tipo de cambio del BCE del día del anuncio.
              </span>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                value={draft.amountText}
                onChange={e => set('amountText')(e.target.value)}
              />
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={draft.amountDisclosed}
                onChange={e => set('amountDisclosed')(e.target.checked)}
              />
              <span className="field-label">Monto revelado</span>
              <span className="field-help">Solo si lo anunció alguna de las partes. Sin marcar = estimado de prensa (~).</span>
            </label>
          </div>
          <TextField label="Descripción corta" multiline value={draft.summary} onChange={set('summary')} />
          <TextField
            label="URL de la nota"
            help="De Playbook: /articulo/el-slug. De otro medio: la URL completa."
            value={draft.articleUrl}
            onChange={set('articleUrl')}
          />

          <label className="field field-check">
            <input type="checkbox" checked={draft.featured} onChange={e => set('featured')(e.target.checked)} />
            <span className="field-label">Destacado de la semana</span>
          </label>
          {draft.featured && (
            <>
              <TextField
                label="La lectura de Playbook"
                help="Una o dos frases; aparece junto al destacado en /marcador."
                multiline
                value={draft.playbookRead}
                onChange={set('playbookRead')}
              />
              <fieldset className="deal-figures">
                <legend className="field-label">Tres cifras clave (opcional)</legend>
                <span className="field-help">Ej. 140+ / tiendas. Si las dejas vacías, se arman con monto, duración y año.</span>
                {[0, 1, 2].map(i => (
                  <div key={i} className="deal-figure-row">
                    <input
                      className="input"
                      placeholder="Cifra"
                      value={draft.keyFigures[i]?.value ?? ''}
                      onChange={e => setFigure(i, 'value', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Etiqueta"
                      value={draft.keyFigures[i]?.label ?? ''}
                      onChange={e => setFigure(i, 'label', e.target.value)}
                    />
                  </div>
                ))}
              </fieldset>
            </>
          )}

          <div className="deal-form-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar acuerdo'}
            </button>
            <button type="button" className="btn-mini" onClick={close} disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <h3 className="admin-section-title">Candidatos desde notas publicadas ({candidates.length})</h3>
      <p className="field-help deal-candidates-help">
        Notas desde el 21 sep con industria Patrocinios, Inversión, Derechos de TV o Venues que todavía no están en
        el Marcador. Nada se publica desde aquí: «Revisar y aprobar» abre el formulario con los campos propuestos;
        completa lo marcado como faltante, decide Confirmado/Reportado y revelado/estimado, y pulsa Guardar. Las
        notas que no son un acuerdo simplemente se dejan en la lista.
      </p>
      {candidates.length > 0 && (
        <ul className="team-list">
          {candidates.map(c => (
            <li key={c.articleId} className="team-row deal-row">
              <div className="team-row-main">
                <b>
                  {c.signal && <span title="El titular parece un acuerdo">● </span>}
                  {c.title}
                </b>
                <span className="team-row-meta">
                  {shortDate(c.date)} · {c.vertical}
                  {c.proposed.brand && ` · ${c.proposed.brand}`}
                  {c.proposed.counterparty && ` → ${c.proposed.counterparty}`}
                  {c.missing.length > 0 && ` · Falta: ${c.missing.map(f => CANDIDATE_FIELD_LABEL[f]).join(', ')}`}
                </span>
              </div>
              <a className="btn-mini" href={c.proposed.articleUrl} target="_blank" rel="noopener noreferrer">
                Ver nota
              </a>
              <button type="button" className="btn-mini" onClick={() => openCandidate(c)}>
                Revisar y aprobar
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="admin-section-title">Acuerdos registrados ({deals.length})</h3>
      {loading ? (
        <p className="array-empty">Cargando…</p>
      ) : deals.length === 0 ? (
        <p className="array-empty">Todavía no hay acuerdos.</p>
      ) : (
        <ul className="team-list">
          {deals.map(d => (
            <li key={d.id} className="team-row deal-row">
              <div className="team-row-main">
                <b>
                  {d.featured && <span title="Destacado">★ </span>}
                  {dealTitle(d)}
                </b>
                <span className="team-row-meta">
                  {shortDate(d.date)} · {DEAL_TYPE_LABEL[d.type] ?? d.type} · {dealAmountLabel(d)} ·{' '}
                  {DEAL_STATUS_LABEL[d.status as DealStatus] ?? d.status}
                  {d.country && ` · ${d.country}`}
                </span>
              </div>
              <button type="button" className="btn-mini" onClick={() => openEdit(d)}>
                Editar
              </button>
              <button type="button" className="btn-mini btn-danger" onClick={() => handleDelete(d)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
