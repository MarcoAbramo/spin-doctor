# Asset guide: pixel art & audio

Spin Doctor is a **pixel-art** game. This guide tells artists **what** to draw, **in which size, palette and file name**, and **how animations work**, so art can be dropped in without touching code.

- Live list of every file, with ✅ for those that exist: **[ASSET_CHECKLIST.md](ASSET_CHECKLIST.md)** (regenerate with `pnpm assets`).
- Palette files: **[docs/palette/endesga-32.hex](palette/endesga-32.hex)** and **[.gpl](palette/endesga-32.gpl)**. In Aseprite: *Palette → Load Palette*.

## How it works

- All art lives in **`apps/client/public/assets/`**. File names come from the content ids; a new character or generator automatically appears in the checklist.
- Every file currently there is a **generated placeholder** made by `apps/client/scripts/pixel-placeholders.mjs`. **Paint over them directly** by opening the PNG in Aseprite, replacing it and saving.
  - The generator **never overwrites existing files**. `pnpm --filter @spin-doctor/client pixel-placeholders` only fills in missing ones; `--force` regenerates everything.
- If a file is missing, the game shows a grey box (sprites) or an emoji (icons), so the game never breaks.
- With `pnpm dev` running, reload the page to see your art.

## Style rules

- **Palette:** use **Endesga 32** only, with no other colours and no anti-aliasing or semi-transparent pixels. Alpha is 0 or 255.
- **Resolution:** the press room is authored at **320×400 art pixels**. The game scales it with nearest-neighbour, usually at 1 art pixel = 1 CSS pixel (2–3 device pixels), so draw at **1× native size**. Don't upscale your exports.
- **Outlines:** use a 1 px dark outline (`#181425`) around characters and props, as in the placeholders.
- **Anchor:** every sprite is placed by its **bottom-centre**, where the feet or floor contact is. Leave no empty rows at the bottom.
- **Light:** light comes from the top-left, so highlights go top-left and shadows bottom-right.
- **Content:** everything is fictional. Draw no real persons and nothing that resembles a real politician; President Rekord stays stylised (bald, crown, sash). Punch up, never down. See `CONTRIBUTING.md`.
- **Licence:** your own art is CC BY 4.0 (`LICENSE-ASSETS`). Record every source in `ASSETS.md`.

## The press room: layout in art pixels

```
x:  0        80                           240                          400        480
    ┌────────┬────────────────────────────────────────────────────────────┬────────┐  y=0
    │ extra  │  ceiling (may be cropped on short screens: keep y<50 plain)│ extra  │
    │ wall   │             [portrait 64×80, bottom at y=150]              │ wall   │
    │ for    │ [TV y≈150]                              [ministry y≈170]   │ for    │
    │ wide   │                                                            │ wide   │
    │ screens│ ─────────── wainscot y≈226 ──────────────────────────────  │ screens│
    │        │ [bot farms y=300]   floor from y=290   [talk show y≈320]   │        │
    │        │ [interns y≈390]   [player bottom y=372]  [papers y≈395]    │        │
    │        │                   [podium 80×64, bottom y=400]             │        │
    └────────┴────────────────────────────────────────────────────────────┴────────┘  y=400
```

- `scene-background.png` is **480×400**. Only the central 320 px (x 80–400) is always visible; the 80 px strips on each side show on wide screens, so continue the wall and floor there.
- Positions of generator props live in `SLOTS` in `apps/client/src/scene/scene.ts`, in art pixels. Up to 3 copies appear at 1, 10 and 25 units.

## Animations (Aseprite)

Animated sprites are a **sprite sheet PNG plus an Aseprite JSON** next to it with the same name, e.g. `player.png` and `player.json`. **Tags** become animations.

Export in Aseprite via *File → Export Sprite Sheet*:
- **Layout:** *Horizontal Strip*; all frames the same size.
- **Output:** check **JSON Data**, choose **Array** (not Hash), and turn **Tags** on.
- **Frame durations:** set them in the timeline; the game uses them.

| Tag | Used for |
|---|---|
| `idle` | Loops all the time. **Required** for animated sprites. |
| `talk` | Player only: plays once on every tap, then returns to `idle`. |
| `point` | Player only: reserved for events (e.g. when the president posts). |

Without a JSON file, the PNG is shown as a single static frame.

## The city map (Tiled)

