import { answerFraming, continueFraming, type Step, startFraming } from '@spin-doctor/shared'
import { useEffect, useMemo } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch } from '../../store'
import { useGame } from '../hooks'
import { Portrait, speakerName } from './DialogView'
import type { StepViewProps } from './types'

type FramingStep = Extract<Step, { type: 'framing' }>

function verdict(score: number): { text: string; cls: string } {
  if (score >= 0.75) return { text: t('ui.framing.good'), cls: 'verdict-good' }
  if (score >= 0.35) return { text: t('ui.framing.meh'), cls: 'verdict-meh' }
  return { text: t('ui.framing.bad'), cls: 'verdict-bad' }
}

function PressBubble({ speaker, text }: { speaker: string; text: string }) {
  return (
    <div class="bubble-row">
      <Portrait id={speaker} />
      <div class="bubble">
        <div class="bubble-name">{speakerName(speaker)}</div>
        <div class="bubble-text">{text}</div>
      </div>
    </div>
  )
}

/**
 * Framing duel: the press asks, you pick a spin before the time runs out.
 * The engine owns the clock (timeouts count as failed spin). After each answer the
 * press reply stays until the player continues; the result stamp is shown globally
 * from the `quality` event.
 */
export function FramingView({ quest, active, step }: StepViewProps<FramingStep>) {
  const state = useGame()
  const speaker = step.speaker ?? 'frieda'
  const scores = active.scores ?? []
  const index = scores.length
  const question = step.questions[index]
  const credibility = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
    : null
  const total = step.timePerQuestionSec * 1000
  // During the reading pause the clock has not started yet (start lies in the future).
  const wait = Math.max(0, active.stepStartedAt - state.now)
  const remaining = Math.min(total, Math.max(0, total - (state.now - active.stepStartedAt)))
  // Fix the bar's timing once per question; changing it mid-animation would distort it.
  const timing = useMemo(() => ({ remaining, wait }), [index, active.started, active.showingReply])

  // Timeouts come from the engine clock, so their sound is played here.
  const lastAnswer = active.answers?.[index - 1]
  useEffect(() => {
    if (active.showingReply && lastAnswer === null) play('fail')
  }, [active.showingReply, index])

  const answer = (i: number) => {
    const picked = question?.answers[i]
    if (!picked) return
    play(picked.score >= 0.75 ? 'success' : picked.score >= 0.35 ? 'typing' : 'fail')
    vibrate(picked.score >= 0.75 ? 10 : 30)
    dispatch((s) => answerFraming(s, content, quest.id, i))
  }

  const hud = (n: number) => (
    <div class="framing-hud">
      <span>{t('ui.framing.question', { n, total: step.questions.length })}</span>
      {credibility !== null && <span>{t('ui.framing.credibility', { value: credibility })}</span>}
    </div>
  )

  let body = null
  if (!active.started) {
    body = (
      <>
        {step.introKey && <PressBubble speaker={speaker} text={t(step.introKey)} />}
        <p class="card-flavor">{t('ui.framing.help')}</p>
        <button
          type="button"
          class="btn btn-primary btn-big"
          onClick={() => {
            play('notify')
            dispatch((s) => startFraming(s, content, quest.id))
          }}
        >
          🎙️ {t('ui.framing.start')}
        </button>
      </>
    )
  } else if (active.showingReply) {
    const asked = step.questions[index - 1]
    const picked = lastAnswer == null ? undefined : asked?.answers[lastAnswer]
    const v = verdict(scores[index - 1] ?? 0)
    const reply = picked ? (picked.replyKey ? t(picked.replyKey) : null) : t('ui.framing.timeout')
    body = (
      <>
        {hud(index)}
        {asked && <PressBubble speaker={speaker} text={t(asked.textKey)} />}
        {picked && (
          <div class="bubble-row bubble-mine">
            <div class="bubble bubble-choice">{t(picked.textKey)}</div>
          </div>
        )}
        <div class={`framing-feedback ${v.cls}`}>
          <b>{v.text}</b>
        </div>
        {reply && <PressBubble speaker={speaker} text={reply} />}
        <div class="dialog-actions">
          <button
            type="button"
            class="btn btn-primary"
            onClick={() => dispatch((s) => continueFraming(s, content, quest.id))}
          >
            {t('ui.dialog.continue')}
          </button>
        </div>
      </>
    )
  } else if (question) {
    body = (
      <>
        {hud(index + 1)}
        <PressBubble key={`q${index}`} speaker={speaker} text={t(question.textKey)} />
        <div class="countdown" aria-hidden="true">
          <div
            class="countdown-fill"
            key={`c${index}`}
            style={{
              animationDuration: `${timing.remaining}ms`,
              animationDelay: `${timing.wait}ms`,
            }}
          />
        </div>
        <div class="dialog-actions">
          {question.answers.map((a, i) => (
            <button key={a.textKey} type="button" class="btn btn-choice" onClick={() => answer(i)}>
              {t(a.textKey)}
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <div class="modal-backdrop">
      <div class="modal framing" role="dialog" aria-modal="true" aria-label={t(quest.titleKey)}>
        <div class="modal-title">🎤 {t(quest.titleKey)}</div>
        {body}
      </div>
    </div>
  )
}
