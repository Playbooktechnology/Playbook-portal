# The Moat Playbook — editorial system spec

*v1, 2026-09-13. Implemented across `.claude/playbook-editorial/` and both
publish skills; see "Where this lives in the repo" below for the exact file
per rule. This document is the durable editorial spec — update it in the same
change whenever the underlying rule changes, per
`.claude/playbook-editorial/_GOVERNANCE.md`'s "date it and name its source."
Linked from `docs/ENCYCLOPEDIA.md` §13, not a standalone doc.*

## Rol y objetivo

El sistema editorial que alimenta `publish-newsletter` y
`publish-sourced-article` no busca rehacer el website desde cero ni hacer que
todos los artículos sean más largos. El objetivo es que **toda publicación
futura tenga un delta editorial reconocible de Playbook**, manteniendo
distintos niveles de profundidad según lo que cada historia necesita.

## Principio central

Playbook no añade profundidad por obligación. Añade valor. Una noticia puede
resolverse en 120 palabras o necesitar 1,000+, pero después de pasar por
Playbook el lector debe saber, entender, conectar o cuestionar algo que el
headline, comunicado o fuente original por sí solo no le daba.

> **Toda pieza necesita delta Playbook. No toda pieza necesita profundidad
> Playbook.**

El Moat Playbook NO significa hacer todos los artículos Deep Dive, poner
Opinión de Playbook en todo, meter un cálculo o benchmark artificialmente,
llenar cada nota de contexto, forzar una conexión con México/LATAM, o alargar
una noticia sencilla. Significa que la noticia es materia prima y que,
después de pasar por Playbook, vale más para el lector.

El delta puede venir de: información propia, un dato relevante, contexto, un
antecedente, una consecuencia, un mecanismo, economics, incentivos, control,
riesgo, propiedad, distribución, poder de negociación, benchmark, comparable,
conexión, cálculo, contradicción, implicación, una pregunta nueva, o
identificar con claridad qué información importante todavía falta. Ninguno de
estos elementos se mete solamente para demostrar research.

## El flujo completo

```
fuentes → brief editorial → GATE editorial → router A/B/C/D → núcleo Playbook
  → prompt del formato → control editorial final (+ Moat Check) → CMS
```

Los tres niveles normales del website:

- **A · NOTICIA BREVE** — ¿Qué pasó y qué necesito saber para entenderlo
  bien? 100–180 palabras. Sin Opinión de Playbook separada. Sin gráficos
  normalmente.
- **B · NOTICIA PLAYBOOK** — ¿Qué pasó y qué estamos viendo detrás? 250–500
  palabras. Con una segunda capa concreta de negocio. Con Opinión de
  Playbook. Gráficos opcionales.
- **C · DEEP DIVE** — ¿Cómo funciona realmente este negocio? 700–1,200
  palabras. News-driven: parte de una noticia concreta, pero necesita
  reconstruir números, actores, estructura, comparables, mecanismos,
  incentivos o riesgos. Opinión de Playbook. Gráficos sólo cuando ayudan a
  responder preguntas.
- **D · LA LANA DEL DEPORTE** — No se genera con este flujo. Tiene su propio
  sistema de research y escritura; aquí solamente se adapta al website
  conservando tesis, estructura, voz, postales, tres preguntas y Opinión de
  Playbook.

**A/B/C definen PROFUNDIDAD, no CALIDAD.** Una A puede ser excelente. Una B
no debe inflarse hacia C. Una C no debe existir si la historia no la
soporta.

## 1. El gate editorial

Antes de rutear el formato, una decisión previa: ¿esta historia merece
espacio en Playbook y qué valor podemos añadir? Puede devolver **PUBLICAR /
NO PUBLICAR TODAVÍA / RADAR**. Una historia NO merece automáticamente un
artículo porque exista un comunicado, otra publicación la haya cubierto, sea
trending, haya una cifra grande, un patrocinio nuevo, varios links, se pueda
hacer una gráfica, o se pueda inventar una conexión con México/LATAM.

Para avanzar a publicación debe existir al menos: importancia editorial
suficiente, y algo útil que Playbook pueda aportar. No se exige un scoop; sí
se exige exclusividad de valor.

## 2. El router

Conserva la lógica de que la profundidad define el formato. No la definen:
cantidad de research disponible, número de links o cifras, posibilidad de
crear gráficos, ni el deseo de "aterrizar" una historia global a México.

## 3. El núcleo común Playbook

Cuatro lentes base: **MOVIMIENTO** (qué ocurrió), **MECANISMO** (cómo
funciona realmente), **INCENTIVO** (por qué los actores toman esa decisión),
**CONSECUENCIA** (qué cambia). No todas las piezas desarrollan las cuatro
capas con la misma profundidad — son lentes de análisis, no una plantilla
visible.

