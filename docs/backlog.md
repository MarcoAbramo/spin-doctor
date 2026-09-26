# Backlog

> Source of truth: `scripts/backlog.json` — mirrored to GitHub issues by `scripts/bootstrap-github.sh`.

## v0.2 – Backend

### Cloud save with anonymous account

Labels: `backend`, `enhancement`

Anonymous device token (stored client-side, hashed server-side in `players.device_token_hash`), optional linking to a real account later. Save upload/download via the API using the existing save schema.

**Acceptance criteria**

- [ ] POST/GET /saves with device token auth
- [ ] Conflict handling (newest `now` wins, with confirmation in the UI)
- [ ] Works offline-first; sync when online
- [ ] Tests with a Postgres service in CI

### Server-side validation of saves and offline progress (anti-cheat)

Labels: `backend`

Reuse the pure simulation from `packages/shared` on the server to check that uploaded saves are plausible (max production × elapsed time, offline cap 8 h, cost curves).

**Acceptance criteria**

- [ ] Server rejects saves with impossible currency gains
- [ ] Shared tests cover the validation function
- [ ] Document tolerance rules in an ADR

### Leaderboards

Labels: `backend`, `enhancement`

E.g. highest approval rating, most scandals survived, lifetime spin. Requires cloud save.

**Acceptance criteria**

- [ ] API endpoints with pagination
- [ ] Leaderboard tab in the client
- [ ] No personal data beyond chosen display name

### Server-side daily and weekly quests with a shared seed

Labels: `backend`, `enhancement`

Dailies are currently assigned client-side from the seeded RNG. Move assignment to the server with one seed per day for all players.

**Acceptance criteria**

- [ ] GET /quests/daily returns the same set for everyone
- [ ] Client falls back to local dailies offline
- [ ] Streak validated server-side

### Deployment pipeline to the VPS (GHCR + SSH) incl. Postgres backups

Labels: `backend`, `infra`

GitHub Actions: build images, push to GHCR, deploy via SSH with `docker compose -f docker-compose.prod.yml pull && up -d`. Nightly `pg_dump` with retention.

**Acceptance criteria**

- [ ] Tag push deploys automatically
- [ ] Secrets only in GitHub environments
- [ ] Backup + restore documented and tested

### Privacy-friendly self-hosted analytics without cookies

Labels: `backend`

E.g. Plausible/Umami self-hosted or a minimal event endpoint. No cookies, no personal data.

**Acceptance criteria**

- [ ] Opt-out in settings
- [ ] Documented in README / privacy note

### CI: Postgres integration tests for the API

Labels: `backend`, `ci`

Currently the API is tested without a database (ADR 0003). Add a Postgres service container once real DB features land.

**Acceptance criteria**

- [ ] Migration runs in CI
- [ ] At least one DB-backed API test

### release-please PRs need a token that triggers CI

Labels: `ci`

PRs opened with `GITHUB_TOKEN` do not trigger workflows, so release PRs never get the required status checks of the `main` ruleset. Use a GitHub App token (e.g. actions/create-github-app-token) or a fine-grained PAT for release-please.

**Acceptance criteria**

- [ ] Release PR shows green required checks
- [ ] Merging it creates tag + GitHub release

## v0.3 – Story & Inhalte

### Act 2 „Der große Skandal“

Labels: `story`, `content`

Next story act as a content pack in `content/story/act2.json`, chained to `act1-first-100-days`.

**Acceptance criteria**

- [ ] At least 5 steps incl. dialog choices
- [ ] New texts in de.json
- [ ] No engine changes required

### Act 3 „Die Wahl“ with multiple endings

Labels: `story`, `content`

Endings depend on stats, e.g. whistleblower ending, „Ewiger Pressesprecher“, „Demokratie gerettet (trotz dir)“. May need a generic 'ending' step type.

**Acceptance criteria**

- [ ] ≥ 3 endings driven by conditions
- [ ] Ending screen
- [ ] Endings are data-driven

### New stat „Gewissen“ (conscience) of the press secretary

Labels: `story`, `content`

A new stat in a content pack that dialog choices influence; unlocks choices/endings (e.g. whistleblower).

**Acceptance criteria**

- [ ] Stat added via content pack only
- [ ] Choices can require a minimum conscience (condition on choices)
- [ ] Shown in HUD

### Prestige „Neue Amtszeit“ with personality-cult bonus

Labels: `story`, `enhancement`

The president changes the constitution for another term: resets progress, grants a permanent bonus.

**Acceptance criteria**

- [ ] Prestige currency and bonus defined as data
- [ ] Save migration
- [ ] Balancing tests

### More NPCs and story quests (opposition leader, court reporter, nephew Konstantin)

Labels: `story`, `content`, `good first issue`

Use the quest guide in CONTRIBUTING.md. Opposition meets in a basement without Wi-Fi.

**Acceptance criteria**

- [ ] Each NPC has a speaker entry + portrait entry in the asset checklist
- [ ] At least one quest per NPC

### More minigames (press conference dodge quiz, talk show rhythm game, escape the fact check)

Labels: `minigame`, `enhancement`

