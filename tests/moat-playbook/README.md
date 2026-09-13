# Moat Playbook — tests de aceptación

Diez casos sintéticos (`caso-01.md` … `caso-10.md`), cada uno con el input,
el razonamiento editorial completo (gate → router → draft → Moat Check) y
una sección de verificación. **Dry-run real: en ningún caso se invocó
`scripts/publish-newsletter.ts` ni se escribió en Neon.** El razonamiento
del gate/router/Moat Check es el mismo que correría dentro de
`publish-newsletter` o `publish-sourced-article`, ejecutado aquí sobre
inputs sintéticos para poder revisar el input y el output completos, no
solo un pass/fail.

Lo que sí es lógica determinística (conteo de palabras por tier, la regla
de severidad del Moat Check) se valida aparte con asserts reales en
`deterministic.test.mjs` — correr con `node --test
tests/moat-playbook/deterministic.test.mjs`.

## Resultados

| Caso | Qué prueba | Resultado |
|---|---|---|
| 01 | Patrocinio sin cifras → gate debe frenar | RADAR (correcto) |
| 02 | Movimiento simple + antecedente → A, no inflar a B | APROBADO, A, 116 palabras |
| 03 | Cambio de control de un activo → B con segunda capa | APROBADO, B |
| 04 | Adquisición con precio mezclado → C | APROBADO, C |
| 05 | Historia internacional sin México real → publicar sin inventar conexión | APROBADO, B, sin conexión forzada |
| 06 | Evidence débil para tesis atractiva → gate debe frenar | RADAR (correcto); ejercicio de contraste confirma que el Moat Check también lo atraparía |
| 07 | A con delta, sin Opinión | APROBADO, A, 110 palabras, sin Opinión |
| 08 | B con Opinión que repite la noticia | 1ª versión: REQUIERE REEDICIÓN (3 gates fallan) → versión corregida: APROBADO |
| 09 | Pieza bien escrita pero sustituible | REQUIERE REEDICIÓN por la pregunta 10, no por un gate formal |
| 10 | 120 palabras bastan, hay research de sobra disponible | APROBADO, A, 113 palabras, research adicional archivado a propósito |

## Qué queda como lógica determinística vs. juicio editorial

**Determinístico (con test real, `deterministic.test.mjs`):**
- Rango de palabras por tier A/B/C (`format-tiers.md` §1) —
  `check-tier-length.mjs`.
- Regla de severidad del Moat Check: un gate fallido nunca permite
  AJUSTES MENORES ni APROBADO — `moat-rating.mjs`.

**Juicio editorial (validado por estos 10 casos + revisión humana, nunca
por un assert):**
- Si una historia tiene "suficiente importancia editorial" y "algo que
  Playbook pueda aportar" (`editorial-gate.md`).
- Si el formato elegido (A/B/C/D) es el correcto para la historia
  (`format-tiers.md` §1).
- Si la Opinión de Playbook realmente reencuadra la noticia o solo la
  repite (`voice-and-style.md` §6, Caso 8).
- Si la conexión con México/LATAM es genuina o forzada (`voice-and-style.md`
  §9, Caso 5).
- Las nueve preguntas no-gate del Moat Check, en particular la pregunta 10
  — sustituibilidad (Caso 9).
