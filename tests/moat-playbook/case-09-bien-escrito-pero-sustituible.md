# Caso 9 — Artículo perfectamente escrito pero totalmente sustituible

Escenario del prompt: "Debe fallar el Moat Check." Entidades **ficticias**.

## Input (sintético)

> "Bebidas Cumbre" extendió su patrocinio con el "Maratón de la Sierra"
> (evento ficticio) por tres años más, con el mismo monto que el contrato
> anterior. El comunicado no menciona ningún cambio de términos.

## Draft (deliberadamente bien escrito en prosa, pero sin ningún delta)

**Título:** Bebidas Cumbre extiende tres años más su patrocinio con el Maratón de la Sierra

**bodyMarkdown** (tier B en apariencia, ~310 palabras, prosa pulida):

```
**El movimiento:** Bebidas Cumbre renovó por tres años más su patrocinio
con el Maratón de la Sierra, en los mismos términos que el acuerdo
anterior. La marca ha sido patrocinador del evento desde su primera
edición.

**El contexto:** El Maratón de la Sierra ha crecido en número de
participantes en cada una de sus últimas cinco ediciones, consolidándose
como una de las carreras más reconocidas de la región. Bebidas Cumbre ha
acompañado ese crecimiento desde el inicio.

**La relación:** Ambas partes describieron la renovación como una muestra
de compromiso mutuo de largo plazo. El evento continúa siendo un pilar de
la estrategia de marca de Bebidas Cumbre en la categoría de bebidas para
deportistas.

**Opinión de Playbook:** La renovación confirma que Bebidas Cumbre sigue
apostando por el deporte de resistencia como plataforma de marca, y que el
Maratón de la Sierra consolida su posición como un activo atractivo para
patrocinadores de largo plazo en la región.
```

La prosa aquí cumple ritmo, cero fórmulas prohibidas, cero errores de voz —
pasaría `check-voice.mjs` limpio. Ese es exactamente el punto del caso.

## Moat Check

```
1. ¿Por qué merece espacio en Playbook? Al escribirlo, la respuesta
   honesta es: no hay una razón específica más allá de que hay un
   comunicado. No hay cifra, no hay cambio de términos, no hay tercero
   desplazado, no hay antecedente que dimensione nada.
4. ¿Cuál es el delta Playbook? NINGUNO -- ni siquiera implícito. "Sigue
   apostando" y "consolida su posición" son paráfrasis del comunicado, no
   una lectura nueva. GATE: falla.
5. ¿Va un nivel después del headline? NO -- el headline ya dice todo lo que
   la pieza sabe. GATE: falla.
6. ¿Ese nivel está respaldado por evidencia? No aplica, no hay nivel.
   GATE: falla.
9. ¿Algo memorable? No -- ninguna frase de esta pieza sobreviviría fuera
   del artículo.
10. ¿Sobreviviría sin el nombre Playbook? SÍ, INTACTO -- esta pieza podría
    haber salido de cualquier boletín de relaciones públicas con el logo
    cambiado. Es la pregunta que el caso está diseñado para fallar, y la
    falla.

CALIFICACIÓN: NO PUBLICAR TODAVÍA (no solo REQUIERE REEDICIÓN -- no hay
material de reedición: no existe delta que rescatar de este comunicado tal
como está reporteado. El camino correcto es el que describe
editorial-gate.md: si de verdad no hay valor adicional, la pregunta es si
merece publicarse, no cómo pulir la prosa).
```

## check-format-tier.ts (corrida real contra este bodyMarkdown)

```
✗ Bebidas Cumbre extiende tres años más su patrocinio con el Maratón de
   156 palabras · Opinión sí
   ✗ SEVERO (bloquearía el publish): 156 palabras, bajo el piso de B (250-500)
```

Hallazgo honesto no anticipado al escribir el caso: el chequeo
determinístico también marca esta pieza por su cuenta, de forma
independiente al Moat Check -- 156 palabras no alcanza el piso de 250 para
un B, y a más del 30% por debajo (severidad, ver `check-format-tier.ts`)
cuenta como **severo**, no marginal.

**Corrección importante, encontrada después de una pregunta directa sobre
esto:** al escribir este caso originalmente, `check-format-tier.ts` no
estaba conectado a nada -- existía como script suelto, sin ninguna
instrucción en ningún `SKILL.md` ni llamada desde `scripts/publish-newsletter.ts`.
Eso significaba que la corrida de arriba solo lo atrapó porque yo lo corrí
a mano contra este fixture; un artículo real con el mismo defecto se habría
publicado tal cual, sin nada que lo detuviera. Se corrigió en el mismo PR:
ahora `check-format-tier.ts` corre de verdad dentro de `scripts/publish-newsletter.ts`
(justo después del overlap gate) y un hallazgo severo como este **bloquea
el publish** -- exit code 1, nada se inserta en Postgres, hace falta
`--allow-tier-mismatch` explícito para pasar.

**Sobre la causa raíz (también aclarado después):** este caso fija
`"tier": "B"` directamente en el fixture, sin correr el gate
(`editorial-gate.md`) ni el router (`format-tiers.md` §1) sobre el input.
Por eso no es evidencia de que el router se equivoque clasificando A vs. B,
ni de que el prompt de escritura de B falle en aplicar su propio piso --
un input tan parecido al del caso 1 (patrocinio sin cifras, sin cambios)
debería resolverse en el **gate**, con `NO PUBLICAR TODAVÍA`, antes de
llegar siquiera al router. Las 156 palabras cortas son el síntoma correcto
de que la historia nunca tuvo sustancia de B -- pero el caso, tal como está
escrito, prueba que el chequeo mecánico y el Moat Check atrapan el defecto
cada uno por su lado cuando alguien salta el gate/router, no que el
router en sí tenga un bug.

Es un segundo síntoma del mismo problema de fondo (no hay suficiente
historia real que sostener), detectado por dos mecanismos distintos: uno
mecánico (conteo de palabras, ahora bloqueante) y uno editorial (el Moat
Check, juicio de sesión). Ninguno de los dos sustituye al otro -- ver
`moat-check.md`, "esto es juicio, no un assert".

## Por qué esto no lo atrapa `check-voice.mjs` pero sí el Moat Check

`check-voice.mjs` mide ritmo, fórmulas prohibidas y antítesis -- esta pieza
pasa las tres limpio. Es precisamente la razón de ser del Moat Check
(Cambio 8): una pieza puede estar impecablemente escrita y aun así no
haber hecho el trabajo editorial. El checklist de 12 puntos y el Moat Check
son complementarios, no redundantes -- uno audita la forma, el otro audita
si había algo que decir.

## Resultado esperado vs. obtenido

Esperado: el Moat Check falla la pieza pese a la prosa limpia. **Obtenido:
coincide** -- pregunta 10 es la que expone la sustituibilidad total, y los
gates 4/5/6 fallan en cascada porque no hay delta que sostenerlos.
