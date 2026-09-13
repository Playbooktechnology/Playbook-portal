# Moat Playbook — 10 casos de aceptación

Corridos en **dry-run** (sin publicar de verdad, sin tocar Postgres, sin
disparar deploy) contra el sistema editorial reforzado en
`.claude/playbook-editorial/`. Todas las entidades, marcas y ligas usadas en
los 10 casos son **ficticias**, inventadas para este test.

Cada `case-NN-*.md` tiene el input sintético, y el output completo de cada
paso (gate → router → draft → Moat Check), no solo un resumen pass/fail —
tal como pide el encargo. Cinco de los diez casos (2, 3, 7, 9, 10) llegan a
producir un `bodyMarkdown` completo; esos cinco quedan además en
`fixture-drafted-cases.json` y se corrieron de verdad contra
`scripts/check-voice.mjs` y `scripts/check-format-tier.ts` — no simulado.
Los otros cinco (1, 5, 6, 8 con su borrador defectuoso, y el ejercicio de
contraste del 6) se detienen antes del draft por diseño del propio caso
(el gate los frena, o el caso existe para mostrar una falla), o solo llevan
un extracto de la pieza completa (caso 4, que en producción correría ~800
palabras).

## Qué SÍ se corrió de verdad en este sandbox

- `scripts/check-format-tier.ts` (nuevo, Fase 5) contra los 5 borradores
  reales → `check-format-tier.output.txt`.
- `scripts/check-voice.mjs` contra los mismos 5 → `check-voice.output.txt`.
  Primera corrida encontró un guion largo real en el borrador del caso 3
  (documentado en ese archivo); se corrigió y la segunda corrida salió
  limpia.
- `npx tsc --noEmit` sobre todo el repo tras los cambios de Fase 5a: **0
  errores**.

## Gap real encontrado y corregido: `check-format-tier.ts` no estaba conectado a nada

Al presentar este suite se preguntó directamente: *"¿esto corre antes de
publicar de verdad, o solo lo corrieron ustedes aparte?"* La respuesta,
verificada con grep, era la segunda: `check-format-tier.ts` existía como
script suelto -- 0 menciones en cualquier `SKILL.md`, 0 llamadas desde
`scripts/publish-newsletter.ts`, 0 en CI. Un artículo real con el mismo
defecto que el caso 9 (156 palabras en un tier B) se habría publicado tal
cual, sin nada que lo detuviera; "el chequeo lo atrapó" solo era cierto
porque se corrió a mano hoy.

**Corregido en el mismo PR:**

1. `scripts/check-format-tier.ts` ahora exporta `analyseTier()`, y clasifica
   cada hallazgo en dos severidades en vez de un flag plano: **severo**
   (una estructura binaria mal -- Opinión ausente/de más, o un párrafo de
   prosa después de la Opinión en un Deep Dive -- o un conteo de palabras a
   más del 30% fuera del rango del tier) vs. **marginal** (un desfase chico,
   ej. 240 palabras contra un piso de 250).
2. `scripts/publish-newsletter.ts` lo llama de verdad, justo después del
   overlap gate: un hallazgo **severo** bloquea el publish (mismo patrón
   que `findOverlaps` -- exit code 1, nada se inserta, hace falta
   `--allow-tier-mismatch` explícito). Un hallazgo **marginal** solo
   imprime un aviso, igual que `check-voice.mjs` por defecto.
3. Se agregó el campo opcional `tier` al `ArticleInput` (sin tocar el
   esquema de Postgres -- es solo el contrato JSON transitorio del script)
   y se instruyó explícitamente en el Step 7 de ambos `SKILL.md`
   (`publish-newsletter`, `publish-sourced-article`) fijarlo en cada
   artículo, porque sin él el gate no tiene nada que verificar.
4. Verificado con `analyseTier()` corrido de forma aislada (sin DB): el
   caso 9 real (156p, sin Opinión repetitiva) sale `severe`; un caso
   sintético de 240p contra el mismo piso sale `marginal` -- la
   distinción funciona como se pidió.

**También se corrigió la atribución de causa raíz del caso 9**: no es
evidencia de un bug en el router ni en el prompt de B -- el caso fijaba
`tier: B` a mano, sin correr el gate ni el router sobre el input. Detalle
completo en `case-09-bien-escrito-pero-sustituible.md`.

