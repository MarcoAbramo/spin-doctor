# ADR 0004 — Assets by naming convention with runtime fallback

- Status: accepted
- Date: 2026-09-26

## Context
No art exists yet, artists should be able to add files without touching code, and new content
(characters, generators) must not break when its art is still missing.

## Decision
- File paths are derived from content ids (`portraits/<speaker>.png`, `sprites/<sprite>.png`,
  `icons/upgrade-<id>.png`, …), defined once in `packages/shared/src/assets.ts`.
- The client knows which files exist from a build-time manifest of `public/assets`
  (`virtual:asset-manifest`, see `apps/client/asset-manifest.ts`) and otherwise draws
  Pixi/emoji/synth placeholders. In dev the manifest follows added/removed files.
- `pnpm assets` generates `docs/ASSET_CHECKLIST.md` from the content.
- Hashed build output lives in `/static`, so `/assets` stays free for game art with its own caching.

## Consequences
- No probing requests: missing art costs nothing, existing art is downloaded once per name.
- A file added to a deployed server without rebuilding the client is not picked up.

## History
- 2026-09-28: replaced per-asset `HEAD` requests with the build-time manifest. Scenes were
  built one request after another (a `HEAD` plus a JSON fetch for every sprite copy, over 100
  for the press hall), so one stalled request on a flaky connection left the room half-built.
