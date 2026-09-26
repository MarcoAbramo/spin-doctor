# ADR 0002 — Everything is data: content packs

- Status: accepted
- Date: 2026-09-26

## Context
The game must stay an idle game at its core, but storyline, stats ("points"), generators,
upgrades, quests and events have to be addable at any time — by the community, via PRs —
**without touching engine code**.

## Decision
- Every JSON file under `packages/shared/content/**` is a **content pack**. A pack may contain
  `stats`, `generators`, `upgrades`, `lexicon`, `quests`, `dailies`, `pools` and `i18n`.
  Packs are merged and validated with Zod at load time.
- The engine only knows generic building blocks:
  - **Effects** (`addStat`, `multiplier`, `productionSeconds`, `setFlag`, `unlockLexicon`,
    `modifier`, `counter`, `scandal`)
  - **Conditions** (`stat`, `generator`, `upgrade`, `flag`, `quest`, `counter`, `all`, `any`, `not`)
  - **Quest steps** (`dialog`, `objective`, `minigame`, `timed`)
- Story acts are quest chains (`category: "story"`, `act: n`) linked by conditions.
- Interactive steps that need custom UI (`minigame`, `timed`) reference a **handler id**
  (e.g. `headline-swipe`, `president-post`). Handlers are the only place that needs code;
  new quests reuse existing handlers.
- `pnpm validate:content` checks schemas, unique ids, cross-references and missing
  translation keys; it runs in CI.

## Consequences
- New act / stat / generator = one new JSON file (+ texts).
- Engine code must never hard-code content ids, except for the core currency id `spin`,
  which is configurable via `stats[].role: "currency"`.
