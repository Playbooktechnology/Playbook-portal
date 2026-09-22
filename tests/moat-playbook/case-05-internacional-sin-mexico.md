# Caso 5 — Historia internacional sin conexión real con México

Escenario del prompt: "Debe poder publicarse sin inventar 'qué significa
para México'." Entidades **ficticias**.

## Input (sintético)

> "Ashford United" (club de fútbol inglés ficticio) firmó un nuevo
> patrocinio de camiseta con "NordTech" (empresa de tecnología nórdica) por
> €40 millones al año, el contrato de patrocinio de camiseta más alto de su
> historia. Ningún actor mexicano o latinoamericano, ningún jugador de la
> región en el plantel, sin sede ni operación de NordTech en LATAM.

## Step 0.5 — Editorial gate

```
DECISIÓN: PUBLICAR
RAZÓN: Es el patrocinio de camiseta más alto de la historia del club — un
  benchmark de precio útil para cualquiera en la industria, con o sin
  conexión regional.
READER PERSONA PRIMARIO: Commercial Leader
NECESIDAD DEL READER: tener un punto de referencia actualizado de cuánto
  puede valer un patrocinio de camiseta en un club de ese perfil.
DELTA PLAYBOOK: contextualizar la cifra contra el patrocinio anterior del
  club y contra comparables recientes en ligas similares.
EVIDENCIA DISPONIBLE: monto confirmado por ambas partes, duración del
  contrato.
DATOS QUE FALTAN: cifra exacta del patrocinio anterior (se maneja un rango
  reportado por otra fuente).
```

## Step 3 — Router

```
FORMATO: B
RAZÓN: Hay una segunda capa (qué explica el salto de precio) más allá del
  anuncio, pero no hace falta reconstruir estructura compleja para
  entenderlo.
READER PERSONA PRIMARIO: Commercial Leader
DELTA PLAYBOOK ESPERADO: comparar contra el patrocinio anterior y explicar
  qué cambió para justificar el salto (audiencia, resultados deportivos,
  mercado de patrocinios de camiseta en general).
PALANCA DE NEGOCIO PRINCIPAL: inventario comercial / captura de valor.
```

**Investigación de la conexión regional (obligatoria antes de redactar, per
`voice-and-style.md` §9):** ¿juega el club en México o LATAM? No. ¿hay
socio comercial local? No. ¿jugadores mexicanos o latinoamericanos en el
plantel? No. ¿NordTech opera en la región? No. **Los cuatro checks salen en
cero — no hay conexión genuina que investigar más.**

## Draft (extracto)

**Título:** Ashford United firma su patrocinio de camiseta más caro: €40M al año

**bodyMarkdown** (extracto, cierre):

```
[...movimientos sobre el monto, el patrocinador anterior, y qué cambió...]

**Opinión de Playbook:** El salto de precio dice más sobre el mercado de
patrocinios de camiseta en ligas de primer nivel que sobre Ashford United
en particular: los patrocinadores tecnológicos están dispuestos a pagar
premium por visibilidad recurrente semanal frente a un público masivo, algo
que ni el streaming ni la publicidad digital replican al mismo costo por
impresión. Es una señal de hacia dónde sigue moviéndose el dinero de
patrocinio deportivo en general, no una historia sobre este club
específico.
```

**Nota explícita en el cierre:** no se agrega una línea "para México/LATAM
esto representa…" porque no hay ningún hecho genuino de la región en la
historia — forzarla habría sido exactamente el error que `voice-and-style.md`
§9 describe.

## Moat Check

```
4. Delta Playbook: SÍ — el patrocinio anterior + la lectura de mercado.
5. ¿Un nivel después del headline? SÍ.
6. ¿Respaldado por evidencia? SÍ, nivel 01/02.
9. Algo memorable: sí, la idea de "premium por visibilidad recurrente"
   aplicable a leer otros patrocinios.
10. ¿Sobreviviría sin Playbook? Parcialmente — el ángulo de mercado es el
    valor agregado real.

CALIFICACIÓN: APROBADO
```

## Resultado esperado vs. obtenido

Esperado: publicado, cerrando en lectura de industria global, sin forzar
México/LATAM. **Obtenido: coincide** — los cuatro checks de investigación
salieron en cero y el cierre se dejó en el mecanismo de mercado, tal como
`voice-and-style.md` §9 pide para este caso ("both outcomes are correct",
y este es el caso donde la respuesta honesta es "no hay conexión").
