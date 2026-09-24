---
name: publish-newsletter
description: Turn one or more Playbook Substack newsletter links into articles and publish them live to the Playbook site, with zero human review. Use when asked to process, draft, or publish a Substack link (Industry Shots, La Lana del Deporte, Infinitas) into Playbook.
---

# Publish Newsletter: Substack link to live article, no human in the loop

Playbook's automated editorial pipeline for its **own** Substack editions.
Given one or more Substack URLs, it fetches them, drafts each individual news
item as a full Playbook article, and inserts it into the production database as
`status: 'published'`. **It goes live immediately** — no draft step, no review,
nobody copy-pastes anything.

## When this runs

- A Playbook Substack link (Noticias — still published as Industry Shots —
  La Lana del Deporte, Infinitas, TFBR).
- A third-party link is the **other** skill: `publish-sourced-article`, which
  cross-references other outlets and pauses for human approval.
- An inbound partner or sponsor press kit is a third skill:
  `publish-partner-announcement`.
- "Draft this" without publishing intent means run steps 1–5 and show the
  drafts, then stop before publishing.

## Decision flow

| | Step | Read |
|---|---|---|
| **0** | **Overlap check — before drafting a word.** Every item, not every edition, and **across products, not just within one**: two editions can carry the same story. Four outcomes; three of them mean no second article. | `references/overlap-check.md` |
| **0.5** | **The editorial gate.** Does this item earn a Playbook article at all, and what can we add? Decide `PUBLICAR / NO PUBLICAR TODAVÍA / RADAR` before ingesting further. This funnel has no downstream human review, so a non-`PUBLICAR` call here is the only way an item gets declined — say so in the run report instead of drafting it. | `references/editorial-gate.md` |
| **1** | **Ingest.** Fetch each edition, split it into items, pull the date, the item order and every embedded image URL. | `references/ingestion.md` |
| **2** | **Research.** Mandatory outside fact per Noticias/Infinitas item, plus the regional angle. Not for La Lana. | `references/ingestion.md` |
| **3** | **Route the format — A / B / C / D — before drafting a word**, then apply the product's architecture. Depth decides the format; graphics are a consequence. | `references/format-tiers.md` §1 |
| **4** | **Apply the voice.** Movimiento + mecanismo + incentivo + consecuencia; find the palanca; one thing per paragraph; one clause in the headline. | `references/voice-and-style.md` |
| **5** | **Apply the element library.** Walk every device, respect the budget, check each declaration rendered. | `references/dynamic-element-library.md` |
| **6** | **Fill the fields and source the images.** Set the **0–99 `boleta`** on every article — omitting it silently ranks the piece on the retired star scale. `tagsProperty` decides whether the piece lands on a hub; read its boundary rule before setting it. | `references/fields-and-taxonomy.md` → "Ranking", `references/images.md` |
| **7** | **Self-check** against the twelve-point publication checklist, the Moat Check, `check-voice.mjs`, and `check-format-tier.ts`. A Moat Check that fails any of its three gates blocks Step 8 the same way a `NO PUBLICAR TODAVÍA` at Step 0.5 does — this funnel has no human review to catch it later. **Set the `tier` field on every article** (Step 3's call) — `check-format-tier.ts` runs for real inside `scripts/publish-newsletter.ts` at Step 8 and refuses to publish a severe mismatch (a tier missing its Opinión, or word count badly off its range); an article with no `tier` set never gets that protection. | `references/voice-and-style.md` §12, `references/moat-check.md` |
| **7b** | **Device check.** `check-draft-devices.ts` runs for real inside `scripts/publish-newsletter.ts` at Step 8, after the tier gate, and refuses to publish any declaration that would render as visible broken plain text (malformed, over budget, or a repeated type). Fix flagged declarations before publishing rather than relying on the override. | `references/dynamic-element-library.md` |
| **8** | **Publish, report, capture feedback.** | `references/publishing-mechanics.md` |

Steps 3–5 are one pass, not three: the tier decides the length, the voice
decides the prose, the library decides the visual beats, and they are written
together.

**Do not ask for approval before step 8.** Publishing without a review gate is
the point of this flow. Do flag anything genuinely uncertain (a fact that
couldn't be confirmed, no findable cover photo) rather than guessing silently.

## Shared vs. own

`references/voice-and-style.md`, `format-tiers.md`,
`dynamic-element-library.md`, `overlap-check.md`, `fields-and-taxonomy.md`,
`images.md`, `postura-editorial.md`, `editorial-gate.md` and `moat-check.md`
are **symlinks into `.claude/playbook-editorial/`, shared with
`publish-sourced-article` and `publish-partner-announcement`**. One copy,
every funnel — output from the
skills should be indistinguishable once published. Edit them there and every
skill changes; never fork a copy into this folder.

`references/ingestion.md` and `references/publishing-mechanics.md` are this
skill's own. `references/_GOVERNANCE.md` covers how to edit the shared tree;
read it only when changing a rule, not when drafting.

**This file is a router, not a rulebook.** Everything it points at is the rule;
nothing here restates one. A lesson from a run goes into the file that owns the
topic (`references/publishing-mechanics.md`, "Capture feedback"), never into
this file — that default is what turned this router into a 434-line monolith
between 2026-08-18 and 2026-08-25, with the shared tree resolving on disk and
named by nothing.
