# Backlog

> Source of truth: `scripts/backlog.json` — mirrored to GitHub issues by `scripts/bootstrap-github.sh`. Roadmap: [roadmap.md](roadmap.md).

## v0.2 – Engine & Karte

### M1: Engine for locations, till economy and multi-currency

Labels: `enhancement`, `backend`

Generic, data-driven engine support for the world: `locations[]` content section; per-location production; location tills (cap, on-site bonus ×1.5, collect on entry); `location:<id>` multipliers; spin quality via `qualityEffects`; time-based traits (hour/weekday via TickContext); hotspots; offline distribution to tills; `location`/`costStat`/`produces`/`maxCount`/`perUnitEffects` on generators & upgrades; new conditions; `framing` and `ending` steps; stat coupling; save v2 with migration. The press house becomes the first location (scene slots move to content). No visible change. See docs/roadmap.md.

**Acceptance criteria**

- [ ] All existing tests green, new tests for tills, collection, traits, framing, migration v1→v2
- [ ] A v0.1 save loads
- [ ] validate:content checks all new references

### M2: Walkable city map with live location signs and entry animations

Labels: `enhancement`, `polish`

Tiled-based map of the capital (48×48 tiles, 16 px), tap-to-walk with A* and path preview, entrances, locked sites with signs, live signs above buildings (till, fill bar, rate, status icons) with info card, transition engine (walk to door, door anim, pixel zoom, dither/iris wipe, title banner, coin-stream collection), map ambience and time-of-day tint. Completing act 1 unlocks the map with a cutscene. See docs/roadmap.md.

**Acceptance criteria**

- [ ] Playable on a phone at 60 fps
- [ ] Transitions skippable and reduced-motion safe
- [ ] Placeholder tileset, walk cycle, signs and door generated
- [ ] Smoke test: map → press house → back

## v0.3 – Rosengarten & P.R.I.C.E.

### M3: Level 2 – Rosengarten der Strafzölle

Labels: `story`, `content`, `minigame`

Rose garden press podium with five microphones and the world map easel. Generators, upgrades, price-level meter (tariffs raise production but depress approval), `zoll-tafel` minigame, framing duels (secret language „furbeln“, real-estate diplomacy → cookie tariffs), gate + wind entry animation, hotspots and traits. Lexicon: trade tariffs, independent science. See docs/roadmap.md. Mega project „Spiegelteich-Sanierung“ (reflecting pool before the Great Dome: drained, gilded, reflects only Magnus' statue; nephew's firm; ducks pay P.R.I.C.E. entry fees). Lexicon: public procurement.

**Acceptance criteria**

- [ ] Level unlock after act 1
- [ ] Framing quality changes the location's yield
- [ ] Lexicon cards with verified sources (needs-fact-check)

### M4: Level 3 – P.R.I.C.E. and the Great Record Wall

Labels: `story`, `content`

P.R.I.C.E. (Patriotic Revenue & Import Curbing Enforcement) satirises tariff mania and red tape – never people crossing borders. Shark-moat event at the finance ministry. Mega project „Große Rekord-Mauer“: up to 20 sections visible on the map, milestone events (no-bid contract for the nephew's firm, neighbour returns the invoice, emergency declaration, cardboard sections, souvenir shop, rain at the inauguration). Lexicon: judicial review, parliament's power of the purse, emergency powers. See docs/roadmap.md.

**Acceptance criteria**

- [ ] Satire guardrails reviewed
- [ ] Wall sections render on the map
- [ ] Stamp entry animation

## v0.4 – Golf-Resort & Bear Force One

### M5: Level 4 – Golf resort „Rekord Links“

Labels: `story`, `content`, `minigame`

Favours currency (back-room deals), `golf-cheat` and `abort-countdown` minigames, nuclear weather control event with framing („climate protection, Nobel-worthy“), pardon vending machine. Golf cart entry animation, weekend trait. Lexicon: pardon power, conflicts of interest. See docs/roadmap.md. Mega project „Rekord-Ballsaal“ at the presidential palace, paid by secret donors (spin + favours); the press wing is demolished and the press corps moves to a container in the car park. Lexicon: transparency of donations.

**Acceptance criteria**

- [ ] Favours earned and spent
- [ ] Both minigames scale rewards with score

### M6: Level 5 – Bear Force One

Labels: `story`, `content`, `minigame`

Fast travel between locations (plane flies over the map), in-flight trait, `whack-posts` minigame, dictator romance event (fictional Uranistan) with „cuddle diplomacy“ framing and #MagnusIstLiebe boost mode. Lexicon: diplomacy/international law, press pool. See docs/roadmap.md.

**Acceptance criteria**

- [ ] Fast travel with animation
- [ ] Uranistan leader stays abstract and fictional

## v0.5 – Jubel-TV & Wahlkampf

### M7: Level 6 – Jubel-TV studio

Labels: `story`, `content`

Medicine milestone (fabric softener; delete panicking doctors' posts), toaster vs. squirrels, dictator Tuesday talk show, colouring-book photo op event in the city park („playground safety inspection“). Prime-time trait, ON AIR entry animation. Lexicon: disinformation, freedom of assembly. See docs/roadmap.md.

**Acceptance criteria**

- [ ] All events as data-driven quests
- [ ] Prime-time trait uses local time

### M8: Campaign mode (Wahlkampf)

Labels: `story`, `content`, `minigame`

Campaign engine: 7 in-game days, rallies on the map (`rally-hype` rhythm minigame), daily scandal framing (hamster panic, coup sneakers, dictator Tuesday), TV debate, campaign funds currency and temporary campaign upgrades, crowd-size „optimisation“. Election night branches into endings. Lexicon: electoral principles, party financing. See docs/roadmap.md.

**Acceptance criteria**

- [ ] Campaign runs idle and offline (8 h cap)
- [ ] Result depends on votes, manipulation upgrades and democracy index

## v0.6 – Finale & Neue Amtszeit

### M9: Finale – The Great Dome, election night, endings and prestige

Labels: `story`, `content`

Dome location, „unannounced sightseeing tour“ spin event (satire targets the spin, big democracy penalty), endings (democracy saved despite you, eternal press secretary, whistleblower via new stat „Gewissen“), prestige „Neue Amtszeit“ with personality-cult bonus – the campaign returns each term. Lexicon: peaceful transfer of power, term limits. See docs/roadmap.md.

**Acceptance criteria**

- [ ] All endings reachable in tests
- [ ] Prestige reset keeps bonus
- [ ] Campaign recurs with higher difficulty

## Content & Community

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

## Backend

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

## Polish & Plattform

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

### M10: Extra satire ideas and cross-level balancing

Labels: `polish`, `content`

Record crowd photo, renaming offensive on the map, cabinet revolving door, seating order for Frieda, statistics office, weather decree, birthday parade with lawn mowers, self-awarded medals on the portrait, record peace prize, loyalty karaoke, ghostwritten memoirs, self-pardon framing. Balance all levels (target 20–40 min per level). See docs/roadmap.md.

**Acceptance criteria**

- [ ] Balancing tests per level
- [ ] Sounds for all new events

