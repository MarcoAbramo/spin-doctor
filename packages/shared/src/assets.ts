import type { Content } from './content'

/**
 * Asset conventions. The client tries to load these files and falls back to
 * generated placeholders when a file is missing, so art can be dropped in at
 * any time without code changes. See docs/ASSET_GUIDE.md.
 */
export const ASSET_ROOT = 'assets'

export interface AssetSpec {
  path: string
  kind: 'sprite' | 'portrait' | 'icon' | 'illustration' | 'audio'
  size: string
  purpose: string
  optional?: boolean
}

/** Fixed scene & UI assets that do not come from content packs. */
export const STATIC_ASSETS: AssetSpec[] = [
  {
    path: 'sprites/scene-background.png',
    kind: 'sprite',
    size: '1080×1350',
    purpose: 'Press room back wall + floor',
  },
  {
    path: 'sprites/scene-podium.png',
    kind: 'sprite',
    size: '480×420',
    purpose: 'Speaker podium (tap target), centred',
  },
  {
    path: 'sprites/scene-portrait.png',
    kind: 'sprite',
    size: '360×440',
    purpose: 'Stylised, fictional portrait of President Magnus Rekord (no real-person likeness!)',
  },
  { path: 'audio/tap.ogg', kind: 'audio', size: '< 0.2 s', purpose: 'Tap on podium' },
  { path: 'audio/buy.ogg', kind: 'audio', size: '< 0.4 s', purpose: 'Generator bought' },
  { path: 'audio/upgrade.ogg', kind: 'audio', size: '< 0.8 s', purpose: 'Upgrade bought' },
  {
    path: 'audio/scandal.ogg',
    kind: 'audio',
    size: '< 1 s',
    purpose: 'Scandal noticed (screen shake)',
  },
  {
    path: 'audio/milestone.ogg',
    kind: 'audio',
    size: '< 1.5 s',
    purpose: 'Milestone / confetti fanfare',
  },
  {
    path: 'audio/notify.ogg',
    kind: 'audio',
    size: '< 0.6 s',
    purpose: 'Phone buzz: president posted / new quest',
  },
  {
    path: 'audio/success.ogg',
    kind: 'audio',
    size: '< 0.6 s',
    purpose: 'Correct swipe / post handled',
  },
  { path: 'audio/fail.ogg', kind: 'audio', size: '< 0.6 s', purpose: 'Wrong swipe / missed post' },
  {
    path: 'audio/typing.ogg',
    kind: 'audio',
    size: '< 0.1 s',
    purpose: 'Speech bubble typing tick',
    optional: true,
  },
]

/** Assets derived from content — new characters, generators, stats or cards add entries here. */
export function contentAssets(content: Content): AssetSpec[] {
  const list: AssetSpec[] = []
  for (const g of content.generators) {
    list.push({
      path: `sprites/${g.sprite ?? `gen-${g.id}`}.png`,
      kind: 'sprite',
      size: '256×256',
      purpose: `Generator "${g.id}" in the press room (idle animation optional)`,
    })
    list.push({
      path: `icons/generator-${g.id}.png`,
      kind: 'icon',
      size: '128×128',
      purpose: `Shop icon for generator "${g.id}" (emoji until then)`,
      optional: true,
    })
  }
  for (const s of content.speakers) {
    list.push({
      path: `portraits/${s.id}.png`,
      kind: 'portrait',
      size: '512×512',
      purpose: `Dialog portrait of speaker "${s.id}"`,
    })
  }
  for (const s of content.stats) {
    if (s.display === 'hidden') continue
    list.push({
      path: `icons/stat-${s.id}.png`,
      kind: 'icon',
      size: '96×96',
      purpose: `HUD icon for stat "${s.id}"`,
      optional: true,
    })
  }
  for (const u of content.upgrades) {
    list.push({
      path: `icons/upgrade-${u.id}.png`,
      kind: 'icon',
      size: '128×128',
      purpose: `Icon for upgrade "${u.id}"`,
      optional: true,
    })
  }
  for (const l of content.lexicon) {
    list.push({
      path: `illustrations/lexicon-${l.id}.png`,
      kind: 'illustration',
      size: '800×450',
      purpose: `Header image of lexicon card "${l.id}"`,
      optional: true,
    })
  }
  return list
}

export function assetUrl(path: string): string {
  return `${ASSET_ROOT}/${path}`
}
