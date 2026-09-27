import { focusedQuest } from '@spin-doctor/shared'
import type { ComponentType } from 'preact'
import { content } from '../../content'
import { useGame } from '../hooks'
import { DialogView } from './DialogView'
import { EndingView } from './EndingView'
import { FramingView } from './FramingView'
import { HeadlineSwipe } from './HeadlineSwipe'
import { PresidentPost } from './PresidentPost'
import type { StepViewProps } from './types'
import { ZollTafel } from './ZollTafel'

/**
 * Handler registry: quest steps of type `minigame`/`timed` name a handler id.
 * New quests reuse these; a new handler needs a component here and an entry in
 * KNOWN_HANDLERS (packages/shared/src/content.ts).
 */
// biome-ignore lint/suspicious/noExplicitAny: each handler narrows the step type itself
const HANDLERS: Record<string, ComponentType<StepViewProps<any>>> = {
  'president-post': PresidentPost,
  'headline-swipe': HeadlineSwipe,
  'zoll-tafel': ZollTafel,
}

export function QuestModal() {
  const state = useGame()
  const focus = focusedQuest(state, content)
  if (!focus) return null
  const { quest, active, step } = focus
  const key = `${quest.id}:${active.step}:${active.stepStartedAt}`
  if (step.type === 'dialog')
    return <DialogView key={key} quest={quest} active={active} step={step} />
  if (step.type === 'framing')
    return <FramingView key={key} quest={quest} active={active} step={step} />
  if (step.type === 'ending')
    return <EndingView key={key} quest={quest} active={active} step={step} />
  if (step.type === 'minigame' || step.type === 'timed') {
    const View = HANDLERS[step.handler]
    return View ? <View key={key} quest={quest} active={active} step={step} /> : null
  }
  return null
}
