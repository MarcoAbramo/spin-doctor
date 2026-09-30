import { describe, expect, it } from 'vitest'
import { loadContentFromDisk, readLocale } from '../scripts/load-content'
import type { Content } from '../src/content'
import { countWords, TEXT_BUDGETS, textLoad } from '../src/text-load'

const quest = {
  id: 'q',
  category: 'story',
  titleKey: 'q.title',
  trigger: { type: 'auto' },
  steps: [
    { type: 'dialog', speaker: 'you', lines: ['q.l1', 'q.l2', 'q.l3', 'q.l4'] },
    {
      type: 'framing',
      questions: [
        {
          textKey: 'q.q1',
          answers: [
            { textKey: 'q.a1', score: 1, replyKey: 'q.r1' },
            { textKey: 'q.a2', score: 0, replyKey: 'q.r2' },
          ],
        },
      ],
    },
  ],
}
const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ')

describe('text load', () => {
  it('counts words, not punctuation', () => {
    expect(countWords('Äh … liebe Presse – hallo!')).toBe(4)
    expect(countWords('')).toBe(0)
  })

  it('sums one run of a quest and flags every budget', () => {
    const content = { quests: [quest] } as unknown as Content
    const texts = {
      'q.title': 'Titel',
      'q.l1': words(15),
      'q.l2': words(2),
      'q.l3': words(2),
      'q.l4': words(2),
      'q.q1': words(13),
      'q.a1': words(7),
      'q.a2': words(12),
      'q.r1': words(11),
      'q.r2': words(3),
    }
    const { quests, issues } = textLoad(content, texts)
    // title 1 + lines 21 + question 13 + answers 19 + longest reply 11
    expect(quests[0]).toMatchObject({ words: 65, readSec: 22, timedWords: 32 })
    expect(issues.map((i) => i.budget).sort()).toEqual(
      ['answer', 'answer', 'line', 'linesPerStep', 'question', 'reply', 'timedRead'].sort(),
    )
  })

  it('runs on the real content', () => {
    const content = loadContentFromDisk()
    const { quests } = textLoad(content, { ...readLocale('de'), ...content.i18n.de })
    expect(quests).toHaveLength(content.quests.length)
    expect(TEXT_BUDGETS.answer).toBeLessThan(TEXT_BUDGETS.question)
  })
})
