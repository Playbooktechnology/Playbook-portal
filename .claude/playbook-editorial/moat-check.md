# The Moat Check — did this piece earn its space

(Moat Playbook guide, 2026-09-13.) Runs inside Step 7, alongside the
twelve-point publication checklist (`voice-and-style.md` §12) — it
**complements** that checklist, it does not replace it. The checklist asks
whether the piece is well made. The Moat Check asks whether it deserved to be
made at all, now that a full draft exists to judge against the answer given
at the gate (`editorial-gate.md`).

## The ten questions

1. ¿Por qué esta historia merece espacio en Playbook?
2. ¿Quién es el reader persona primario? (carried from `editorial-gate.md`)
3. ¿Qué necesidad concreta resolvemos?
4. ¿Cuál es el delta Playbook? — **gate**
5. ¿La pieza va al menos un nivel después del headline? — **gate**
6. ¿Ese nivel adicional está respaldado por evidencia? — **gate**
7. ¿Elegimos correctamente A/B/C? (`format-tiers.md` §1)
8. ¿La longitud corresponde al valor disponible?
9. ¿Existe algo que el lector pueda recordar, utilizar, compartir o llevar a
   una conversación?
10. ¿La pieza seguiría teniendo prácticamente el mismo valor si quitamos el
    nombre Playbook y la generara cualquier medio a partir del comunicado?

## Questions 4, 5 and 6 are gates

If there is no delta, the piece never goes past the headline, or the
interpretation isn't backed by evidence, the piece **cannot be graded
APROBADO** — no exceptions for otherwise-clean prose.

**Severity floor (2026-09-13):** failing any one of gates 4, 5 or 6 caps the
grade at `REQUIERE REEDICIÓN`, never `AJUSTES MENORES`, however polished the
rest of the piece reads. A gate failure is a structural problem, not a
wording one, and the grade has to say so.

## Grades

`APROBADO` / `AJUSTES MENORES` / `REQUIERE REEDICIÓN` / `NO PUBLICAR TODAVÍA`

## After grading

State a maximum of five concrete changes. Only after that, the corrected
version. **Never rewrite automatically before the diagnosis** — the
diagnosis is this step's actual output, not a formality on the way to a
rewrite.

## This is judgment, not an assert

Same treatment as `editorial-gate.md`: this step produces no code-level
pass/fail. It is validated through the ten narrative acceptance cases
(`tests/moat-playbook/`) and manual review, never a script assertion. The one
place it touches a deterministic check is `scripts/check-format-tier.ts`
(word count and Opinión presence/absence against the declared tier), which
confirms the mechanical half of questions 7 and 8 — it cannot judge 1-6,
9 or 10.
