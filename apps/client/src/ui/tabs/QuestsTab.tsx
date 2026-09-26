import {
  currentStep,
  dailyProgress,
  formatDuration,
  isQuestAvailable,
  startQuest,
} from '@spin-doctor/shared'
import { content } from '../../content'
import { t } from '../../i18n'
import { dispatch } from '../../store'
import { useGame } from '../hooks'

export function QuestsTab() {
  const state = useGame()
  const active = state.quests.active
    .map((a) => ({ a, q: content.quests.find((q) => q.id === a.id)! }))
    .filter(({ q }) => q && (q.category === 'story' || q.category === 'side'))
  const minigames = content.quests.filter((q) => q.trigger.type === 'manual')
  const acts = [...new Set(content.quests.filter((q) => q.act).map((q) => q.act!))]
  const finishedActs = acts.filter((act) =>
    content.quests.filter((q) => q.act === act).every((q) => state.quests.completed.includes(q.id)),
  )
  return (
    <div class="quests">
      <h2>{t('ui.quests.story')}</h2>
      {active.length === 0 && finishedActs.length === 0 && (
        <p class="empty">{t('ui.quests.none')}</p>
      )}
      <ul class="list">
        {active.map(({ a, q }) => {
          const step = currentStep(content, a)
          return (
            <li class="card" key={q.id}>
              <div class="card-body">
                <div class="card-title">
                  {q.act ? `${t('ui.quests.act', { act: q.act })} · ` : ''}
                  {t(q.titleKey)}
                </div>
                <div class="card-flavor">
                  {step?.type === 'objective' ? t(step.textKey) : t('ui.quests.continue')}
                </div>
                <progress max={q.steps.length} value={a.step} />
              </div>
            </li>
          )
        })}
        {finishedActs.map((act) => (
          <li class="card card-done" key={act}>
            <div class="card-body">
              <div class="card-title">✅ {t('ui.quests.act', { act })}</div>
              <div class="card-flavor">{t('ui.quests.storyDone')}</div>
            </div>
          </li>
        ))}
      </ul>

      <h2>{t('ui.quests.minigames')}</h2>
      <ul class="list">
        {minigames.map((q) => {
          const available = isQuestAvailable(state, content, q)
          const cooldown = (state.quests.cooldowns[q.id] ?? 0) - state.now
          return (
            <li class="card" key={q.id}>
              <div class="card-icon" aria-hidden="true">
                🗞️
              </div>
              <div class="card-body">
                <div class="card-title">{t(q.titleKey)}</div>
                <div class="card-flavor">{t('ui.swipe.help')}</div>
              </div>
              <button
                type="button"
                class="btn btn-buy"
                disabled={!available}
                onClick={() => dispatch((s) => startQuest(s, content, q.id))}
              >
                {cooldown > 0
                  ? t('ui.quests.cooldown', { time: formatDuration(cooldown / 1000) })
                  : t('ui.quests.play')}
              </button>
            </li>
          )
        })}
      </ul>

      <h2>
        {t('ui.quests.dailies')}{' '}
        <span class="badge">🔥 {t('ui.quests.streak', { count: state.dailies.streak })}</span>
      </h2>
      <ul class="list">
        {state.dailies.ids.map((id) => {
          const def = content.dailies.find((d) => d.id === id)
          if (!def) return null
          const done = state.dailies.claimed.includes(id)
          const progress = dailyProgress(state, def)
          return (
            <li class={`card ${done ? 'card-done' : ''}`} key={id}>
              <div class="card-body">
                <div class="card-title">
                  {done ? '✅ ' : ''}
                  {t(def.textKey)}
                </div>
                <progress max={def.target} value={progress} />
                <div class="card-meta">
                  {done ? t('ui.quests.done') : `${Math.floor(progress)} / ${def.target}`}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
