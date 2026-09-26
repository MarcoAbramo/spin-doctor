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

/** Fixed scene & UI assets that do not come from content packs. Sizes are native art pixels. */
export const STATIC_ASSETS: AssetSpec[] = [
  {
    path: 'sprites/player.png',
    kind: 'sprite',
    size: '48×64 per frame',
    purpose:
      'You, the press secretary, behind the podium. Sheet + Aseprite JSON with tags idle, talk (plays on every tap), point',
  },
  {
    path: 'sprites/player.json',
    kind: 'sprite',
    size: 'Aseprite JSON',
    purpose:
      'Frame data for player.png (Aseprite: Export Sprite Sheet → JSON Data “Array”, Tags on)',
  },
  ...['generators', 'upgrades', 'quests', 'lexicon', 'settings'].map(
    (tab): AssetSpec => ({
      path: `icons/tab-${tab}.png`,
      kind: 'icon',
      size: '16×16',
      purpose: `Tab bar icon "${tab}" (shown at 32×32)`,
    }),
  ),
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
  const seen = new Set<string>()
  const add = (spec: AssetSpec) => {
    if (seen.has(spec.path)) return
    seen.add(spec.path)
    list.push(spec)
  }
  for (const l of content.locations) {
    add({
      path: `sprites/${l.scene.background}.png`,
      kind: 'sprite',
      size: '480×400',
      purpose: `Location "${l.id}": background (core play area x 80–400, see ASSET_GUIDE)`,
    })
    add({
      path: `sprites/${l.scene.tapTarget.sprite}.png`,
      kind: 'sprite',
      size: 'about 80×64',
      purpose: `Location "${l.id}": tap target at (${l.scene.tapTarget.x}, ${l.scene.tapTarget.y}), bottom-centre`,
    })
    for (const p of l.scene.props)
      add({
        path: `sprites/${p.sprite}.png`,
        kind: 'sprite',
        size: 'free',
        purpose: `Location "${l.id}": prop at (${p.x}, ${p.y}), bottom-centre`,
      })
  }
  for (const g of content.generators) {
    add({
      path: `sprites/${g.sprite ?? `gen-${g.id}`}.png`,
      kind: 'sprite',
      size: '48×48 per frame',
      purpose: `Generator "${g.id}" at location "${g.location}" (optional Aseprite JSON with tag idle)`,
    })
    add({
      path: `icons/generator-${g.id}.png`,
      kind: 'icon',
      size: '16×16',
      purpose: `Shop icon for generator "${g.id}" (emoji until then)`,
      optional: true,
    })
  }
  for (const s of content.speakers) {
    add({
      path: `portraits/${s.id}.png`,
      kind: 'portrait',
      size: '48×48',
      purpose: `Dialog portrait of speaker "${s.id}"`,
    })
  }
  for (const s of content.stats) {
    if (s.display === 'hidden') continue
    add({
      path: `icons/stat-${s.id}.png`,
      kind: 'icon',
      size: '16×16',
      purpose: `HUD icon for stat "${s.id}"`,
    })
  }
  for (const u of content.upgrades) {
    add({
      path: `icons/upgrade-${u.id}.png`,
      kind: 'icon',
      size: '16×16',
      purpose: `Icon for upgrade "${u.id}" (emoji until then)`,
      optional: true,
    })
  }
  for (const l of content.lexicon) {
    add({
      path: `illustrations/lexicon-${l.id}.png`,
      kind: 'illustration',
      size: '160×90',
      purpose: `Header image of lexicon card "${l.id}"`,
      optional: true,
    })
  }
  return list
}

export function assetUrl(path: string): string {
  return `${ASSET_ROOT}/${path}`
}
