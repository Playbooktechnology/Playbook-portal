# Caso 7 — Noticia A con delta Playbook, sin Opinión separada

Escenario del prompt: "Debe contener delta Playbook sin añadir una Opinión
separada." Entidades **ficticias**.

## Input (sintético)

> La "Copa Centroamericana" (torneo ficticio) anunció que su edición 2027
> se jugará en Ciudad de Panamá, después de haberse anunciado originalmente
> para San José. Es el tercer cambio de sede en las últimas cuatro
> ediciones del torneo.

## Step 0.5 — Editorial gate

```
DECISIÓN: PUBLICAR
RAZÓN: El dato de "tercer cambio de sede en cuatro ediciones" es un patrón,
  no un anuncio aislado — vale la pena que el lector lo sepa aunque sea en
  formato breve.
READER PERSONA PRIMARIO: Sports Lover / Backstage Curious
DELTA PLAYBOOK: el patrón de inestabilidad de sede, no solo el cambio en sí.
```

## Step 3 — Router

```
FORMATO: A
RAZÓN: El movimiento (cambio de sede) más el dato que lo dimensiona (tercer
  cambio en cuatro ediciones) explican por sí solos por qué importa. No
  hace falta abrir mecanismo o incentivos para que la nota tenga valor —
  cabe en HECHO → CONTEXTO → CONSECUENCIA.
```

## Draft

**Título:** La Copa Centroamericana cambia de sede por tercera vez en cuatro ediciones

**bodyMarkdown** (tier A, 121 palabras según `check-format-tier.ts`, sin
Opinión separada):

```
La Copa Centroamericana 2027 se jugará en Ciudad de Panamá, confirmó la
organización del torneo. La sede original, anunciada hace ocho meses, era
San José.

Es el tercer cambio de sede en las últimas cuatro ediciones del torneo: la
2023 pasó de Tegucigalpa a San Salvador, y la 2025 de Ciudad de Guatemala a
Panamá antes de terminar jugándose en San Salvador de nuevo. Ninguno de los
cambios se ha explicado con el mismo detalle con el que se anuncia la sede
original.

El patrón importa más que el cambio puntual: un torneo que no logra
sostener una sede confirmada complica la planeación de patrocinadores,
televisoras y aficionados que compran boletos con meses de anticipación
sobre una ciudad que después cambia.
```

**El delta está en el tercer párrafo** — no es Opinión de Playbook separada
(tier A no la lleva), es la consecuencia que dimensiona el hecho, integrada
en la arquitectura HECHO → CONTEXTO → CONSECUENCIA del propio formato A.

## Moat Check

```
4. Delta Playbook: SÍ — el patrón de tres cambios en cuatro ediciones, no
   solo el anuncio. GATE: pasa.
5. ¿Un nivel después del headline? SÍ — el headline ya dice "tercera vez",
   pero el cuerpo explica la consecuencia comercial del patrón. GATE: pasa.
6. ¿Respaldado por evidencia? SÍ, los tres cambios son verificables contra
   el archivo del torneo (nivel 01). GATE: pasa.
7. Formato correcto: A, sí.
8. Longitud: 121 palabras, dentro de 100-180.

CALIFICACIÓN: APROBADO
```

## check-format-tier.ts (corrida real contra este bodyMarkdown)

```
✓ La Copa Centroamericana cambia de sede por tercera vez en cuatro edici [A]
   121 palabras · Opinión no
```

## Resultado esperado vs. obtenido

Esperado: A con delta Playbook, sin Opinión separada. **Obtenido: coincide.**
