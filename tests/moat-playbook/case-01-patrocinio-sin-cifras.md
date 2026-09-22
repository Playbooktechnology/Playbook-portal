# Caso 1 — Patrocinio pequeño con comunicado y sin cifras

Escenario del prompt: "Patrocinio pequeño con comunicado y sin cifras. El
sistema debe poder decidir NO PUBLICAR / RADAR si no existe valor adicional."
Todas las entidades son **ficticias**, construidas para el test.

## Input (sintético)

> Comunicado de prensa, "AguaViva" (marca de bebidas hidratantes) y el
> "Circuito de Baloncesto del Bajío" (CBB, liga regional de tercera
> división): "AguaViva es la nueva bebida oficial del CBB para la temporada
> 2027. La alianza incluye presencia de marca en cancha y contenido conjunto
> en redes sociales." Sin cifras, sin duración del contrato, sin
> exclusividad declarada, sin comentario de ninguna de las dos partes más
> allá del comunicado.

## Step 0 — Overlap check

No hay overlap: ninguna cobertura previa de Playbook sobre AguaViva o el CBB.

## Step 0.5 — Editorial gate (`editorial-gate.md`)

```
DECISIÓN: NO PUBLICAR TODAVÍA
RAZÓN: Es exactamente el patrón que el gate existe para filtrar — un
  comunicado sin cifras, sin duración, sin exclusividad y sin ningún dato
  verificable más allá de lo que las dos partes quieren que se lea. No hay
  mecanismo, incentivo ni consecuencia que reconstruir: el comunicado ES la
  historia completa, no una parte de ella.
READER PERSONA PRIMARIO: (no aplica — no se llega a rutear)
NECESIDAD DEL READER: ninguna que este comunicado por sí solo resuelva.
DELTA PLAYBOOK: ninguno identificable con lo disponible. No hay control,
  dinero, distribución, riesgo ni gobernanza en juego que el comunicado deje
  ver, y ninguna búsqueda adicional (valor del circuito, patrocinios previos
  del CBB, tamaño de audiencia) cambia eso sin reporting nuevo.
EVIDENCIA DISPONIBLE: el comunicado conjunto, nada más.
DATOS / EVIDENCIA QUE FALTAN: monto o naturaleza del acuerdo (cash,
  especie, activación), duración, si reemplaza a un patrocinador anterior,
  tamaño real de audiencia/valor comercial del CBB.
```

No se rutea formato ni se redacta. Esto queda en radar informal: si el CBB
crece de perfil o si aparece una cifra real más adelante, se revisita.

## Moat Check

No aplica — no hay borrador que auditar. La decisión del gate es el control
completo para este caso.

## check-format-tier.ts

No aplica (no hay `bodyMarkdown` que generar).

## Resultado esperado vs. obtenido

Esperado: `NO PUBLICAR TODAVÍA` o `RADAR`, sin borrador. **Obtenido: coincide.**
