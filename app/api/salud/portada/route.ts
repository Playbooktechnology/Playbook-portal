import { NextResponse } from 'next/server';
import { getDeclaredCifras, getPublicArticles } from '@/lib/data/articles';
import { getAcuerdosPublicos } from '@/lib/data/marcador';
import { CIFRA_MAX_AGE_DAYS, selectDailyFigure } from '@/lib/daily-figure';
import { MARCADOR_ARCHIVE_AFTER_DAYS } from '@/lib/deals';
import { daysBetween, isArchive, lastUpdated } from '@/lib/marcador';
import { ageInDays, mexicoDay } from '@/lib/freshness';
import { articlePath } from '@/lib/article-url';
import { SITE_URL } from '@/lib/site-url';

// Freshness of the two automated homepage modules, for the daily GitHub
// Action (.github/workflows/alerta-frescura.yml) that opens an issue when
// either one passes its threshold. Created 2026-11-11 after El Marcador sat
// frozen for seven weeks with nothing noticing.
//
// Public and unauthenticated on purpose: everything here is already on the
// homepage, and it spares the Action a database secret. The decisions come
// from the same functions the rail renders with (lib/marcador.ts,
// lib/daily-figure.ts), so the alert checks what readers actually see.
export const dynamic = 'force-dynamic';


export async function GET() {
  const now = new Date();
  try {
    const acuerdos = getAcuerdosPublicos();
    const [articles, declared] = await Promise.all([getPublicArticles(), getDeclaredCifras()]);
    const today = mexicoDay(now);

    const latest = lastUpdated(acuerdos);
    const newest = acuerdos.filter(a => a.fecha === latest).sort((a, b) => a.id.localeCompare(b.id))[0] ?? null;
    const dealAge = latest ? daysBetween(latest, today) : null;

    // `ultima`: the newest figure the rail could show at any age, so the
    // alert can say what the last one was even when the block is hidden.
    const shown = selectDailyFigure(articles, declared, now);
    const last = shown ?? selectDailyFigure(articles, declared, now, Infinity);
    const figureAge = last ? ageInDays(last.date, now) : null;

    return NextResponse.json(
      {
        generadoEn: now.toISOString(),
        hoy: today,
        marcador: {
          umbralDias: MARCADOR_ARCHIVE_AFTER_DAYS,
          desactualizado: isArchive(acuerdos, today),
          diasDesdeUltimo: dealAge,
          ultimo: newest && { fecha: newest.fecha, titulo: newest.titulo, url: newest.url },
        },
        cifra: {
          umbralDias: CIFRA_MAX_AGE_DAYS,
          desactualizado: !shown,
          visibleEnPortada: !!shown,
          diasDesdeUltima: figureAge,
          ultima: last && { fecha: last.date, cifra: last.figure, nota: last.title, url: `${SITE_URL}${articlePath(last.id)}` },
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('[salud/portada] could not compute freshness:', err);
    return NextResponse.json({ generadoEn: now.toISOString(), error: 'No se pudo calcular la frescura.' }, { status: 500 });
  }
}
