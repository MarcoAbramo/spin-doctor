# Contributing to Spin Doctor

Thanks for helping! This game grows through community content — quests, events, president posts,
headlines, lexicon cards, art and sound — as much as through code.

## Workflow (GitHub Flow)

1. Fork / branch from `main`. Branch prefixes: `feat/…`, `fix/…`, `chore/…`, `docs/…`,
   `content/…` (new quests, events, texts).
2. Commit small and often using **Conventional Commits** (enforced by commitlint via Lefthook):
   `feat(client): add talkshow animation`, `content(quests): add opposition quest` is **not** valid —
   use `feat(content): add opposition quest`. Allowed types: `feat`, `fix`, `docs`, `chore`,
   `refactor`, `test`, `perf`, `ci`, `build`, `style`, `revert`.
3. Before pushing: `pnpm lint && pnpm typecheck && pnpm test && pnpm validate:content`.
4. Open a PR against `main`. CI must be green; PRs are **squash-merged**. `main` is always playable
   and deployable. release-please generates the changelog and releases from commit messages.

Setup: Node 24, `corepack enable`, `pnpm install`, `pnpm dev`. See the [README](README.md).

## Satire guardrails (binding)

1. **The game world is fictional:** country, president, parties, media and characters. No real
   names, photos, caricatures or invented quotes of real persons in scenes, dialogues or art; no
   real parties or brands. The only exception are **„Realitäts-Check“ cards** (see below).
2. **The target is techniques of power and the dismantling of institutions:** distraction,
   loyalty tests, media as the enemy, record claims, nepotism, decrees, packing the courts —
   techniques known from the news worldwide.
3. **Punch up, never down:** no jokes about groups of voters, minorities, origin, religion,
   appearance or disabilities.
4. **Current events may inspire.** In the game they are always fictionalised; the real event goes
   on a reality-check card.
5. **Lexicon cards** are factual, non-partisan and cite a source. Every new card gets the label
   `needs-fact-check`.

Reviewers will reject content that breaks these rules, however funny it is.

### Proposing a „Realitäts-Check“ card (ADR 0006)

A card explains the real event behind an in-game episode. Add it to
`packages/shared/content/reality/checks.json` and its texts `reality.<id>.title`, `.episode` and
`.body` to `packages/shared/locales/de.json`.

- **Neutral and attributed:** 3–5 sentences, facts only („laut NPR …“), no jokes, no judgement.
  Quote only what a cited source quotes. When in doubt, leave the detail out.
- **At least two reputable sources** (public broadcasters, wire services, major newspapers), each
  with `outlet`, `title`, `url` and publication `date`. Open every link before you submit.
- `unlock` is the condition of the episode (usually `quest` or `upgrade`).
- Label the PR `needs-fact-check`; set `factChecked: true` only after a second person checked it.
- Corrections to existing cards always take priority — open an issue if you find a mistake.

## Writing a new quest (no code needed)

All content lives in **content packs**: any JSON file under `packages/shared/content/**`. Packs are
merged at startup and validated by Zod (`packages/shared/src/schema.ts`). A pack can contain
`stats`, `generators`, `upgrades`, `lexicon`, `realityChecks`, `quests`, `dailies`, `pools`, `speakers` and its own
texts in `i18n`.

Example — a new side quest in `packages/shared/content/quests/opposition-basement.json`:

```json
{
  "speakers": [{ "id": "opposition-leader", "nameKey": "speaker.opposition-leader", "color": "#6aa84f" }],
  "quests": [
    {
      "id": "opposition-basement",
      "category": "side",
      "titleKey": "quest.opposition-basement.title",
      "trigger": { "type": "auto" },
      "conditions": { "type": "all", "of": [
        { "type": "quest", "quest": "act1-intro" },
        { "type": "stat", "stat": "democracy", "lte": 80 }
      ] },
      "steps": [
        {
          "type": "dialog",
          "speaker": "opposition-leader",
          "lines": ["quest.opposition-basement.s0.l1"],
          "choices": [
            { "textKey": "quest.opposition-basement.s0.c1", "replyKey": "quest.opposition-basement.s0.r1",
              "effects": [{ "type": "addStat", "stat": "approval", "value": 2 }, { "type": "addStat", "stat": "democracy", "value": -3 }] },
            { "textKey": "quest.opposition-basement.s0.c2", "replyKey": "quest.opposition-basement.s0.r2",
              "effects": [{ "type": "addStat", "stat": "democracy", "value": 2 }] }
          ]
        },
        { "type": "objective", "textKey": "quest.opposition-basement.s1.goal",
          "condition": { "type": "generator", "generator": "bot-farm", "gte": 5 } }
      ],
      "rewards": [{ "type": "productionSeconds", "seconds": 120 }]
    }
  ],
  "i18n": {
    "de": {
      "speaker.opposition-leader": "Oppositionsführerin",
      "quest.opposition-basement.title": "Kellerkinder",
      "quest.opposition-basement.s0.l1": "Wir tagen jetzt im Keller. Ohne WLAN. Zufall?",
      "quest.opposition-basement.s0.c1": "Der Keller ist historisch wertvoll.",
      "quest.opposition-basement.s0.r1": "Ah. Historisch. Wie unsere Grundrechte.",
      "quest.opposition-basement.s0.c2": "Ich frage nach einem Router.",
      "quest.opposition-basement.s0.r2": "Überraschend. Danke.",
      "quest.opposition-basement.s1.goal": "Besitze 5 Bot-Farmen"
    }
  }
}
```

