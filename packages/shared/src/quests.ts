import { check } from './conditions'
import type { Content } from './content'
import { addCounter, addStat, applyEffects, applyQuality, productionPerSecond } from './economy'
import type { QuestDef, Step } from './schema'
import { type ActiveQuest, type GameState, random } from './state'

/** Steps that need the player's attention (a modal). Only one runs at a time. */
export function isInteractive(step: Step | undefined): boolean {
  return !!step && step.type !== 'objective'
}

export function currentStep(content: Content, active: ActiveQuest): Step | undefined {
  return content.quests.find((q) => q.id === active.id)?.steps[active.step]
}

/** The quest whose interactive step should be shown now (story first). */
export function focusedQuest(
  state: GameState,
  content: Content,
): { quest: QuestDef; active: ActiveQuest; step: Step } | null {
  for (const active of state.quests.active) {
    const quest = content.quests.find((q) => q.id === active.id)
    const step = quest?.steps[active.step]
    if (quest && step && isInteractive(step)) return { quest, active, step }
  }
  return null
}

function hasInteractive(state: GameState, content: Content): boolean {
  return focusedQuest(state, content) !== null
}

export function isQuestAvailable(state: GameState, content: Content, q: QuestDef): boolean {
  if (state.quests.active.some((a) => a.id === q.id)) return false
  if (q.location && q.location !== state.location) return false
  if (!q.repeatable && state.quests.completed.includes(q.id)) return false
  if ((state.quests.cooldowns[q.id] ?? 0) > state.now) return false
  return check(state, content, q.conditions)
}

function enterStep(state: GameState, content: Content, active: ActiveQuest): void {
  active.stepStartedAt = state.now
  active.entry = undefined
  active.scores = undefined
  active.started = undefined
  const step = currentStep(content, active)
  if (step?.type === 'timed' && step.pool) {
    const pool = content.pools.find((p) => p.id === step.pool)
    if (pool) active.entry = pool.entries[Math.floor(random(state) * pool.entries.length)]?.key
  }
}

export function startQuestMut(state: GameState, content: Content, q: QuestDef): void {
  const active: ActiveQuest = { id: q.id, step: 0, stepStartedAt: state.now }
  // Story quests go first so the onboarding is never blocked by side content.
  if (q.category === 'story') state.quests.active.unshift(active)
  else state.quests.active.push(active)
  enterStep(state, content, active)
  state.events.push({ type: 'quest-started', quest: q.id })
}

function completeQuest(state: GameState, content: Content, q: QuestDef): void {
  state.quests.active = state.quests.active.filter((a) => a.id !== q.id)
  if (!state.quests.completed.includes(q.id)) state.quests.completed.push(q.id)
  addCounter(state, `quest-${q.id}`)
  addCounter(state, 'quests-completed')
  if (q.trigger.type === 'manual' && q.trigger.cooldownSec > 0)
    state.quests.cooldowns[q.id] = state.now + q.trigger.cooldownSec * 1000
  applyEffects(state, content, q.rewards)
  state.events.push({ type: 'quest-completed', quest: q.id })
}

export function advanceMut(state: GameState, content: Content, questId: string): void {
  const active = state.quests.active.find((a) => a.id === questId)
  const q = content.quests.find((x) => x.id === questId)
  if (!active || !q) return
  active.step += 1
  if (active.step >= q.steps.length) completeQuest(state, content, q)
  else enterStep(state, content, active)
}

function scheduleRandom(state: GameState, q: QuestDef): void {
  if (q.trigger.type !== 'random') return
  const { minSec, maxSec } = q.trigger
  state.quests.schedule[q.id] = state.now + (minSec + random(state) * (maxSec - minSec)) * 1000
}

/** Called every tick: starts auto/random quests, completes objectives, times out timed steps. */
export function updateQuests(state: GameState, content: Content): void {
  for (const q of content.quests) {
    if (q.trigger.type === 'auto' && isQuestAvailable(state, content, q)) {
      startQuestMut(state, content, q)
    } else if (q.trigger.type === 'random') {
      const at = state.quests.schedule[q.id]
      if (at === undefined) scheduleRandom(state, q)
      else if (state.now >= at) {
        if (isQuestAvailable(state, content, q) && !hasInteractive(state, content)) {
          startQuestMut(state, content, q)
          scheduleRandom(state, q)
        } else {
          // Busy or not yet unlocked: retry soon instead of stacking modals.
          state.quests.schedule[q.id] = state.now + 30_000
        }
      }
    }
  }

  for (const active of [...state.quests.active]) {
    const step = currentStep(content, active)
    if (!step) continue
    if (step.type === 'objective' && check(state, content, step.condition)) {
      advanceMut(state, content, active.id)
    } else if (
      step.type === 'timed' &&
      state.now - active.stepStartedAt >= step.timeoutSec * 1000
    ) {
      applyEffects(state, content, step.failure)
      advanceMut(state, content, active.id)
    } else if (step.type === 'framing' && active.started) {
      // Unanswered questions count as a failed spin once their time is up.
      const stepIndex = active.step
      while (
        active.step === stepIndex &&
        active.started &&
        (active.scores?.length ?? 0) < step.questions.length &&
        state.now - active.stepStartedAt >= step.timePerQuestionSec * 1000
      ) {
        recordFramingAnswer(state, content, active, step, null)
      }
    }
  }
}

type FramingStep = Extract<Step, { type: 'framing' }>

/**
 * Mutating helper: records one framing answer (`null` = timed out). After the last
 * question, rewards and the spin-quality tier are applied and the quest advances.
 */
export function recordFramingAnswer(
  state: GameState,
  content: Content,
  active: ActiveQuest,
  step: FramingStep,
  answer: number | null,
): void {
  const scores = active.scores ?? []
  const question = step.questions[scores.length]
  if (!question) return
  const picked = answer === null ? undefined : question.answers[answer]
  scores.push(picked?.score ?? 0)
  active.scores = scores
  if (picked) applyEffects(state, content, picked.effects)
  const questionEnd = active.stepStartedAt + step.timePerQuestionSec * 1000
  active.stepStartedAt = answer === null ? questionEnd : state.now
  if (scores.length < step.questions.length) return

  const total = scores.reduce((a, b) => a + b, 0)
  const average = total / step.questions.length
  addStat(
    state,
    content,
    content.currency,
    total * step.productionSecondsPerPoint * productionPerSecond(state, content),
  )
  addCounter(state, 'framings')
  if (average >= 0.8) addCounter(state, 'framings-perfect')
  applyQuality(state, content, active.id, step.qualityEffects, average)
  advanceMut(state, content, active.id)
}
