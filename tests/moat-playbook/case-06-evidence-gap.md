# Caso 6 — Poca evidencia para una tesis atractiva

Escenario del prompt: "Debe detectar evidence gap y no fabricar certeza."
Entidades **ficticias**.

## Input (sintético)

> Un post en redes sociales de una cuenta no verificada afirma que "Global
> Sports Holdings está en pláticas avanzadas para comprar una participación
> mayoritaria en la Liga Panamericana de Esports". Ninguna de las dos
> organizaciones lo ha confirmado ni desmentido. No hay reporting de otro
> medio. La cuenta que lo publicó ha acertado en el pasado en un caso, y
> fallado en otros dos.

## Step 0.5 — Editorial gate

```
DECISIÓN: RADAR
RAZÓN: La tesis ("Global Sports Holdings compra la LPE") es atractiva y
  potencialmente relevante, pero la única fuente es un post no verificado
  con historial mixto. Publicar ahora significaría convertir un rumor sin
  corroborar en la premisa de un artículo.
READER PERSONA PRIMARIO: Investor / Advisor (si se confirma)
NECESIDAD DEL READER: saber si esta operación es real antes de que
  Playbook la trate como tal.
DELTA PLAYBOOK: ninguno todavía — no hay mecanismo ni consecuencia que
  explicar sobre una operación que no está confirmada.
EVIDENCIA DISPONIBLE: un post de una cuenta con historial mixto, sin
  corroboración.
DATOS / EVIDENCIA QUE FALTAN: confirmación de cualquiera de las dos partes,
  reporting de un segundo medio, cualquier documento o declaración.
```

## Qué pasaría si de todos modos se redactara (ejercicio de contraste)

Si el gate hubiera devuelto `PUBLICAR` bajo presión editorial, el Step 3
(router) habría tenido que forzar un formato sobre una tesis sin sustento —
exactamente el "análisis conceptual para esconder el evidence gap" que
`format-tiers.md` §3b prohíbe. La ruta correcta, si el editor insiste en que
la audiencia debe saber que existe el rumor, es una mención mínima marcada
explícitamente como **nivel 04 (escenario)**: "circula sin confirmar la
posibilidad de que Global Sports Holdings busque una participación en la
LPE; ninguna de las dos partes lo ha confirmado" — nunca redactada como si
fuera un hecho en curso, y nunca con un titular que implique que la
operación está en marcha.

## Moat Check (si se hubiera forzado la publicación)

```
6. ¿El nivel adicional está respaldado por evidencia? NO — la única fuente
   es un rumor no verificado de una cuenta con historial mixto. GATE:
   falla.

Como falla el gate 6, la calificación no puede ser mejor que REQUIRE
REEDICIÓN — incluso si el resto de la pieza estuviera bien escrito.

CALIFICACIÓN (del borrador hipotético forzado): REQUIERE REEDICIÓN
```

## Resultado esperado vs. obtenido

Esperado: el sistema detecta el evidence gap y no fabrica certeza — la
decisión correcta es `RADAR` en el gate, antes de llegar siquiera al
router. **Obtenido: coincide**, y el ejercicio de contraste confirma que si
alguien fuerza la publicación, el Moat Check lo atrapa en el gate 6 con la
severidad correcta (REQUIERE REEDICIÓN, no AJUSTES MENORES).