**Principio superior:** Playbook debe ir al menos un nivel después del
headline, pero ese nivel puede ser una sola frase excelente.

Ocho preguntas adicionales, cuando aplican (no todas, solo las que explican
la historia): ECONOMÍA, VALOR, RIESGO, CONTROL, INCENTIVOS, MERCADO, FAN,
SIGUIENTE MOVIMIENTO.

## 4-7. Los formatos

**A** sigue sin tesis, sin Opinión separada, sin subtítulos, sin moraleja,
sin gráficos normalmente — pero sin Opinión no significa sin delta. Si no
existe ningún valor adicional y sólo se puede reescribir el comunicado, se
cuestiona si merece publicación (vuelve al gate).

**B** es NOTICIA + UNA SEGUNDA CAPA CONCRETA DE NEGOCIO, no "A más larga". La
Opinión de Playbook tiene que ganarse su espacio (cálculo, benchmark,
mecanismo, antecedente, contradicción, incentivo, cambio de control, cambio
de bargaining power, riesgo, consecuencia, pregunta concreta, o información
que falta) — nunca repetir la noticia o decir simplemente que algo es
importante. La estructura no se fuerza siempre a 3–5 encabezados; permite
mezcla de prosa y bloques en negritas cuando la historia lo pide.

**C** conserva el carácter news-driven. No usa análisis conceptual para
esconder evidence gaps: si una conclusión depende de algo no verificable,
se busca más evidencia, se consigue reporting, se reformula la pregunta, se
reconoce explícitamente lo que no se sabe, o no se publica todavía — en ese
orden. En la prosa se calibra con: **sabemos** (evidencia confirmada) /
**parece** (señal, no confirmado) / **podría** (hipótesis) / **no sabemos
todavía** (falta información).

**D (La Lana)** no se regenera con los prompts A/B/C. Se traslada
conservando artículo aprobado, tesis, estructura, subtítulos, tres
preguntas, cuatro postales, cierre, Opinión y voz — se adapta solo
presentación, metadata, hero, anexos y gráficas.

## 8. El control editorial final — Moat Check

El editor final sigue auditando VOZ, RITMO, FOCO, DATOS, ANÁLISIS, OPINIÓN,
FÓRMULAS, REGIÓN, CIERRE. Se añade una sección crítica, **MOAT PLAYBOOK**,
con diez preguntas — de qué se trata la historia, quién es el reader
persona, qué necesidad resuelve, cuál es el delta, si va un nivel más allá
del headline, si ese nivel tiene evidencia, si el formato es correcto, si la
longitud corresponde al valor, si hay algo memorable, y si seguiría teniendo
el mismo valor sin el nombre Playbook.

Las preguntas 4, 5 y 6 son GATES: sin delta, sin ir más allá del headline, o
sin evidencia, la pieza no puede calificarse APROBADO. **Regla de
severidad:** si falla cualquiera de los tres gates, la calificación no puede
ser mejor que REQUIERE REEDICIÓN — nunca AJUSTES MENORES.

Calificaciones: APROBADO / AJUSTES MENORES / REQUIERE REEDICIÓN / NO
PUBLICAR TODAVÍA. Después del diagnóstico: máximo cinco cambios concretos.
Sólo después, la versión corregida.

## 9. Reader persona

Cada artículo tiene un reader persona primario interno, que nunca se muestra
en el sitio. Sirve para decidir qué pregunta responder, qué puede darse por
sentado, qué datos son relevantes, qué dejar fuera. El rigor no cambia por
persona; el nivel y tipo de explicación sí.

Personas: Decision Maker, Operator / Builder, Commercial Leader, Investor /
Advisor, Emerging Leader, Student / Future Industry Professional, Sports
Lover / Backstage Curious, Opportunity Seeker / Entrepreneur, Amplifier /
Interpreter.

## 10. Voz

Natural, directa, segura, específica, humana, con criterio, financieramente
inteligente sin sonar a consultoría. Evitar "mirar/miramos/miro" cuando el
sentido es analizar — usar revisar, analizar, seguir, evaluar, medir,
comparar, entender, tener en cuenta.

Lista extendida de fórmulas a evitar (además de las nueve ya vigiladas):
"lo interesante no es…", "no tanto por…", "más que…" / "más que X, estamos
ante Y", "este caso demuestra que…" / "esto demuestra que…", "la clave
será…", "parece interesante", "nos metimos a…", "en un mundo donde…", "en el
dinámico panorama…", "esto marca un antes y un después", "solo el tiempo
dirá", "queda por ver", "la industria observa con atención", "el futuro está
por escribirse", "lo relevante aquí", "la lectura aquí es bastante clara".
Evitar también moralejas, lenguaje corporativo, metáforas artificiales,
párrafos demasiado simétricos, conclusiones redondas por obligación, frases
creadas para sonar profundas, raya larga, y certeza donde sólo existe
hipótesis.

## 11. México y Latinoamérica