Each minigame is a new handler registered in `QuestModal.tsx` and `KNOWN_HANDLERS`.

**Acceptance criteria**

- [ ] One new handler per PR
- [ ] Reward scales with score
- [ ] Accessible alternative controls

### Weekly quests and achievements

Labels: `content`, `enhancement`

Extend the daily system with weekly tasks and permanent achievements (data-driven).

**Acceptance criteria**

- [ ] Weekly reset on Monday local time
- [ ] Achievements tab

### More lexicon cards (rule of law, term limits, nepotism, propaganda)

Labels: `content`, `needs-fact-check`

Factual, neutral, with a source. Each unlocked by a matching upgrade.

**Acceptance criteria**

- [ ] Source verified
- [ ] Label needs-fact-check until reviewed

### Content pipeline: community events and quests as JSON PRs

Labels: `content`, `help wanted`

Document and streamline: PR template for content, CI validation (exists), preview build per PR.

**Acceptance criteria**

- [ ] Content PR checklist
- [ ] Preview deployment per PR

### Fact-check lexicon card „Pressefreiheit“

Labels: `content`, `needs-fact-check`

Verify text and source of `lexicon.press-freedom`. Candidate source (verified reachable): https://www.bpb.de/kurz-knapp/lexika/lexikon-in-einfacher-sprache/250000/pressefreiheit/ — the card currently links to the bpb.de start page. Check the wording about the 1966 Spiegel ruling.

**Acceptance criteria**

- [ ] Text reviewed
- [ ] Deep link to source set in content/core/lexicon.json
- [ ] `factChecked: true`

### Fact-check lexicon card „Gewaltenteilung“

Labels: `content`, `needs-fact-check`

Verify text and source of `lexicon.separation-of-powers`. Candidate source: https://www.bpb.de/kurz-knapp/lexika/politiklexikon/17567/gewaltenteilung-gewaltenverschraenkung/

**Acceptance criteria**

- [ ] Text reviewed
- [ ] Deep link to source set
- [ ] `factChecked: true`

### Fact-check lexicon card „Wahlkreiszuschnitt (Gerrymandering)“

Labels: `content`, `needs-fact-check`

Verify text and source of `lexicon.gerrymandering`. Candidate source: https://www.bpb.de/themen/nordamerika/usa/505567/nahezu-jede-neue-wahlkreiskarte-wird-vor-gericht-angefochten/ — check the statement about the German Wahlkreiskommission.

**Acceptance criteria**

- [ ] Text reviewed
- [ ] Deep link to source set
- [ ] `factChecked: true`

## v0.4 – Polish & Plattform

### English translation and i18n for more languages

Labels: `enhancement`, `good first issue`

Add `locales/en.json`, language switch in settings, locale-aware number formatting.

**Acceptance criteria**

- [ ] All keys translated
- [ ] Validation checks every locale
- [ ] Language persisted in save

### Accessibility: screen reader support, colour-blind mode, reduced motion

Labels: `a11y`

Audit the overlay with VoiceOver/TalkBack; announce spin changes sensibly; colour-blind safe democracy bar.

**Acceptance criteria**

- [ ] axe audit clean
- [ ] Minigame playable without swiping (buttons exist — verify with screen reader)

### Replace placeholder art with own illustrations (CC BY 4.0)

Labels: `polish`, `help wanted`

See docs/ASSET_GUIDE.md and docs/ASSET_CHECKLIST.md (`pnpm assets`). Optionally integrate Kenney CC0 packs.

**Acceptance criteria**

- [ ] All required assets present (`pnpm assets --check` passes)
- [ ] ASSETS.md updated

### Sound design (replace synth placeholders, add MP3 fallback for older Safari)

Labels: `polish`

Real CC0/CC BY sounds per ASSET_GUIDE; `.ogg` plus `.mp3` fallback.

**Acceptance criteria**

- [ ] All sounds in assets/audio
- [ ] Volume balanced
- [ ] Mute respected

### Big-number library for late game

Labels: `enhancement`

`formatNumber` handles up to letter suffixes but JS numbers overflow at 1e308. Evaluate break_infinity.js or similar.

**Acceptance criteria**

- [ ] Simulation uses the library behind a small interface
- [ ] Save migration

### E2E tests with Playwright (mobile emulation) and Lighthouse CI with performance budget

Labels: `ci`, `polish`

Automate the onboarding smoke test (tap, buy, dialog, post, minigame) in Playwright; Lighthouse CI with PWA + perf budgets.

**Acceptance criteria**

- [ ] Runs in CI on PRs
- [ ] Budget: initial JS < 300 kB gzip, LCP < 2.5 s on Moto G4 profile

### Settings: better save export/import (file download, QR code)

Labels: `polish`, `enhancement`

Export as file / QR, import via file picker.

**Acceptance criteria**

- [ ] Works on iOS and Android

### Shrink server Docker image

Labels: `infra`, `polish`

The runtime image is ~300 MB. Bundle all dependencies with esbuild or use a distroless base.

**Acceptance criteria**

- [ ] Image < 150 MB
- [ ] Health check still works

