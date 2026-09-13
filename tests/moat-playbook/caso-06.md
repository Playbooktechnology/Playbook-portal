# Caso 6 — Muy poco evidence para sostener una tesis atractiva

**Qué valida:** debe detectar el evidence gap y no fabricar certeza. Usa el
vocabulario sabemos/parece/podría/no sabemos todavía
(`voice-and-style.md` §8, `format-tiers.md` §3b). Dry-run.

---

## INPUT (sintético)

> Rumores en redes sociales y dos cuentas de fans afirman que una liga de
> esports está en pláticas para vender una franquicia a un consorcio
> saudí. Ninguna fuente primaria (la liga, el consorcio, un reportero de
> negocios con historial de exclusivas en esta liga) confirma nada. Un solo
> medio de nicho publicó "fuentes cercanas dicen que hay conversaciones",
> sin nombrar a nadie ni dar cifra.

## GATE

```
DECISIÓN: RADAR
RAZÓN: La historia sería importante SI se confirmara (cambiaría el control
  de una franquicia y abriría una pregunta de capital de origen), pero hoy
  la única fuente es un medio de nicho citando "fuentes cercanas" sin
  nombrar a nadie — nivel de evidencia 02/04, no suficiente para publicar
  con la firmeza que la tesis pide.
READER PERSONA PRIMARIO: Investor / Advisor
NECESIDAD DEL READER: Saber si esto es real antes de que se mueva en una
  conversación de inversión, no leer un rumor con más autoridad de la que
  tiene.
DELTA PLAYBOOK: Ninguno disponible hoy que no sea repetir el rumor con
  otras palabras.
EVIDENCIA DISPONIBLE: Un reporte de nicho sin fuente nombrada (nivel 02,
  débil), rumores de redes (nivel 04, escenario).
DATOS / EVIDENCIA QUE FALTAN: Confirmación de la liga, del consorcio, o de
  un reportero con historial de exclusivas en esta liga específica; monto o
  rango de la operación.
```

**No se rutea al formato.** Se marca RADAR y se reporta como seguimiento.

## Cómo se vería SI el gate hubiera dicho PUBLICAR con la evidencia débil que hay (ejercicio de contraste)

Si el equipo editorial decidiera publicar de todos modos con lo que hay hoy
— **esto es lo que el sistema debe evitar, no lo que se recomienda** — el
Deep Dive tendría que usar el vocabulario de certeza explícitamente en vez
de escribir con voz segura sobre algo no confirmado:

> **Sabemos** que hay pláticas activas alrededor de la franquicia, porque
> dos fuentes independientes de fans y un medio de nicho lo reportan en la
> misma ventana de tiempo. **No sabemos todavía** quién es el comprador
> real, ni si el consorcio saudí es la contraparte o solo una hipótesis que
> circula sin respaldo. **Podría** tratarse de una ronda de inversión
> minoritaria en lugar de una venta de control — ambas leen igual desde
> afuera en esta etapa. Lo que **no** puede escribirse es una cifra o un
> comprador como si fueran hecho confirmado.

## MOAT CHECK (aplicado al ejercicio de contraste, no al RADAR real)

6. ¿Evidenciado? (**gate**): NO — la interpretación ("venta a consorcio
   saudí") no tiene respaldo de nivel 01 ni 02 fuerte.
   → Por la regla de severidad, esto no puede calificar mejor que REQUIERE
   REEDICIÓN, incluso si el resto del texto estuviera perfectamente escrito.

**Calificación (del ejercicio de contraste): REQUIERE REEDICIÓN** — el gate
6 falla, así que no puede ser AJUSTES MENORES aunque la prosa esté limpia.

## Verificación

- El gate real (arriba) evitó el problema desde el inicio: RADAR, no
  drafting.
- El ejercicio de contraste demuestra que, si alguien intentara forzar la
  publicación, el Moat Check y su regla de severidad (`voice-and-style.md`
  §12) lo detendrían igual, en una segunda línea de defensa.