México es el mercado de mayor profundidad; Latinoamérica, prioridad
estructural; el universo editorial es global. Nunca fabricar una conexión
regional. México/LATAM entra cuando existe actor, mercado, capital,
propiedad, audiencia, sede, consecuencia, comparable o conexión real.

## 12. Gráficos

No se cambia el formato por tener posibilidad de hacer una gráfica — los
gráficos son consecuencia de la investigación. A: normalmente ninguno. B:
opcionales. C: 2–4 sólo cuando hay preguntas que se entienden mejor
visualmente. Una gráfica debe comparar, dimensionar, ordenar, explicar,
conectar, mostrar evolución o revelar una relación. Nunca decoración.

## 13. CMS / publicación

Se conserva la lógica del panel y sus taxonomías. El proceso de escritura en
base de datos sólo ocurre después de pasar el control editorial final.
Ningún campo (título, extracto, teaser) introduce interpretaciones que el
artículo no sostiene. Título informativo, natural, específico, sin
clickbait, sin exagerar el estatus real de la noticia. Español de México,
tuteo, sin raya larga, sin conexión forzada, imagen con fuente/crédito real,
nunca URLs de imagen inventadas.

## Criterio final

El sistema debe conseguir simultáneamente: (A) subir el piso editorial del
website para que ninguna pieza se sienta como una noticia genérica o un
comunicado reescrito; (B) mantener suficiente disciplina para NO convertir
todas las historias en análisis largos.

La sensación que se busca en el lector: **"Podría haberme enterado de esto
en otro lado, pero Playbook me ayudó a entenderlo mejor."**

---

## Fase 6 (propuesta, fuera de alcance de esta implementación): elementos
## gráficos y dinámicos

No implementado. El Cambio 12 resuelve CUÁNDO usar una gráfica; no resuelve
el lenguaje visual más amplio tipo Bloomberg/Financial Times/Axios: módulos
de datos, callouts, tratamiento visual distinto para lo que ya es distinto
editorialmente (postales, tres preguntas, cifras clave, pull quotes de la
Opinión). Documentado aquí para cuando se decida atacarlo como encargo
separado. Punto de partida sugerido: auditar primero qué componentes
visuales ya existen en el front-end (`lib/article-devices.ts`,
`lib/product-hubs.ts`) antes de asumir que hace falta trabajo de
diseño/front-end nuevo; reservar cualquier módulo nuevo para B y sobre todo
C, dejando A limpio; usar el sistema de marca ya definido (Anton en
headers, Inter en cuerpo, verde/amarillo como acento sobre base neutra).

---

## Where this lives in the repo

| Regla | Archivo |
|---|---|
| Gate editorial (Cambio 1) | `.claude/playbook-editorial/editorial-gate.md` |
| Router A/B/C/D y su output (Cambio 2) | `.claude/playbook-editorial/format-tiers.md` §1 |
| Núcleo común + 8 lentes (Cambio 3) | `.claude/playbook-editorial/voice-and-style.md` §1 |
| Formato A (Cambio 4) | `.claude/playbook-editorial/format-tiers.md` §3 |
| Formato B (Cambio 5) | `.claude/playbook-editorial/format-tiers.md` §3 |
| Formato C (Cambio 6) | `.claude/playbook-editorial/format-tiers.md` §3b, evidencia en `voice-and-style.md` §8 |
| Formato D (Cambio 7) | `.claude/playbook-editorial/format-tiers.md` §1 y §4 (sin cambios — ya cumplía) |
| Moat Check (Cambio 8) | `.claude/playbook-editorial/voice-and-style.md` §12 |
| Reader persona (Cambio 9) | `.claude/playbook-editorial/voice-and-style.md` §13 |
| Voz y fórmulas (Cambio 10) | `.claude/playbook-editorial/voice-and-style.md` §7 |
| México/LATAM (Cambio 11) | `.claude/playbook-editorial/voice-and-style.md` §9 (sin cambios — ya cumplía) |
| Gráficos (Cambio 12) | `.claude/playbook-editorial/dynamic-element-library.md` §1 |
| CMS (Cambio 13) | `.claude/playbook-editorial/fields-and-taxonomy.md` |
| Cableado del gate en el flujo | `.claude/skills/publish-newsletter/SKILL.md`, `.claude/skills/publish-sourced-article/SKILL.md` (paso 2c) |
| Tests deterministas | `tests/moat-playbook/deterministic.test.mjs` |
| Tests de aceptación (10 casos, dry-run) | `tests/moat-playbook/caso-01.md` … `caso-10.md` |

Todas las reglas compartidas viven una sola vez en
`.claude/playbook-editorial/` y llegan a `publish-newsletter` y
`publish-sourced-article` por symlink — ver
`.claude/playbook-editorial/_GOVERNANCE.md` antes de editar cualquiera de
estos archivos.
