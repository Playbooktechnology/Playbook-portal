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

**That deterministic check is a real, blocking gate, not a mirror** (fixed
2026-09-13, after the tool existed for a run and nothing ever called it — a
draft could contradict its own tier and publish untouched). It runs for
real inside `scripts/publish-newsletter.ts`, right after the overlap gate,
using the `tier` field set on the article. Two severities, not one flat
pass/fail:

- **Severe** findings block the publish outright: a tier missing its
  required Opinión de Playbook (or an A carrying one it shouldn't), a Deep
  Dive's Opinión with a trailing paragraph after it, or a word count more
  than 30% outside the tier's range. Override only with
  `--allow-tier-mismatch`, and only after a human has looked and confirmed
  it's a deliberate, documented exception.
- **Marginal** findings (a word count just outside the range — e.g. 240
  words against a 250-word floor) print as a warning and never block, the
  same non-blocking default `check-voice.mjs` uses for its own flags.

The distinction matters because the two failure modes are not the same
kind of problem: a small gap against a range is plausibly the "never take
away length, only add" rule (`voice-and-style.md` §2) at work; a severe gap
(156 words against a 250-word floor, say) means the tier the router chose
never had real substance behind it in the first place — which is a router
or gate problem (`editorial-gate.md`, `format-tiers.md` §1), not a prose
polish problem, and prose polish can't fix it.
