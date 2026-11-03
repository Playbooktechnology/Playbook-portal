import { fridayLabel, lastUpdateDay, nextUpdateFriday, shortDate, weekCountLabel, type Deal } from '@/lib/deals';

// The weekly-cadence line El Marcador prints on the homepage rail and on
// /marcador (A7): "N acuerdos esta semana" (or "Semana sin operaciones
// confirmadas") and "Última actualización: … · Próxima: viernes …". One
// component, so the two surfaces can't drift.
export function MarcadorCadence({ deals, today, className }: { deals: Deal[]; today: string; className: string }) {
  const updated = lastUpdateDay(deals);
  return (
    <p className={className}>
      <span>{weekCountLabel(deals, today)}</span>
      {updated && (
        <span>
          Última actualización: {shortDate(updated)} · Próxima: {fridayLabel(nextUpdateFriday(today, updated))}
        </span>
      )}
    </p>
  );
}
