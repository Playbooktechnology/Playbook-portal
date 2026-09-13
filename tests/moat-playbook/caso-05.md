# Caso 5 — Historia internacional sin conexión real con México

**Qué valida:** debe poder publicarse sin inventar "qué significa para
México/LATAM" (`voice-and-style.md` §9, Cambio 11). Dry-run.

---

## INPUT (sintético)

> La Bundesliga anuncia un nuevo esquema de reparto de derechos de TV
> doméstica entre sus 18 clubes, moviendo del reparto 70/30
> (clasificación/igualitario) actual a 60/40, efectivo desde la temporada
> 2027-28. Ningún club mexicano ni jugador mexicano relevante involucrado;
> el mercado mexicano no es parte del contrato de TV doméstica alemán.

## GATE

```
DECISIÓN: PUBLICAR
RAZÓN: Cambia el reparto de ingresos entre 18 clubes de una de las cinco
  grandes ligas europeas — relevante para cualquier profesional serio del
  sports business, con o sin conexión regional.
READER PERSONA PRIMARIO: Operator / Builder
NECESIDAD DEL READER: Entender qué incentivos cambia mover el reparto hacia
  más igualitario y qué tipo de club gana o pierde con eso.
DELTA PLAYBOOK: Explicar el mecanismo de incentivos detrás del cambio de
  70/30 a 60/40 — quién presiona por más igualdad y por qué.
EVIDENCIA DISPONIBLE: Comunicado de la Bundesliga (01), estructura del
  reparto anterior (01, público).
DATOS / EVIDENCIA QUE FALTAN: Ninguno indispensable.
```

## ROUTER

```
FORMATO: B
RAZÓN: Hay una segunda capa de negocio real (redistribución de ingresos
  entre clubes grandes y chicos) sin necesitar reconstrucción completa de
  estructura societaria.
READER PERSONA PRIMARIO: Operator / Builder
JOB-TO-BE-DONE: Entender qué tipo de club sale ganando con el nuevo reparto
  y qué dice eso sobre el equilibrio competitivo de la liga.
PREGUNTA CENTRAL: ¿Por qué la Bundesliga se mueve hacia un reparto más
  igualitario, y quién pierde con eso?
DELTA PLAYBOOK ESPERADO: El mecanismo de incentivos, no solo el número
  nuevo.
PALANCA DE NEGOCIO PRINCIPAL: Reparto del riesgo / distribución (palanca 6).
EVIDENCIA DISPONIBLE: comunicado, estructura anterior.
DATOS QUE FALTAN: ninguno.
```

## DRAFT (bodyMarkdown, resumido)

- **Movimiento:** Bundesliga mueve el reparto doméstico de TV de 70/30 a
  60/40 desde 2027-28.
- **Mecanismo:** qué significa en euros aproximados para un club top-4
  frente a uno de media tabla, con el reparto anterior vs. el nuevo.
- **Incentivo:** los clubes medianos y chicos empujaron el cambio para
  reducir la brecha con Bayern/Dortmund; a cambio aceptaron ceder en otro
  punto de la negociación (mencionado si el research lo confirma).
- `**Opinión de Playbook:**` Un reparto más igualitario no nivela el campo
  deportivo de un día para otro, pero sí reduce el margen que los clubes
  grandes pueden reinvertir en fichajes frente al resto — el tipo de
  cambio que se nota en tres o cuatro mercados de verano, no en el
  siguiente.

**Cierre:** ningún párrafo final fuerza una conexión con México/LATAM. La
pieza cierra en la lectura de la industria alemana, como exige
`voice-and-style.md` §9 cuando "la respuesta honesta es que la región no
tiene interés real."

## MOAT CHECK

4. Delta: sí — el mecanismo de incentivos detrás del cambio de reparto.
9. ¿Memorable? Sí — el efecto se nota en el mercado de fichajes, no en la
   tabla del día siguiente.
10. ¿Sustituible? No — ningún medio alemán mainstream está explicando el
    incentivo detrás del cambio, solo el número.

**Calificación: APROBADO.**

## Verificación

- Se buscó activamente la conexión regional (research obligatorio,
  `voice-and-style.md` §9 — "research it, don't infer it") y la respuesta
  honesta fue que no existe. La pieza cierra en el mecanismo alemán, sin
  una frase de relleno tipo "esto también aplica para Liga MX".
- Esto confirma que §9, ya extenso desde antes de este proyecto, sigue
  sin necesitar cambios (ver commit de Fase 2/4: Cambio 11 sin cambios).
