import type { Content } from './content'
import { ensureDailies, updateDailies } from './dailies'
import {
  addCounter,
  addStat,
  applyDriftAndExpiry,
  applyEffects,
  applyQuality,
  distributeProduction,
  doBuyGenerator,
  doBuyUpgrade,
  doTap,
  productionPerSecond,
  tapValue,
  travelMut,
  updateHotspots,
} from './economy'
import {
  advanceMut,
  continueFramingMut,
  currentStep,
  isQuestAvailable,
  recordFramingAnswer,
  startQuestMut,
  updateQuests,
} from './quests'
import { updateRealityChecks } from './reality'
import { draft, type GameState } from './state'

/** Inputs from the outside world. The simulation never reads clocks itself. */
export interface TickContext {
  /** Wall-clock time in ms since epoch. */
  now: number
  /** Local calendar date 'YYYY-MM-DD' (for the midnight reset of dailies). */
  localDate: string
  /** Local hour 0–23 (location traits such as prime time). Defaults to 12. */
  localHour?: number
  /** Local weekday, 0 = Sunday … 6 = Saturday. Defaults to 1 (Monday). */
  localWeekday?: number
}

/**
 * Advances the simulation by `dtSec`. Pure and deterministic: same inputs, same output.
 * Events that happened during this call are in `result.events`.
 */
export function tick(
  state: GameState,
  content: Content,
  dtSec: number,
  ctx: TickContext,
): GameState {
  const s = draft(state)
  const dt = Math.max(0, dtSec)
  s.now = ctx.now
  s.clock = { hour: ctx.localHour ?? 12, weekday: ctx.localWeekday ?? 1 }
  distributeProduction(s, content, dt)
  applyDriftAndExpiry(s, content, dt)
  updateHotspots(s, content)
  ensureDailies(s, content, ctx.localDate)
  updateQuests(s, content)
  updateDailies(s, content)
  updateRealityChecks(s, content)
  return s
}

// ---------------------------------------------------------------------------
// Player actions — pure: they return a new state.
// ---------------------------------------------------------------------------

