# ADR 0006 — „Realitäts-Check“: real news behind fictional episodes

- Status: accepted
- Date: 2026-09-27
- Issue: #55

## Context
Players asked for proof that the satire is exaggerated but not invented. Issue #55 offered three
options: technique cards without names, an external "inspired by" archive, or in-game references
to real events. The project owner chose **real news in the game**.

## Decision
- The **game world stays fictional**: Superbia, Magnus Rekord and all characters, dialogues, posts
  and art. No real person appears in a scene, a dialogue or as a caricature.
- A separate content type `realityChecks[]` holds **„Realitäts-Check“ cards**. Each card names the
  real, widely reported event behind an episode and unlocks when the player reaches that episode
  (`unlock` condition). Cards live in the lexicon tab (switch „📰 Realitäts-Check“), and a toast
  links to a new card when it unlocks.
- Cards may name public officials **in their official role**. The text must be:
  - a neutral, factual summary with no jokes, no adjectives of judgement and no own conclusions;
  - attributed ("laut NPR …"), with quotes only when they appear in a cited source;
  - backed by **at least two** reputable news sources (schema-enforced), each with outlet, title,
    URL and publication date, and every link checked before merging;
  - labelled `needs-fact-check` on GitHub; `factChecked: true` only after a second person checked it.
- Satire guardrails 1 and 4 now read: fiction in the game, facts only on reality-check cards.

## Consequences
- Stronger learning effect; the satire/fact boundary is explicit (disclaimer on every card).
- Higher maintenance and legal care: every card is a factual claim about real people. When in
  doubt, leave the detail out. Corrections via issue have priority over new content.
- New episodes inspired by real events should ship with a card, per milestone.
