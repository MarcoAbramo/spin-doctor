# ADR 0004 — Assets by naming convention with runtime fallback

- Status: accepted
- Date: 2026-09-26

## Context
No art exists yet, artists should be able to add files without touching code, and new content
(characters, generators) must not break when its art is still missing.

## Decision
- File paths are derived from content ids (`portraits/<speaker>.png`, `sprites/<sprite>.png`,
  `icons/upgrade-<id>.png`, …), defined once in `packages/shared/src/assets.ts`.
- The client checks existence with a `HEAD` request and otherwise draws Pixi/emoji/synth
  placeholders.
- `pnpm assets` generates `docs/ASSET_CHECKLIST.md` from the content.
- Hashed build output lives in `/static`, so `/assets` stays free for game art with its own caching.

## Consequences
- One extra HEAD request per asset on first load (cached by the service worker afterwards).