The map is a normal **Tiled** map in JSON format: `apps/client/public/assets/maps/superbia.json`.
Open it in [Tiled](https://www.mapeditor.org) (free), paint, save, and reload the game.

- **Grid:** 48×48 tiles of 16×16 px. The tileset is `maps/superbia-tiles.png` (8×3 tiles; add rows as needed and keep the image path relative).
- **Layers:**
  - `ground`: floor tiles.
  - `deco`: trees, lamps, benches, drawn above the ground.
  - `collision`: any tile here makes the cell unwalkable. The layer is hidden in the game.
  - Object layer `buildings`: one rectangle per building footprint in pixels. Each needs these properties:
    - `location`: location id; unknown ids show „Demnächst“
    - `sprite`: e.g. `map-press-house`
    - `doorX` / `doorY`: the door tile below the footprint, which must be walkable
  - Object layer `spawn`: a point where you start.
- **Building sprites** (`sprites/map-*.png`) are bottom-centre anchored on the footprint and may be taller than it (roof, tower). An optional Aseprite tag `open` is reserved for the door animation.
- **You on the map:** `sprites/player-walk.png`, 16×24 per frame, with tags `walk-down|up|left|right` and `idle-down|up|left|right`.
- Every building gets a **live sign** in the game (till, fill bar, status), so no text is needed in the art.

## What is needed

### Scene, `assets/sprites/`

| File | Size | What |
|---|---|---|
| `scene-background.png` | **480×600** | Briefing hall, flat perspective from the back: blue back wall (y 0–150), a deep stage with two flags and a carpet runner (front edge y≈310), then **9 tiered rows** („Ränge“) down to the bottom — seat backs at y 336, 366 … 576 and x 14/38/62/86/110/134 · 186/210/234/258/282/306 (centre aisle 146–174). Seats outside the 320 px core are drawn occupied (full hall on wide screens). |
| `scene-plaque.png` | about 104×64 | Oval plaque above the podium („PALAST · SUPERBIA“, fictional, no real seal) |
| `scene-podium.png` | 80×64 | Lectern with two microphones and a seal, the tap target at (160, 300); its top edge sits around y=16 in the sprite |
| `reporter-*.png` + `.json` | **24×28 per frame** | The press corps **seen from behind**, seated (rows 1–2 are full from the start): tags `idle` and `react` (hand up, notepad, camera flash). A random reporter plays `react` on taps. `reporter-frieda` is Dr. Frieda Nachfrage (bun, green jacket), front row next to the aisle. |
| `player.png` + `.json` | 48×64 per frame | **You**, standing behind the podium. Only the upper ~40 px are visible above it, so put the expression into head, arms and hands. |

**Player animation ideas:**
- `idle`: 2–4 frames of breathing or blinking, about 500 ms each.
- `talk`: 3–5 frames of mouth and arm gestures, 60–100 ms each (it plays on every tap, so keep it snappy).
- `point`: a pointing gesture.

### Generators, `assets/sprites/gen-*.png`, 48×48 per frame

The more units you own, the more copies stand in the room (1 at the first unit, then about 3 at 3, 6 at 10, 8 at 25, 11 at 100). Where they stand comes from the location's `scene.slots` (hand-placed, used first) and `scene.crowds` (an area filled automatically). In the press hall the court reporters (`gen-paper`, **24×28 per frame**, seated from behind like the press corps) take the empty seats of rows 3–9, front row first — up to 84 of them (`exponent` 0.8: about 7 at 10 units, 40 at 100).

| File | Idea |
|---|---|
| `gen-intern.png` | Intern with a work phone (phone glow blinks) |
| `gen-talkshow.png` | Studio armchair with a talking guest |
| `gen-botfarm.png` | Server rack with blinking LEDs |
| `gen-paper.png` | Stack of loyal newspapers |
| `gen-tv.png` | “Jubel-TV” wall screen with confetti |
| `gen-ministry.png` | Model of the Ministry of Truth Care with a waving flag |

### Characters, `assets/portraits/<speaker>.png`, 48×48

These are head-and-shoulders portraits for the dialog box: `president`, `konstantin` (nephew, too many lanyards), `frieda` (journalist, glasses, notepad), and `you` (the player). A new character in a content pack (`speakers`) automatically appears in the checklist.

### Icons, `assets/icons/`, 16×16, shown at 2×

| File | Where |
|---|---|
| `tab-generators.png`, `tab-upgrades.png`, `tab-quests.png`, `tab-lexicon.png`, `tab-settings.png` | Bottom tab bar |
| `stat-spin.png`, `stat-approval.png`, `stat-democracy.png` | HUD |
| `generator-<id>.png`, `upgrade-<id>.png` | Shop cards (optional; emoji until then) |

### Lexicon illustrations (optional), `assets/illustrations/lexicon-<id>.png`, 160×90

These are neutral and factual.

### Audio, `assets/audio/*.ogg`

Use short chiptune-style SFX: OGG (Vorbis or Opus), mono, trimmed, about −16 LUFS. A tool like sfxr / jsfxr fits the pixel look. Until a file exists, a built-in synth plays.

| File | When |
|---|---|
| `tap.ogg` | Every tap. Plays very often, so keep it soft. |
| `buy.ogg` | Generator bought |
| `upgrade.ogg` | Upgrade bought / lexicon card |
| `scandal.ogg` | Scandal with screen shake |
| `milestone.ogg` | Milestone fanfare |
| `notify.ogg` | President posted / new quest |
| `success.ogg` / `fail.ogg` | Minigame and post feedback |
| `typing.ogg` (optional) | Dialog typing tick |

## Checklist: a new character, generator, etc.

1. Add it to a content pack (see `CONTRIBUTING.md` → "Writing a new quest").
2. Run `pnpm assets`; the new files appear in `docs/ASSET_CHECKLIST.md`.
3. Optionally run `pnpm --filter @spin-doctor/client pixel-placeholders` for a grey placeholder to paint over. Only characters and props defined in the generator get a real placeholder.
4. Paint the art in Aseprite using the Endesga 32 palette at the size from the checklist.
5. Export the PNG (plus JSON with tags if animated) under exactly that name into `apps/client/public/assets/…`.
6. Reload `pnpm dev` and check; run `pnpm assets` (it should now show ✅); update `ASSETS.md`; open a PR with a screenshot.
