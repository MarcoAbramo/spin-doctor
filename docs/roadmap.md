# Roadmap: the world of Superbia (v0.2 – v0.6)

> The pressroom is level 1. After act 1, a **walkable map of the capital** unlocks. Every building on it is its own idle level, with its own scene, generators, upgrades, events and minigames. The game stays an idle game: all unlocked locations keep producing.
> Issues and milestones live in [backlog.md](backlog.md) and on GitHub.

## Satire guardrails for this roadmap (binding, see CONTRIBUTING.md)

- **Only fictional versions go into the game.** Scenes, dialogues, content and art contain only the fictional version: no real names, brands, quotes or places. The real event behind an episode goes on a **„Realitäts-Check“ card** (ADR 0006): neutral, attributed, ≥ 2 verified news sources. Every milestone ships the cards for its episodes.
  - Rekord-Marker instead of a brand-name marker, **Bear Force One**, **P.R.I.C.E.**, **the Great Dome** (parliament), **Uranistan**.
- **P.R.I.C.E.** (*Patriotic Revenue & Import Curbing Enforcement*, motto *„Alles hat seinen Preis – vor allem die Einreise.“*) satirises tariff mania and red tape.
  - Examples: cookie tariffs, entry fees for migratory birds, the president's own imported golf balls confiscated.
  - **No mechanic may reward catching or deporting people.** Migrants are never the punchline.
- **The wall** satirises vanity projects, cost overruns, nepotism and emergency tricks. Its stated purpose is keeping out *imported cookies, rain clouds and bad polls*, never people.
- **No jokes about religion or appearance.** The photo op uses a colouring book. The Uranistan leader stays abstract.
- **The Dome event** targets the spin, not violence as fun, and carries a heavy democracy penalty.
- **Lexicon cards** are factual, have a verified bpb.de source, and carry `needs-fact-check`.

## Levels

| # | Location | Unlock | Highlights | New values | Lexicon |
|---|---|---|---|---|---|
| 1 | Press house (exists) | start | Act 1; completion opens the map | – | press freedom, separation of powers, gerrymandering |
| 2 | **Rosengarten der Strafzölle** | act 1 | `zoll-tafel` minigame (strike countries on the world map: „+400 % ZÖLLE AUF ALLES“); real-estate diplomacy (buying the moon, then cookie tariffs out of spite); secret-language framing („furbeln“) | price level (tariffs raise production but depress approval) | tariffs, independent science |
| 3 | **P.R.I.C.E.** | level 2 | confiscated golf balls, migratory-bird fees; shark moat at the finance ministry („vegan shark reserve“); **Great Record Wall** mega project | – | judicial review, power of the purse, emergency powers |
| 4 | **Golf resort „Rekord Links“** | level 3 | back-room deals, `golf-cheat`, nuclear weather control (`abort-countdown` + „climate protection“ framing), pardon vending machine | **favours** (currency) | pardon power, conflicts of interest |
| 5 | **Bear Force One** | level 4 | fast travel, dictator romance with Uranistan („cuddle diplomacy“), `whack-posts` boost mode for #MagnusIstLiebe | – | diplomacy, press pool |
| 6 | **Jubel-TV studio** | level 5 | fabric-softener medicine (`whack-posts`), toaster vs. squirrels, dictator Tuesday, colouring-book photo op in the city park | – | disinformation, freedom of assembly |
| 7 | **Campaign mode** | level 6 | 7 in-game days, rallies (`rally-hype`), hamster panic in the TV debate, coup sneakers, crowd-size „optimisation“ | **campaign funds** (currency), votes | electoral principles, party financing |
| 8 | **The Great Dome** (finale) | election night | „unannounced sightseeing tour“ spin event, endings, prestige **„Neue Amtszeit“** (the campaign returns each term) | conscience | peaceful transfer of power, term limits |

### Great Record Wall (mega project from level 3)

- Up to 20 sections, visible on the map, with steeply rising costs.
- Each section gives a small global bonus and costs a little democracy.
- Milestone events by section:
  - 1: no-bid contract for the nephew's firm.
  - 3: Uranistan returns the invoice, gift-wrapped.
  - 5: emergency declaration to bypass parliament.
  - 8: sections 4–7 turn out to be painted cardboard.
  - 12: souvenir shop with a P.R.I.C.E. entrance fee.
  - 20: inauguration in the rain; the wall doesn't stop clouds.

### More mega projects (same mechanic as the wall: stages visible on the map)
- **Reflecting-pool renovation** (with level 2, in front of the Great Dome):
  - The pool is drained, gilded and refilled so that it reflects only Magnus' statue.
  - The contract goes to the nephew's firm again, costs double at every stage, and P.R.I.C.E. charges the ducks an entry fee.
  - Lexicon: public procurement.
- **The Record Ballroom** (with level 4, at the presidential palace):
  - A gigantic ballroom, „privately paid“ by secret donors (costs spin **and favours**).
  - The press wing is demolished for it, and the press corps moves into a container in the car park. Frieda's seat ends up there.
  - Stages: demolition, a gold chandelier „addendum“, listed-building protection ignored, and a grand opening where Magnus dances alone.
  - Lexicon: transparency of donations.

### Extra ideas

1. Record crowd photo.
2. Renaming offensive (landmarks renamed on the map).
3. Cabinet revolving door.
4. Frieda's seat moves further back with each dark upgrade.
5. „Reorganised“ statistics office (HUD shows „112 %*“).
6. Weather decree.
7. Birthday parade of lawn mowers.
8. Self-awarded medals on the portrait.
9. Record peace prize.
10. Loyalty karaoke.
11. Ghostwritten memoirs.
12. Self-pardon framing.

