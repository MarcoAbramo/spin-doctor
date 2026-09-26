# ADR 0005 — Pixel art at 320×400 with Endesga 32

- Status: accepted
- Date: 2026-09-26

## Decision
- All scene art is authored at 320×400 art pixels (background 480×400 for wide screens) in the
  Endesga 32 palette, rendered with nearest-neighbour filtering and scaled so one art pixel maps
  to whole device pixels whenever possible (ceiling may be cropped on short screens).
- Animations use Aseprite sprite sheets + JSON ("Array", frame tags); `idle` loops, the player's
  `talk` plays on every tap.
- UI uses Pixelify Sans (OFL, self-hosted via @fontsource) and "notched" pixel boxes; long
  factual lexicon text stays in the system font for readability.
- Placeholders are real PNGs from a generator script that never overwrites existing files.

## Consequences
- Artists can repaint files 1:1 in Aseprite; no code changes for new frames or tags.
- Very small screens get fractional scaling (slightly uneven pixels) rather than letterboxing.