## Auditoría: ¿hay otras herramientas con el mismo patrón (construidas, nunca conectadas)?

Grep sobre todo `scripts/check-*` y `scripts/test-*` contra `.claude/`,
`scripts/publish-newsletter.ts` y `.github/workflows/ci.yml`. Dos
categorías distintas:

- **Suites de regresión sobre código** (`test-device-archive-safety.ts`,
  `test-device-guards.ts`, `test-duplicate-detection.mjs`,
  `test-email-wall.mjs`, `test-overlap-gate.ts`, `test-voice-antithesis.mjs`)
  -- 0 referencias en `.claude/`, pero **correctamente**: están pensadas
  para correr cuando alguien toca el código subyacente (`lib/article-devices.ts`,
  `find-duplicates.mjs`, etc.), no para auditar un draft antes de publicar.
  No es el mismo problema.
- **Chequeos de pre-publicación** -- las únicas tres pensadas para correr
  contra un draft antes de que se publique: `check-voice.mjs`,
  `check-format-tier.ts`, `check-draft-devices.ts`. De las tres, **una
  segunda queda huérfana y sin corregir en este PR**:
  `scripts/check-draft-devices.ts`. Su propio comentario de cabecera dice
  literalmente *"this is the check that belongs before publishing, not
  after"* (un device mal formado se publica como texto plano visible, sin
  aviso) -- pero 0 menciones en cualquier `SKILL.md`, 0 wireo en
  `scripts/publish-newsletter.ts`, 0 en CI. Es preexistente (no se
  construyó en este PR) y queda **fuera de alcance de esta corrida** --
  señalado aquí para que no aparezca como sorpresa después, y candidato
  directo para el mismo tratamiento que `check-format-tier.ts` acaba de
  recibir.

## Qué NO se pudo correr en este sandbox (limitación de entorno, no del código)

- `scripts/publish-newsletter.ts --dry-run` de verdad, y
  `scripts/test-overlap-gate.ts`: ambos necesitan `POSTGRES_URL` (el
  overlap check consulta el archivo real de Postgres incluso en dry-run,
  por diseño — ver el comentario en `findOverlaps`). Esta sesión no tiene
  `.env.local` ni credenciales de base de datos. El código de `--dry-run`
  está escrito, tipado limpio y probado hasta donde no requiere DB; falta
  correrlo con credenciales reales antes de confiar en él en el preview
  deploy del PR.

## Tabla de resultados

| # | Caso | Decisión esperada | Decisión obtenida | Nota |
|---|---|---|---|---|
| 1 | Patrocinio sin cifras | NO PUBLICAR/RADAR | NO PUBLICAR TODAVÍA | gate frena antes del router |
| 2 | Movimiento simple + antecedente | A, 120-160p | A, 127p, aprobado | check-format-tier + check-voice limpios |
| 3 | Cambio de control | B, segunda capa | B, 288p, aprobado | atrapó y corrigió un em-dash real |
| 4 | Adquisición compleja | C, reconstrucción | C (extracto ~800p) | pieza completa no corrida por script |
| 5 | Internacional sin México | publica sin forzar ángulo | B, sin ángulo forzado | los 4 checks de conexión regional dieron cero |
| 6 | Evidence gap | detecta gap, no fabrica certeza | RADAR en el gate | contraste: forzarlo cae en REQUIERE REEDICIÓN |
| 7 | A con delta, sin Opinión | A con delta | A, 121p, sin Opinión | aprobado |
| 8 | B con Opinión que repite | reedición | REQUIERE REEDICIÓN | gates 4/5 fallan, 5 cambios concretos dados |
| 9 | Bien escrito pero sustituible | falla Moat Check | NO PUBLICAR TODAVÍA | 156p también sale SEVERO en check-format-tier.ts (ahora bloqueante de verdad); caso re-etiquetado: no prueba un bug de router, ver el archivo |
| 10 | 120 palabras bastan | A, no inflar | A, 107p, aprobado | no se forzó a 300-500 |

9 de 10 casos coinciden exactamente con el resultado esperado por el
prompt; el caso 10 coincide en espíritu (A, sin Opinión, muy por debajo de
B) con un conteo real (107) más bajo que la estimación inicial del
prompt (~120-160), lo cual es la dirección correcta del error, no la
opuesta.

