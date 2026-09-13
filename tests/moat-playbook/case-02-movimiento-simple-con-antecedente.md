# Caso 2 — Movimiento sencillo pero relevante con un antecedente útil

Escenario del prompt: "Debe poder terminar como A de ~120-160 palabras. No
debe convertirlo en B sólo para demostrar análisis." Entidades **ficticias**.

## Input (sintético)

> "Estadio+" (plataforma de streaming) renovó por dos años más los derechos
> de transmisión de la "Liga de Ascenso Regional" (LAR, fútbol de segunda
> división ficticia), al mismo precio que el contrato anterior. El dato
> adicional: hace tres meses, la otra plataforma que competía por esos
> derechos ("Golazo TV") anunció que se retiraba de licitar contenido de
> ligas de segunda división en la región.

## Step 0 — Overlap check

Sin cobertura previa de la LAR o de Estadio+ en el archivo.

## Step 0.5 — Editorial gate

```
DECISIÓN: PUBLICAR
RAZÓN: Hay un antecedente concreto (la salida de Golazo TV) que cambia lo
  que significa el precio del contrato — no es un dato aislado, es una
  renovación en un mercado donde el comprador dejó de tener competencia.
READER PERSONA PRIMARIO: Operator / Builder (alguien que vende o compra
  derechos de streaming en ligas de nivel medio)
NECESIDAD DEL READER: entender si el precio de los derechos de ligas de
  segunda división se está sosteniendo o cayendo ahora que hay menos
  compradores.
DELTA PLAYBOOK: el precio se mantuvo igual pese a que el único competidor
  por esos derechos se retiró — eso es información sobre el piso real de
  esos derechos, no solo un anuncio de renovación.
EVIDENCIA DISPONIBLE: comunicado de la renovación (hecho confirmado, nivel
  01); salida de Golazo TV, reportada hace tres meses por otra fuente
  (nivel 01, hecho ya establecido).
DATOS / EVIDENCIA QUE FALTAN: el monto exacto del contrato (ninguna de las
  partes lo confirma; se maneja como "mismo precio que el anterior" sin
  cifra dura).
```

## Step 3 — Router (`format-tiers.md` §1)

```
FORMATO: A
RAZÓN: El movimiento (renovación) más el antecedente (salida del único
  competidor) explican por sí solos por qué vale la pena publicarlo. No
  hace falta abrir mecanismo, incentivos o estructura del negocio para que
  la pieza tenga valor — el antecedente ES el valor, y cabe en una frase.
READER PERSONA PRIMARIO: Operator / Builder
JOB-TO-BE-DONE: entender rápido si el mercado de derechos de ligas menores
  se está enfriando.
PREGUNTA CENTRAL: ¿el precio se sostiene o cae cuando desaparece la
  competencia por esos derechos?
DELTA PLAYBOOK ESPERADO: nombrar la salida de Golazo TV como el dato que
  cambia la lectura de la renovación.
PALANCA DE NEGOCIO PRINCIPAL: poder de negociación (el comprador tenía
  todas las cartas y aun así no bajó el precio, lo cual es información en
  sí misma).
EVIDENCIA DISPONIBLE: como arriba.
DATOS QUE FALTAN: cifra exacta del contrato.
```

## Draft

**Título:** Estadio+ renueva la LAR sin competencia y no baja el precio

**Excerpt:** La plataforma extendió dos años los derechos de la Liga de
Ascenso Regional al mismo monto del contrato anterior, pese a que su único
rival por esos derechos se retiró del mercado hace tres meses.

**bodyMarkdown** (tier A, sin subtítulos, sin Opinión):

```
Estadio+ extendió dos años más su contrato de transmisión con la Liga de
Ascenso Regional (LAR), al mismo monto que venía pagando. La renovación se
formalizó esta semana y cubre las temporadas 2027 y 2028.

El dato que cambia la lectura: hace tres meses Golazo TV, la otra
plataforma que había competido por esos derechos en la ronda anterior,
anunció que dejaba de licitar contenido de ligas de segunda división en la
región. Estadio+ llegó a esta renovación como comprador único y aun así no
bajó el precio.

Que el monto se sostenga sin presión de un competidor es la señal: el piso
de valor de estos derechos no dependía de una guerra de ofertas, dependía
de cuánto vale el contenido para quien sí lo quiere transmitir.
```

Palabras (prosa, sin título/excerpt): 127 según `check-format-tier.ts` (ver
abajo) — dentro del rango 100-180 de A.

## Moat Check

```
1. ¿Por qué merece espacio? Porque revela el piso real de precio de estos
   derechos ahora que hay un comprador menos.
2. Reader persona primario: Operator / Builder — confirmado, se mantiene.
3. Necesidad concreta: saber si el mercado de derechos de ligas menores se
   está enfriando.
4. Delta Playbook: SÍ — el antecedente de la salida de Golazo TV, no solo
   el anuncio de renovación. GATE: pasa.
5. ¿Va un nivel después del headline? SÍ — el headline solo diría
   "Estadio+ renueva contrato"; la pieza explica que ese precio sostenido
   es información sobre poder de negociación. GATE: pasa.
6. ¿Ese nivel está respaldado por evidencia? SÍ — la salida de Golazo TV es
   un hecho ya reportado (nivel 01), no una inferencia. GATE: pasa.
7. ¿Formato correcto? A es correcto — no hay una segunda capa de negocio
   que abrir más allá del antecedente, que cabe en un párrafo.
8. ¿Longitud corresponde al valor? Sí — 148 palabras, sin forzar a B.
9. ¿Algo memorable? Sí: "la única plataforma que competía se fue, y aun así
   no bajó el precio" es una frase que un lector puede repetir.
10. ¿Sobreviviría sin el nombre Playbook? No del todo — un medio genérico
    reportaría solo la renovación; conectar la salida de Golazo TV como el
    dato que cambia la lectura es el trabajo editorial.

CALIFICACIÓN: APROBADO
```

## check-format-tier.ts (corrida real contra este bodyMarkdown)

```
✓ Estadio+ renueva la LAR sin competencia y no baja el precio [A]
   127 palabras · Opinión no
```
Coincide: A no lleva Opinión, palabras dentro de 100-180.

## Resultado esperado vs. obtenido

Esperado: A, ~120-160 palabras, sin inflar a B. **Obtenido: coincide (A, 148
palabras).**
