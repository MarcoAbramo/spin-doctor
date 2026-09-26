# Asset guide: graphics & audio

This guide is for anyone creating art or sound for Spin Doctor. It covers:

- **what** is needed
- **which file name and format** to use
- **what happens automatically** once a file is dropped in

The always-current list of every file (with ✅ for existing ones) is **[ASSET_CHECKLIST.md](ASSET_CHECKLIST.md)**. Regenerate it with:

```bash
pnpm assets          # rewrite docs/ASSET_CHECKLIST.md
pnpm assets --check  # exit code 1 while required assets are missing
```

## How it works

- Every asset lives under **`apps/client/public/assets/`**.
- The game checks at runtime whether a file exists. If it does, the file is used; if not, the game shows a placeholder (Pixi shapes, emoji or a synth sound). Adding art therefore needs **no code change**: put the file in the right place with the right name, then reload.
- File names are derived from the **ids in the content packs** (`packages/shared/content/**`). A new character, generator, upgrade, stat or lexicon card automatically adds new entries to the checklist.

## Style

- **Look:** cartoon 2D with bright, punchy colours and clean outlines (2–4 px at the target size). Leave some room for squash & stretch, because the game scales sprites when they bounce.
- **Palette:** Superbia purple `#3b2a7a` / `#1d1440`, gold `#ffd84d`, curtain red `#b3263a`, wood `#8b5a2b`.
- **Everything is fictional.** No real persons, no likeness of real politicians (no recognisable hairstyles, faces, skin tones or outfits that point to one), no real parties, logos, brands or media. President Magnus Rekord is deliberately stylised: a pastel oval head with a crown and sash. Keep him abstract.
- **Punch up, never down:** don't caricature groups of people.
- **Licence:** your own work is published under **CC BY 4.0** (see `LICENSE-ASSETS`). Third-party CC0 packs (e.g. Kenney) go into `assets/vendor/kenney/`. Every source must be listed in `ASSETS.md`.

## Technical rules

| Type | Format | Notes |
|---|---|---|
| Sprites, portraits, icons | **PNG** with transparency, sRGB | Deliver at **2× the display size**; the sizes in the checklist are already 2×. |
| Illustrations | PNG or WebP | 16:9 |
| Audio | **OGG** (Vorbis or Opus), mono, 44.1/48 kHz | Normalise to about −16 LUFS, keep effects short and trim leading silence. |

- **Anchor point:** scene sprites are placed by their **bottom centre**, where the feet or floor contact is. Leave no empty margin at the bottom.
- File size: try to stay below **150 KB per sprite** and **50 KB per sound effect**. The whole game is precached for offline play.
- Filenames are lowercase kebab-case and must match exactly. Use `gen-botfarm.png`, not `Gen_BotFarm.PNG`.

## What is needed

### 1. Press room (scene), `assets/sprites/`

| File | Size | What |
|---|---|---|
| `scene-background.png` | 1080×1350 | Back wall with curtains and floor. The game draws it into a 400×500 design area: floor from y≈330, portrait centred at the top, podium at the bottom centre. |
| `scene-podium.png` | 480×420 | Speaker's podium with microphone. This is the **tap target**, so it should look pressable. |
| `scene-portrait.png` | 360×440 | Framed portrait of the (fictional) president. |

### 2. Generators, `assets/sprites/` and `assets/icons/`

Each generator needs a **scene sprite** (256×256; it stands in the room and bobs gently) and optionally a **shop icon** (128×128). The sprite name comes from the `sprite` field in `content/core/generators.json`:

| Generator | Sprite | Idea |
|---|---|---|
| Praktikant mit Diensthandy | `gen-intern.png` | Young staffer glued to a phone |
| Talkshow-Dauergast | `gen-talkshow.png` | Studio armchair with a guest (or just the chair with a spotlight) |
| Bot-Farm im Keller | `gen-botfarm.png` | Server rack with blinking LEDs, cables, a smiley sticker |
| Hofberichterstatter-Zeitung | `gen-paper.png` | Stack of newspapers with a gushing headline |
| Staatssender „Jubel-TV“ | `gen-tv.png` | Wall TV showing confetti and applause |
| Ministerium für Wahrheitspflege | `gen-ministry.png` | Small columned building or banner |

Once 10 or 25 units are owned, the game shows up to 3 copies of the sprite, so it should look fine repeated.

### 3. Characters (dialog portraits), `assets/portraits/<speaker-id>.png`

The size is 512×512: square, head and shoulders, facing slightly left or right. The game crops it to a circle, so keep the important parts in the middle 80 %.

| Speaker id | Character |
|---|---|
| `president` | President Magnus Rekord: abstract, crown, sash, supremely pleased with himself |
| `konstantin` | Konstantin Rekord, nephew and Minister for Everything: too many lanyards and badges |
| `frieda` | Dr. Frieda Nachfrage, investigative journalist: notepad, sharp look |
| `you` | The player (press secretary): neutral, adaptable (the player picks a name) |

### 4. Icons (optional; emoji until then), `assets/icons/`

- `stat-<id>.png` at 96×96 is the HUD icon for a stat (`spin`, `approval`, `democracy`).
- `upgrade-<id>.png` at 128×128 is the icon of each upgrade card.
- `generator-<id>.png` at 128×128 is the icon of each shop card.

### 5. Lexicon illustrations (optional), `assets/illustrations/lexicon-<id>.png`

Size 800×450. These are neutral, factual header images: no satire and no real persons.

### 6. Audio, `assets/audio/`

| File | Length | When it plays | Feel |
|---|---|---|---|
| `tap.ogg` | < 0.2 s | Every tap on the podium | Soft pop or click. Plays **very** often, so it must not be annoying. |
| `buy.ogg` | < 0.4 s | Generator bought | Cash-register "ka-ching" in miniature |
| `upgrade.ogg` | < 0.8 s | Upgrade bought / lexicon card unlocked | Short rising jingle |
| `scandal.ogg` | < 1 s | Scandal noticed (screen shake) | Dramatic "dun-dun" or muffled buzzer |
| `milestone.ogg` | < 1.5 s | 10/25/50/100 units, offline reward | Fanfare with confetti |
| `notify.ogg` | < 0.6 s | President posted / new quest | Double phone buzz |
| `success.ogg` | < 0.6 s | Post handled, correct swipe | Bright "ding" |
| `fail.ogg` | < 0.6 s | Wrong swipe, missed post | Low "bonk" |
| `typing.ogg` | < 0.1 s | Speech bubble typing (plays every few letters) | Tiny typewriter tick, very quiet |

All sounds are played quietly by default and can be muted in the settings.

## Checklist: adding a new character, generator, etc.

1. **Content first.** Add the character to a content pack as a `speakers` entry with `id`, `nameKey` and `color`. Generators, upgrades and cards work the same way. See `CONTRIBUTING.md` → "Writing a new quest".
2. Run `pnpm assets`. The new files appear in `docs/ASSET_CHECKLIST.md` with name, size and purpose.
3. Create the graphics and sounds following the rules above and save them under exactly those names in `apps/client/public/assets/…`.
4. Run `pnpm dev`, reload and check: portrait in the dialog, sprite in the room, icon in the shop.
5. Run `pnpm assets` again (the entries should now show ✅) and add each source and licence to `ASSETS.md`.
6. Open a PR (`content/…` or `feat/…` branch) with a screenshot.

**Rules of thumb for a new character:** 1 portrait (512×512) is required. If the character appears in the scene, add 1 scene sprite (256×256). A signature sound (< 0.6 s) is optional; tell a developer if the character should get one, because that needs a new sound id in `apps/client/src/juice/audio.ts`.