export function tap(state: GameState, content: Content): GameState {
  const s = draft(state)
  doTap(s, content)
  addCounter(s, 'statements')
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

export function buyGenerator(state: GameState, content: Content, id: string): GameState {
  const s = draft(state)
  if (doBuyGenerator(s, content, id)) {
    updateQuests(s, content)
    updateDailies(s, content)
  }
  return s
}

export function buyUpgrade(state: GameState, content: Content, id: string): GameState {
  const s = draft(state)
  if (doBuyUpgrade(s, content, id)) {
    updateQuests(s, content)
    updateDailies(s, content)
  }
  return s
}

/** Starts a manual quest (e.g. a minigame) from the quest tab. */
export function startQuest(state: GameState, content: Content, id: string): GameState {
  const s = draft(state)
  const q = content.quests.find((x) => x.id === id)
  if (q && q.trigger.type === 'manual' && isQuestAvailable(s, content, q))
    startQuestMut(s, content, q)
  return s
}

/** Continues a dialog step. `choice` is required when the step offers choices. */
export function answerDialog(
  state: GameState,
  content: Content,
  questId: string,
  choice?: number,
): GameState {
  const s = draft(state)
  const active = s.quests.active.find((a) => a.id === questId)
  const step = active && currentStep(content, active)
  if (step?.type !== 'dialog') return s
  if (step.choices?.length) {
    const picked = choice === undefined ? undefined : step.choices[choice]
    if (!picked) return s
    applyEffects(s, content, picked.effects)
    addCounter(s, 'dialog-choices')
  }
  advanceMut(s, content, questId)
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

/** Resolves a timed step (e.g. "Einordnen" tapped in time). */
export function resolveTimed(
  state: GameState,
  content: Content,
  questId: string,
  success: boolean,
): GameState {
  const s = draft(state)
  const active = s.quests.active.find((a) => a.id === questId)
  const step = active && currentStep(content, active)
  if (!active || !step || step.type !== 'timed') return s
  const inTime = s.now - active.stepStartedAt <= step.timeoutSec * 1000
  applyEffects(s, content, success && inTime ? step.success : step.failure)
  if (success && inTime) addCounter(s, `handled-${step.handler}`)
  advanceMut(s, content, questId)
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

/** Ends a minigame step with the achieved score; reward scales with the score. */
export function finishMinigame(
  state: GameState,
  content: Content,
  questId: string,
  score: number,
): GameState {
  const s = draft(state)
  const active = s.quests.active.find((a) => a.id === questId)
  const step = active && currentStep(content, active)
  if (step?.type !== 'minigame') return s
  const points = Math.max(0, Math.floor(score))
  const perSecond = Math.max(productionPerSecond(s, content), tapValue(s, content))
  addStat(s, content, content.currency, points * step.productionSecondsPerPoint * perSecond)
  applyEffects(s, content, step.effects)
  if (step.qualityEffects.length) applyQuality(s, content, questId, step.qualityEffects, points)
  addCounter(s, `played-${step.handler}`)
  addCounter(s, 'minigame-points', points)
  advanceMut(s, content, questId)
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

/** Walks/flies to another unlocked location and collects its till. */
export function travel(state: GameState, content: Content, locationId: string): GameState {
  const s = draft(state)
  if (travelMut(s, content, locationId)) {
    updateQuests(s, content)
    updateDailies(s, content)
  }
  return s
}

/** The player opened the city map (drives the map tutorial and statistics). */
export function openMap(state: GameState, content: Content): GameState {
  const s = draft(state)
  addCounter(s, 'map-opened')
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

/** Starts the clock of a framing duel (after the player has read the intro). */
export function startFraming(state: GameState, content: Content, questId: string): GameState {
  const s = draft(state)
  const active = s.quests.active.find((a) => a.id === questId)
  const step = active && currentStep(content, active)
  if (!active || step?.type !== 'framing' || active.started) return s
  active.started = true
  active.scores = []
  active.stepStartedAt = s.now
  return s
}

/** Answers the current framing question; `null` means the time ran out. */
export function answerFraming(
  state: GameState,
  content: Content,
  questId: string,
  answer: number | null,
): GameState {
  const s = draft(state)
  const active = s.quests.active.find((a) => a.id === questId)
  const step = active && currentStep(content, active)
  if (!active || step?.type !== 'framing' || !active.started || active.showingReply) return s
  const late = s.now - active.stepStartedAt > step.timePerQuestionSec * 1000
  recordFramingAnswer(s, content, active, step, late ? null : answer)
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

/** The player has read the press reply: next question, or the duel's result. */
export function continueFraming(state: GameState, content: Content, questId: string): GameState {
  const s = draft(state)
  const active = s.quests.active.find((a) => a.id === questId)
  const step = active && currentStep(content, active)
  if (!active || step?.type !== 'framing') return s
  continueFramingMut(s, content, active, step)
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

/** Closes an ending screen. */
export function acknowledgeEnding(state: GameState, content: Content, questId: string): GameState {
  const s = draft(state)
  const active = s.quests.active.find((a) => a.id === questId)
  const step = active && currentStep(content, active)
  if (step?.type !== 'ending') return s
  applyEffects(s, content, step.effects)
  advanceMut(s, content, questId)
  updateQuests(s, content)
  updateDailies(s, content)
  return s
}

export function updateSettings(
  state: GameState,
  patch: Partial<GameState['settings']> & { playerName?: string },
): GameState {
  const s = draft(state)
  const { playerName, ...settings } = patch
  s.settings = { ...s.settings, ...settings }
  if (playerName !== undefined) s.playerName = playerName.slice(0, 40)
  return s
}

/** Debug/testing helper: starts any quest regardless of trigger and conditions. */
export function debugStartQuest(state: GameState, content: Content, id: string): GameState {
  const s = draft(state)
  const q = content.quests.find((x) => x.id === id)
  if (q && !s.quests.active.some((a) => a.id === id)) startQuestMut(s, content, q)
  return s
}
