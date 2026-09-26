# Security Policy

## Supported versions

Only the latest release on `main` receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's
[private vulnerability reporting](../../security/advisories/new) for this repository.
We aim to acknowledge reports within 7 days.

Relevant areas: the API server (`apps/server`), save import/export parsing
(`packages/shared/src/save.ts`), and deployment configuration (`docker-compose.prod.yml`, `Caddyfile`).
