# The editorial system — Moat Playbook

*Implementado 2026-09-13. Este documento es la referencia de arquitectura
editorial del repo — enlazado desde
[`docs/ENCYCLOPEDIA.md`](./ENCYCLOPEDIA.md) §13 y §18, no aislado.*

## Principio central

Playbook no añade profundidad por obligación. Añade valor.

Una noticia puede resolverse en 120 palabras o necesitar 1,000+, pero
después de pasar por Playbook el lector debe saber, entender, conectar o
cuestionar algo que el headline, comunicado o fuente original por sí solo
no le daba.

**Toda pieza necesita delta Playbook. No toda pieza necesita profundidad
Playbook.**

El Moat Playbook NO significa hacer todos los artículos Deep Dive, poner
Opinión de Playbook en todo, meter un cálculo o benchmark artificialmente,
llenar cada nota de contexto, forzar una conexión con México/LATAM, o
alargar una noticia sencilla. Significa que la noticia es materia prima y
que, después de pasar por Playbook, vale más para el lector.

La sensación que se busca en el lector: **"Podría haberme enterado de esto
en otro lado, pero Playbook me ayudó a entenderlo mejor."** Ese es el
estándar, y el criterio final con el que se juzga el sistema completo:
subir el piso editorial para que ninguna pieza se sienta como una noticia
genérica o un comunicado reescrito, sin convertir todas las historias en
análisis largos.

## Dónde vive cada pieza del sistema

Este documento no repite las reglas — cada una vive en un solo archivo del
árbol compartido `.claude/playbook-editorial/`, symlinkeado (nunca
forkeado — ver `_GOVERNANCE.md`) en las cuatro skills que lo usan:
`publish-newsletter`, `publish-sourced-article`, `publish-partner-announcement`
y `hub-builder`.

| Paso del flujo | Pregunta que responde | Archivo |
|---|---|---|
| 0. Overlap check | ¿esta historia ya vive en el sitio? | `overlap-check.md` |
| 0.5. **El gate editorial** | ¿esta historia merece espacio en Playbook, y qué podemos añadir? | `editorial-gate.md` |
| 1-2. Ingesta e investigación | (específico por funnel) | `ingestion.md` de cada skill |
| 2b. Postura editorial | ¿toca una relación sensible? | `postura-editorial.md` |
| 3. **El router** | ¿A, B, C o D? | `format-tiers.md` §1 |
| 4. **El núcleo común** | movimiento/mecanismo/incentivo/consecuencia | `voice-and-style.md` §1 |
| 5. Elemento visual | ¿qué device, si alguno? | `dynamic-element-library.md` |
| 6. Campos y taxonomía | título, excerpt, tags, boleta, imagen | `fields-and-taxonomy.md`, `images.md` |
| 7. Self-check + **Moat Check** | ¿está bien escrito, y merecía escribirse? | `voice-and-style.md` §12, `moat-check.md` |
| 8/9. Publicación | (zero-review o con gate humano, según la skill) | `publishing-mechanics.md` de cada skill |

## El flujo completo

```
fuente → overlap check → gate editorial → ingesta/investigación
       → router A/B/C/D → núcleo Playbook → prompt del formato
       → self-check + Moat Check → campos CMS → publicación
```

## Los cuatro niveles del sitio (profundidad, no calidad)

| | Formato | Pregunta editorial | Longitud | Opinión | Devices |
|---|---|---|---|---|---|
| **A** | Noticia Breve | ¿Qué pasó? | 100-180 palabras | No | Ninguno, salvo excepción |
| **B** | Noticia Playbook | ¿Qué pasó y qué significa? | 250-500 palabras | Sí | Opcional, ligero |
| **C** | Deep Dive | ¿Cómo funciona realmente este negocio? | 700-1,200 palabras | Sí, un párrafo | 2-4 |
| **D** | La Lana del Deporte | ¿Qué pregunta de industria queremos resolver? | flujo propio | Sí, 3 viñetas | según el expediente |

D **no se genera con este pipeline** — tiene su propio sistema de research y
escritura; aquí solo se traslada al sitio conservando tesis, estructura,
voz, postales, tres preguntas y Opinión, palabra por palabra
(`format-tiers.md` §4, "el contrato verbatim").

Detalle completo de arquitectura por formato: `format-tiers.md` §1-§4.

## El gate editorial (`editorial-gate.md`)

Antes de rutear formato, decide si la historia merece publicarse en
absoluto:

```
DECISIÓN: PUBLICAR / NO PUBLICAR TODAVÍA / RADAR
RAZÓN:
READER PERSONA PRIMARIO:
NECESIDAD DEL READER:
DELTA PLAYBOOK:
EVIDENCIA DISPONIBLE:
DATOS / EVIDENCIA QUE FALTAN:
```

