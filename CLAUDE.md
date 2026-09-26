# CLAUDE.md

Guidance for Claude Code sessions in this repo.

## What this is
"Spin Doctor – Pressesprecher der Republik Superbia": satirical mobile-first idle game (browser PWA).
pnpm monorepo: `apps/client` (Vite + Preact overlay + PixiJS scene), `apps/server` (Fastify +
Drizzle + Postgres), `packages/shared` (pure simulation, Zod schemas, quest engine, content).
The original spec is `HACKATHON_PROMPT.md`.

## Commands
- `pnpm dev` — client (:5173, `--host`) + server (:3000, works without DB)
- `pnpm lint` / `pnpm format` (Biome) · `pnpm typecheck` · `pnpm test` (Vitest)
- `pnpm validate:content` — content packs + German texts (CI)
- `pnpm build` · `pnpm size` (initial JS budget 300 kB gzip) · `pnpm assets` (asset checklist)
- `docker compose up` (dev) · `docker compose -f docker-compose.prod.yml up -d --build` (prod)

## Architecture rules
- **Everything is data** (ADR 0002): stats, generators, upgrades, story acts, quests, events, pools,
  dailies, lexicon, texts live in JSON content packs under `packages/shared/content/**`. New story
  or new stats must not require engine changes. Never hard-code content ids in engine/UI logic
  (exception: `speaker "you"` display name).
- Simulation (`packages/shared/src`) is pure & deterministic: `tick(state, content, dt, ctx)` and
  actions return new state (`draft()` = structuredClone). No DOM/Pixi/`Date.now()`/`Math.random()`.
  Events for UI juice are in `state.events` of the returned state.
- Client: `store.ts` owns the loop (rAF), autosave (10 s + visibilitychange), offline progress.
  Pixi scene is lazy-loaded (`import()`); Preact renders HUD/tabs/modals. Minigame/timed quest
  steps are rendered by handler id (`ui/modals/QuestModal.tsx`; keep `KNOWN_HANDLERS` in sync).
- Assets by convention (ADR 0004): `apps/client/public/assets/{sprites,portraits,icons,illustrations,audio}`,
  names from content ids, placeholders when missing. See `docs/ASSET_GUIDE.md`.
- Saves: versioned (`SAVE_VERSION`) with migrations in `save.ts`; `reconcile()` adds new stats/generators.

## Conventions
- Code, comments, commits, docs: English. Game texts: German in `packages/shared/locales/de.json`
  (or a pack's `i18n.de`).
- Conventional Commits (commitlint + Lefthook), GitHub Flow, squash merges, `main` always playable.
- Mobile: touch targets ≥ 44 px, no hover-only UI, `prefers-reduced-motion`, DPR ≤ 2.

## Satire guardrails (binding)
1. Everything fictional — no real persons, parties, brands, quotes, likenesses.
2. Target techniques of power and the dismantling of institutions.
3. Punch up, never down — no jokes about voter groups, minorities, origin, religion, appearance, disability.
4. Current events may inspire but are always fictionalised and generalised.
5. Lexicon cards: factual, neutral, with a source; new cards get the `needs-fact-check` label.
