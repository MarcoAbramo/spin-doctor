# ADR 0001 — pnpm monorepo, Vite + PixiJS + Preact, Fastify + Drizzle

- Status: accepted
- Date: 2026-09-26

## Context
Mobile-first browser idle game that should grow into a community open-source project with a
backend (cloud save, anti-cheat, leaderboards) later.

## Decision
- pnpm workspaces: `apps/client`, `apps/server`, `packages/shared`.
- `packages/shared` is consumed **as TypeScript source** (no build step). Vite and Vitest
  compile it; the server is bundled with esbuild, which inlines it.
- Client: Vite, PixiJS v8 for the scene (lazy-loaded via dynamic `import()` to keep the
  initial bundle small), Preact for the HTML overlay, `@tweenjs/tween.js` (MIT) for tweens.
- Server: Fastify 5, Drizzle ORM, PostgreSQL, Zod.
- Tooling: TypeScript (strict), Biome, Vitest, Lefthook + commitlint, release-please.

## Consequences
- One lockfile, one CI; shared simulation is reusable on the server for cheat checks.
- No separate publish step for `shared`; if it is ever published to npm it needs a build.
