import type { ActiveQuest, QuestDef, Step } from '@spin-doctor/shared'

export interface StepViewProps<S extends Step = Step> {
  quest: QuestDef
  active: ActiveQuest
  step: S
}