Ninguno de estos, por sí solo, justifica publicar: que exista un
comunicado, que otra publicación lo haya cubierto, que sea trending, que
haya una cifra grande, un patrocinio nuevo, varios links disponibles, la
posibilidad de hacer una gráfica, o la posibilidad de inventar una conexión
con México/LATAM. Para avanzar hace falta importancia editorial suficiente
y algo útil que Playbook pueda aportar — no exige scoop, sí exige
exclusividad de valor.

Para `publish-newsletter` (zero-review), esta es la única forma en que una
historia puede no publicarse: no hay revisión humana después. Para
`publish-sourced-article`, el gate corre antes de que el borrador exista, no
sustituye el Step 8 (revisión humana), que sigue siendo el filtro final para
lo que sí se redactó.

## Reader personas

Cada artículo carga un reader persona primario interno (no tiene que
mostrarse en el sitio), elegido de: Decision Maker, Operator / Builder,
Commercial Leader, Investor / Advisor, Emerging Leader, Student / Future
Industry Professional, Sports Lover / Backstage Curious, Opportunity Seeker
/ Entrepreneur, Amplifier / Interpreter. El rigor no cambia según la
persona; el nivel y tipo de explicación sí. Detalle: `editorial-gate.md`.

## El Moat Check (`moat-check.md`)

Corre en Step 7, junto al checklist de doce puntos existente (no lo
reemplaza). Diez preguntas; las 4, 5 y 6 son gates:

1. ¿Por qué esta historia merece espacio en Playbook?
2. ¿Quién es el reader persona primario?
3. ¿Qué necesidad concreta resolvemos?
4. ¿Cuál es el delta Playbook? — **gate**
5. ¿La pieza va al menos un nivel después del headline? — **gate**
6. ¿Ese nivel adicional está respaldado por evidencia? — **gate**
7. ¿Elegimos correctamente A/B/C?
8. ¿La longitud corresponde al valor disponible?
9. ¿Existe algo que el lector pueda recordar, utilizar, compartir o llevar
   a una conversación?
10. ¿La pieza seguiría teniendo prácticamente el mismo valor si quitamos el
    nombre Playbook y la generara cualquier medio a partir del comunicado?

Si falla cualquiera de los tres gates, la calificación no puede ser mejor
que `REQUIERE REEDICIÓN` — nunca `AJUSTES MENORES`, sin importar qué tan
pulida esté el resto de la prosa. Calificaciones: `APROBADO` / `AJUSTES
MENORES` / `REQUIERE REEDICIÓN` / `NO PUBLICAR TODAVÍA`. Después: máximo
cinco cambios concretos, y solo después la versión corregida — nunca
reescribir automáticamente antes del diagnóstico.

## Determinístico vs. editorial

El gate, el router y el Moat Check son **juicio editorial de un LLM** — se
validan con los 10 casos narrativos de `tests/moat-playbook/` y revisión
manual, nunca con un `assert` de código. Lo que sí es lógica determinística
y lleva test automatizado real:

- Validación de taxonomía (`lib/taxonomy.ts`), ya existente.
- La boleta 0-99 obligatoria (`lib/rank.ts`), ya existente.
- El overlap check (`findOverlaps` en `scripts/publish-newsletter.ts`), ya
  existente, código, bloqueante.
- Ritmo de párrafo, fórmulas de antítesis, guion largo
  (`scripts/check-voice.mjs`), ya existente, no bloqueante por diseño.
- Conteo de palabras y presencia/ausencia de Opinión contra el tier
  declarado (`scripts/check-format-tier.ts`, nuevo), no bloqueante por
  diseño — confirma la mitad mecánica de las preguntas 7 y 8 del Moat
  Check, nunca puede juzgar las preguntas 1-6, 9 y 10.

## Voz, región y gráficos

Reglas completas en `voice-and-style.md` (voz, ritmo, fórmulas evitadas,
niveles de evidencia, la conexión México/LATAM) y `format-tiers.md` /
`dynamic-element-library.md` (gráficos como consecuencia de la
investigación, nunca criterio de formato). No se repiten aquí — ver
`_GOVERNANCE.md` para la regla de "un archivo, una regla, sin fork".

## Pruebas de aceptación

Los 10 casos narrativos del prompt original viven en
`tests/moat-playbook/`, con input sintético y el output completo de cada
paso (gate/router/draft/Moat Check), corridos en dry-run. Ver ese
directorio para el detalle caso por caso y qué se pudo/no se pudo correr
de verdad contra la base de datos en el entorno de esta implementación.

## Fase 6 (propuesta, fuera de alcance de esta implementación)

Elementos gráficos y dinámicos tipo Bloomberg/Financial Times/Axios
(módulos de datos, callouts, tratamiento visual propio para postales, tres
preguntas, Opinión, cifras clave). El Cambio 12 de esta implementación
resuelve **cuándo** usar una gráfica; no construye ese lenguaje visual más
amplio. Queda documentado para cuando se decida atacarlo como encargo
separado, idealmente después de que este sistema lleve tiempo corriendo
estable.