### New characters (48×48 portraits)

- Opposition leader Vera Widerspruch
- Customs director Horst Hebesatz
- Caddie Kevin
- Chief meteorologist Dr. Wolke
- Doctor Dr. Evi Denz
- TV host Ben Beifall
- Captain Bär
- The Grand Marshal of Uranistan (abstract)

## Location economy: every place spins differently

- **Production and till:**
  - Each location produces through its own generators.
  - The location you are at pays out directly, with a ×1.5 **on-site bonus**.
  - All other locations fill their **till**, capped at 60 min of production at first and up to 8 h via upgrades.
  - Entering a location collects the till with an animation. A full till stops production, and its sign blinks „VOLL!“.
- **News situation:** events change a location's yield.
  - **Spin quality:** how well you frame an event sets the location's multiplier, e.g. ×2.5 boom, ×0.7 lull, ×0.4 shitstorm if ignored.
  - **Hotspots:** random location events.
  - **Traits** use real local time: Jubel-TV prime time, golf on weekends, P.R.I.C.E. office hours, Bear Force One only „in flight“.
- **Offline:** all tills fill up to their caps, and the current location pays directly (8 h cap).

## Map: live signs and animations

- **Live sign above every building**, showing the till (counting live), a fill bar, the rate, and status icons (🔥 boom, 🌧 lull, ❗ event, VOLL!, 🔒).
- **Info card on tap**, showing „since your last visit: 1 h 12 min, 48.300 spin“, the active modifiers, and a go/fly button.
- **Movement:** tap-to-walk with A* and a path preview; the walk cycle has 4 directions.
- **Ambience:** clouds, cars, golf carts, gulls, the TV tower, the wall crane, and a time-of-day tint.
- **Building animations** get more intense with production: smoke, light, people.
- **Entering a location** (≤ 1.5 s, skippable, fade only with reduced motion):
  1. Walk to the door; the door opens.
  2. Pixel zoom, then a dither or iris wipe.
  3. Title banner; the player walks to their spot.
  4. A coin stream carries the till to the HUD.
- **Location-specific entries:**
  - Press house: camera flashes.
  - Rosengarten: wind gust with flying papers.
  - P.R.I.C.E.: turnstile and a „EINREISEGEBÜHR BEZAHLT“ stamp.
  - Golf resort: golf cart and sprinkler.
  - Bear Force One: take-off.
  - Jubel-TV: ON AIR countdown.
  - Great Dome: huge doors.
  - Campaign stage: confetti cannon.

## Architecture (all generic and data-driven, ADR 0002)

- **`packages/shared`:**
  - New content sections `locations[]` and `campaigns[]`.
  - `location` / `costStat` / `produces` / `maxCount` / `perUnitEffects` / `mapSprites` on generators and upgrades.
  - `location:<id>` multipliers, `qualityEffects` on framing and minigame steps.
  - Conditions `location`, `locationUnlocked`, `hour`, `weekday`, `campaignDay`, `campaignActive`.
  - Step types `framing` and `ending`.
  - Stat coupling (`drift.towardFrom`).
  - Per-location tills in state, save v2 with migration, and `travel`, `newTerm` and campaign tick.
- **`apps/client`:**
  - `scene/location-scene.ts` (generic location scene read from content).
  - `scene/map.ts` (Tiled JSON, culling, A*, camera).
  - `scene/manager.ts`.
  - `scene/transitions.ts` (composable steps: walkTo, playSprite, pixelZoom, ditherWipe, iris, banner, shake, stamp, flyCoins, sound, haptic).
  - `scene/map-signs.ts`, `scene/map-ambient.ts`.
  - New minigame handlers: `zoll-tafel`, `whack-posts`, `golf-cheat`, `abort-countdown`, `rally-hype`.
  - Framing modal, ending screen, campaign overlay.
- **Art tools:** Tiled for the map (16×16 tileset in Endesga 32), Aseprite for sprites (sheet + JSON array with tags). The placeholder generator is extended, and `pnpm assets` lists every file per location.

## Milestones

| M | Scope | GitHub milestone |
|---|---|---|
| M1 | Engine: locations, tills, multi-currency, framing/ending steps, save v2 (no visible change) | v0.2 – Engine & Karte |
| M2 | Map, live signs, transition engine, press house entry | v0.2 – Engine & Karte |
| M3 | Rosengarten | v0.3 – Rosengarten & P.R.I.C.E. |
| M4 | P.R.I.C.E. + Great Record Wall | v0.3 – Rosengarten & P.R.I.C.E. |
| M5 | Golf resort | v0.4 – Golf-Resort & Bear Force One |
| M6 | Bear Force One | v0.4 – Golf-Resort & Bear Force One |
| M7 | Jubel-TV studio | v0.5 – Jubel-TV & Wahlkampf |
| M8 | Campaign mode | v0.5 – Jubel-TV & Wahlkampf |
| M9 | Great Dome, endings, prestige | v0.6 – Finale & Neue Amtszeit |
| M10 | Extra ideas, balancing, sounds | Polish & Plattform |

**Every location milestone ships:**
- entry and exit animation, ambience, hotspots, traits
- balancing tests (target 20–40 min per level)
- German texts, lexicon cards with verified sources
- placeholder art and an updated asset checklist
- extended smoke test, and a PR with green CI (squash merge)
