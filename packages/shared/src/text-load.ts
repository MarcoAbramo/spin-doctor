import type { Content } from './content'
import type { QuestDef } from './schema'

/**
 * Text load of the story: how much a player has to read per quest, and where
 * texts exceed the word budgets (issue #76). Tooling only — not used by the game.
 */

/** Word budgets per text kind. */
export const TEXT_BUDGETS = {
  /** One dialog or ending line. */
  line: 14,
  /** Lines per dialog/ending step. */
  linesPerStep: 3,
  /** A framing question from the press. */
  question: 12,
  /** A framing answer or dialog choice: a punchline, not a sentence. */
  answer: 6,
  /** The reaction to an answer or choice. */
  reply: 10,
  /** What a framing question makes you read against the clock (question + all answers). */
  timedRead: 30,
  /** Everything a player reads in one quest (one reply per choice). */
  quest: 120,
} as const

export type TextBudget = keyof typeof TEXT_BUDGETS

/** Silent reading speed on a phone, words per second. */
export const WORDS_PER_SEC = 3

export interface TextIssue {
  quest: string
  budget: TextBudget
  /** Text key, or the step for per-step budgets. */
  where: string
  words: number
  limit: number
}

export interface QuestTextLoad {
  quest: string
  location: string | undefined
  /** Words a player reads in one run (longest reply per choice). */
  words: number
  readSec: number
  /** Worst framing question: question + answers, read against the clock. */
  timedWords: number
}

/** Counts words; dashes, ellipses and other punctuation-only tokens don't count. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

function analyseQuest(q: QuestDef, texts: Record<string, string>) {
  const issues: TextIssue[] = []
  let words = 0
  let timedWords = 0
  const count = (key: string, budget?: TextBudget) => {
    const n = countWords(texts[key] ?? '')
    if (budget && n > TEXT_BUDGETS[budget])
      issues.push({ quest: q.id, budget, where: key, words: n, limit: TEXT_BUDGETS[budget] })
    return n
  }
  const perStep = (lines: string[], step: number) => {
    if (lines.length > TEXT_BUDGETS.linesPerStep)
      issues.push({
        quest: q.id,
        budget: 'linesPerStep',
        where: `step ${step}`,
        words: lines.length,
        limit: TEXT_BUDGETS.linesPerStep,
      })
    for (const l of lines) words += count(l, 'line')
  }
  words += count(q.titleKey)
  q.steps.forEach((s, i) => {
    if (s.type === 'dialog') {
      perStep(s.lines, i)
      let longestReply = 0
      for (const c of s.choices ?? []) {
        words += count(c.textKey, 'answer')
        if (c.replyKey) longestReply = Math.max(longestReply, count(c.replyKey, 'reply'))
      }
      words += longestReply
    } else if (s.type === 'ending') {
      words += count(s.titleKey)
      perStep(s.lines, i)
    } else if (s.type === 'objective') {
      words += count(s.textKey)
    } else if (s.type === 'framing') {
      if (s.introKey) words += count(s.introKey)
      for (const question of s.questions) {
        let timed = count(question.textKey, 'question')
        let longestReply = 0
        for (const a of question.answers) {
          timed += count(a.textKey, 'answer')
          if (a.replyKey) longestReply = Math.max(longestReply, count(a.replyKey, 'reply'))
        }
        if (timed > TEXT_BUDGETS.timedRead)
          issues.push({
            quest: q.id,
            budget: 'timedRead',
            where: question.textKey,
            words: timed,
            limit: TEXT_BUDGETS.timedRead,
          })
        timedWords = Math.max(timedWords, timed)
        words += timed + longestReply
      }
    }
  })
  if (words > TEXT_BUDGETS.quest)
    issues.push({ quest: q.id, budget: 'quest', where: q.id, words, limit: TEXT_BUDGETS.quest })
  const load: QuestTextLoad = {
    quest: q.id,
    location: q.location,
    words,
    readSec: Math.round(words / WORDS_PER_SEC),
    timedWords,
  }
  return { load, issues }
}

/** Text load of every quest plus all budget violations. */
export function textLoad(
  content: Content,
  texts: Record<string, string>,
): { quests: QuestTextLoad[]; issues: TextIssue[] } {
  const results = content.quests.map((q) => analyseQuest(q, texts))
  return { quests: results.map((r) => r.load), issues: results.flatMap((r) => r.issues) }
}
