# ADR 0003 — The API runs and is tested without Postgres

- Status: accepted
- Date: 2026-09-26

## Context
CI must stay fast and simple; the MVP server only has a health check and a first migration.

## Decision
- `buildApp()` takes an optional database handle. Without `DATABASE_URL` the API starts, and
  `/health` reports `db: "not-configured"`; with a failing DB it reports `status: "degraded"`.
- Server tests use `fastify.inject()` with a fake `ping()` — no Postgres service in CI.
- Migrations are generated with drizzle-kit into `apps/server/drizzle/` and applied by
  `dist/migrate.js` at container start (prod) or `drizzle-kit migrate` (dev compose).

## Consequences
- `pnpm dev` works without Docker. Once real DB features land (cloud save), add a Postgres
  service container to CI for integration tests.