## 3 ejemplos reales, antes/después (entregable #7)

No hubo acceso a `POSTGRES_URL`/`.env.local` en este sandbox, así que no se
pudieron extraer artículos reales recientes directamente de la tabla
`articles` (ver la limitación arriba). En su lugar, estos son tres
incidentes **reales y ya documentados con fecha** dentro del propio árbol
editorial (`.claude/playbook-editorial/`) — no artículos sintéticos —
mostrando qué habría cambiado con lo construido en este PR.

1. **FMF Nuevo Modelo Deportivo (2026-08-20)** — documentado en
   `format-tiers.md` §1: una historia con mecanismo + dinero + precedente
   se publicó como B de 420 palabras y el humano la devolvió pidiendo
   profundidad C. **Antes:** el router no tenía un output estructurado que
   obligara a nombrar `PALANCA DE NEGOCIO PRINCIPAL` / `PREGUNTA CENTRAL`
   antes de rutear. **Después:** el bloque de salida del router (Fase 1,
   `format-tiers.md` §1) obliga a nombrarlos antes de elegir formato — el
   mismo chequeo que el propio archivo dice que habría evitado el caso.
2. **CBF/Copa do Brasil, Opinión en dos párrafos (2026-09-13)** —
   documentado en `format-tiers.md` §3b: un Deep Dive publicó la Opinión en
   dos párrafos y el segundo quedó como texto plano después del callout
   verde, detectado en vivo por un revisor. **Antes:** ningún chequeo
   automático lo atrapaba. **Después:** `scripts/check-format-tier.ts`
   (nuevo, Fase 5) detecta mecánicamente un párrafo de prosa justo después
   de la Opinión en un tier C y lo marca — ver el caso 3 de este directorio
   para la misma detección corriendo en vivo contra un borrador real.
3. **Pieza de ingresos publicitarios de la NBA (2026-08-20)** —
   documentado en `voice-and-style.md` §9: cerró con "esto es exactamente
   la pregunta que hoy se hacen las ligas y las televisoras en México y
   América Latina" sin que la historia tuviera un solo hecho, actor o
   cifra mexicana o latinoamericana. **Antes:** la regla existía en prosa
   pero nada obligaba a declarar los cuatro checks de investigación antes
   de cerrar. **Después:** el Moat Check pregunta 4 (delta) y el propio
   gate (`editorial-gate.md`) exigen declarar `DATOS DISPONIBLES` /
   `DATOS QUE FALTAN` desde antes de redactar — ver el caso 5 de este
   directorio, que corre exactamente esos cuatro checks explícitamente
   antes de cerrar sin ángulo regional.

## Separación determinístico vs. editorial (pedida en "Cómo ejecutar este encargo")

**Lógica determinística, con test automatizado real:**
- Validación de taxonomía (`lib/taxonomy.ts`, ya existente, corre en
  `scripts/publish-newsletter.ts`).
- Boleta obligatoria y su cálculo (`lib/rank.ts`, ya existente).
- Overlap/dedupe (`findOverlaps`, ya existente, código, bloqueante).
- Conteo de palabras y presencia/ausencia de Opinión contra el tier
  declarado (`scripts/check-format-tier.ts`, nuevo en esta corrida).
- Ritmo de párrafo, fórmulas de antítesis, guion largo
  (`scripts/check-voice.mjs`, ya existente).

**Juicio editorial de LLM, validado por los 10 casos + revisión manual, sin
assert de código:**
- El gate (`editorial-gate.md`): ¿esta historia merece espacio?
- El router en sí (`format-tiers.md` §1): ¿A, B, C o D? (el chequeo
  determinístico solo confirma que el borrador *calza* con el tier ya
  elegido, nunca elige el tier)
- El Moat Check (`moat-check.md`): las 10 preguntas, especialmente si hay
  delta real, si la interpretación tiene evidencia, y si la pieza
  sobreviviría sin el nombre Playbook.
- La calidad de la Opinión de Playbook (si repite la noticia o añade una
  lectura real) — `check-voice.mjs` no puede juzgar esto, solo el ritmo de
  la prosa.
