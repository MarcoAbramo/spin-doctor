/**
 * Prints how much a player has to read per quest and location, and every text
 * that exceeds its word budget (issue #76). `--budgets` lists all violations.
 */
import { TEXT_BUDGETS, textLoad, WORDS_PER_SEC } from '../src/text-load'
import { loadContentFromDisk, readLocale } from './load-content'

const content = loadContentFromDisk()
const texts = { ...readLocale('de'), ...content.i18n.de }
const { quests, issues } = textLoad(content, texts)
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

console.log('Quest'.padEnd(28), 'Location'.padEnd(14), 'Words', ' Read', ' Timed')
for (const q of [...quests].sort((a, b) => b.words - a.words)) {
  if (!q.words) continue
  const over = q.words > TEXT_BUDGETS.quest ? ' !' : ''
  console.log(
    q.quest.padEnd(28),
    (q.location ?? '–').padEnd(14),
    String(q.words).padStart(5),
    fmt(q.readSec).padStart(5),
    String(q.timedWords || '').padStart(6),
    over,
  )
}

const byLocation = new Map<string, { words: number; readSec: number }>()
for (const q of quests) {
  const key = q.location ?? '(anywhere)'
  const sum = byLocation.get(key) ?? { words: 0, readSec: 0 }
  sum.words += q.words
  sum.readSec += q.readSec
  byLocation.set(key, sum)
}
console.log('\nPer location')
for (const [loc, sum] of byLocation)
  console.log(loc.padEnd(28), String(sum.words).padStart(5), fmt(sum.readSec).padStart(6))
const total = quests.reduce((a, q) => a + q.words, 0)
console.log(
  'Total'.padEnd(28),
  String(total).padStart(5),
  fmt(Math.round(total / WORDS_PER_SEC)).padStart(6),
)

const counts = new Map<string, number>()
for (const i of issues) counts.set(i.budget, (counts.get(i.budget) ?? 0) + 1)
console.log(`\nOver budget: ${issues.length} text(s)`)
for (const [budget, n] of counts)
  console.log(`  ${budget.padEnd(13)} > ${TEXT_BUDGETS[budget as keyof typeof TEXT_BUDGETS]}`, n)
if (process.argv.includes('--budgets'))
  for (const i of issues) console.log(`  ${i.budget}: ${i.where} (${i.words} > ${i.limit})`)
