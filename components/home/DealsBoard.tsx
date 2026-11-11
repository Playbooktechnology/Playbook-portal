import { getAcuerdosPublicos } from '@/lib/data/marcador';
import { todayInMexico } from '@/lib/deals';
import { MarcadorWidget } from './MarcadorWidget';

// ——— "El Marcador de Negocios" (sidebar module, replaced El tablero de la
// FIFA 2026-09-23). Since 2026-11-11 it reads data/marcador.json (only
// records with cumple_criterio: true) and renders the v2 widget; all the
// rules live in lib/marcador.ts and components/home/MarcadorWidget.tsx.
export async function DealsBoard() {
  return <MarcadorWidget acuerdos={getAcuerdosPublicos()} today={todayInMexico()} />;
}