### Building blocks

- **Triggers:** `auto` (starts when `conditions` are met), `manual` (player starts it; optional
  `cooldownSec`), `random` (`minSec`–`maxSec`).
- **Steps:** `dialog` (lines + optional choices with effects and replies), `objective` (waits for a
  condition), `minigame` / `timed` (need a **handler** — currently `headline-swipe` and
  `president-post`; new handlers need code, see `apps/client/src/ui/modals/QuestModal.tsx`).
- **Conditions:** `stat` (gte/lte), `lifetime`, `generator`, `upgrade`, `flag`, `quest` (completed),
  `counter`, `all`, `any`, `not`.
- **Effects:** `addStat`, `multiplier`, `productionSeconds`, `setFlag`, `unlockLexicon`,
  `counter`, `modifier` (timed buff/debuff), `scandal`. A passive `multiplier` works only where it
  is owned permanently — upgrades, generator `perUnitEffects` (per unit, e.g. per wall section)
  and quest `rewards`; everywhere else use a `modifier` (`validate:content` checks this).
- **Locations** (levels on the map) live in `locations[]`: scene layout (background, props,
  player, tap target, generator slots, backdrop colours), `onSiteBonus`, till capacity
  (`till.capMinutes`), an optional `entryFee`, time-based `traits` (`hour`/`weekday` conditions),
  random `hotspots` and `enter`/`exit` transition presets (`door`, `gate`, `stamp` with a
  `labelKey`). Generators and upgrades name their `location`; generators
  may `produce` and cost other stats (`produces`, `costStat`), have a `maxCount` (building
  projects) and `perUnitEffects`.
- **Framing duels** (`"type": "framing"` step): press questions with 2–4 answers scored 0…1, a
  time limit per question and `qualityEffects` tiers — e.g. a great spin puts the location into
  a boom via a `modifier` on `location:<id>`. **Endings** use the `ending` step.
- **Story acts** are just quests with `"category": "story", "act": 2` chained by `quest` conditions —
  a new act is a new file in `content/story/`.
- **New stats/"points"** (e.g. *Gewissen*): add to `stats` in a pack; existing saves pick them up
  automatically. A stat can multiply production, drift over time or change per tap.
- **Pools** (president posts, headlines) are lists of text keys; add entries to extend them.

Texts: German first. Put them into the pack's `i18n.de` or into `packages/shared/locales/de.json`.
Run `pnpm validate:content` — it reports schema errors, unknown references and missing texts.

**Keep it short — it is an idle game, not a novel.** Word budgets: dialog line ≤ 14 words,
≤ 3 lines per step, framing question ≤ 12, answer/choice ≤ 6 (a punchline, not a sentence),
reply ≤ 10, question + answers ≤ 30, whole quest ≤ 120. One joke per line; background belongs on a
lexicon or Realitäts-Check card. `pnpm text:stats` shows words and reading time per quest
(`--budgets` lists every text over its budget); `validate:content` warns about them.
New characters, generators etc. need art: run `pnpm assets` and see [docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md).

## Code conventions

- TypeScript strict everywhere; code, comments, commits and docs in **English**.
- `packages/shared` is pure: no DOM, no Pixi, no `Date.now()` / `Math.random()` in the simulation.
  Time and date come in via `TickContext`; randomness via the seeded RNG in the state.
- Engine code never hard-codes content ids (see [ADR 0002](docs/adr/0002-data-driven-content.md)).
- Save format changes: bump `SAVE_VERSION` and add a migration in `packages/shared/src/save.ts`.
- Mobile first: touch targets ≥ 44 px, nothing hover-only, respect `prefers-reduced-motion`.
