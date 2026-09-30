/**
 * Validates every content pack: Zod schema, unique ids, cross-references,
 * known minigame handlers and missing German texts. Runs in CI.
 */
import { ContentError, requiredTextKeys } from '../src/content'
import { textLoad } from '../src/text-load'
import { loadContentFromDisk, readLocale } from './load-content'

try {
  const content = loadContentFromDisk()
  const texts = { ...readLocale('de'), ...content.i18n.de }
  const missing = requiredTextKeys(content).filter((k) => !texts[k])
  if (missing.length) {
    console.error(`Missing German texts (${missing.length}):\n- ${missing.join('\n- ')}`)
    process.exit(1)
  }
  // Word budgets only warn for now; they become errors once the texts are shortened (#76).
  const { issues } = textLoad(content, texts)
  if (issues.length)
    console.warn(
      `Warning: ${issues.length} text(s) over their word budget — see \`pnpm text:stats --budgets\`.`,
    )
  console.log(
    `Content OK: ${content.locations.length} location(s), ${content.stats.length} stats, ` +
      `${content.generators.length} generators, ` +
      `${content.upgrades.length} upgrades, ${content.quests.length} quests, ` +
      `${content.dailies.length} dailies, ${content.lexicon.length} lexicon cards.`,
  )
} catch (err) {
  if (err instanceof ContentError) {
    console.error(err.message)
    process.exit(1)
  }
  throw err
}
