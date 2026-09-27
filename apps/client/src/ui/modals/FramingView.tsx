import { answerFraming, type Step, startFraming } from '@spin-doctor/shared'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch } from '../../store'
import { useGame } from '../hooks'
import { Portrait, speakerName } from './DialogView'
import type { StepViewProps } from './types'

type FramingStep = Extract<Step, { type: 'framing' }>

interface Feedback {
  key: number
  reply?: string | undefined
  score: number
}

function verdict(score: number): { text: string; cls: string } {
  if (score >= 0.75) return { text: t('ui.framing.good'), cls: 'verdict-good' }
  if (score >= 0.35) return { text: t('ui.framing.meh'), cls: 'verdict-meh' }
  return { text: t('ui.framing.bad'), cls: 'verdict-bad' }
}

/**
 * Framing duel: the press asks, you pick a spin before the time runs out.
 * The engine owns the clock (timeouts count as failed spin); the result stamp
 * is shown globally from the `quality` event.
 */
export function FramingView({ quest, active, step }: StepViewProps<FramingStep>) {
  const state = useGame()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const speaker = step.speaker ?? 'frieda'
  const index = active.scores?.length ?? 0
  const question = step.questions[index]
  const scores = active.scores ?? []
  const credibility = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
    : null
  const total = step.timePerQuestionSec * 1000
  // During the reading pause the clock has not started yet (start lies in the future).
  const wait = Math.max(0, active.stepStartedAt - state.now)
  const remaining = Math.min(total, Math.max(0, total - (state.now - active.stepStartedAt)))
  // Fix the bar's timing once per question; changing it mid-animation would distort it.
  const timing = useMemo(() => ({ remaining, wait }), [index, active.started])

  // A timed-out question shows up as a new score of 0.
  const [seen, setSeen] = useState(index)
  useEffect(() => {
    if (index > seen && !feedback) {
      const last = scores[scores.length - 1] ?? 0
      if (last === 0) {
        play('fail')
        setFeedback({ key: index, score: 0, reply: t('ui.framing.timeout') })
      }
    }
    setSeen(index)
  }, [index])

  useEffect(() => {
    if (!feedback) return
    const id = setTimeout(() => setFeedback(null), 1600)
    return () => clearTimeout(id)
  }, [feedback])

  const answer = (i: number) => {
    const picked = question?.answers[i]
    if (!picked) return
    const score = picked.score
    play(score >= 0.75 ? 'success' : score >= 0.35 ? 'typing' : 'fail')
    vibrate(score >= 0.75 ? 10 : 30)
    setFeedback({
      key: index + 1,
      score,
      reply: picked.replyKey ? t(picked.replyKey) : undefined,
    })
    setSeen(index + 1)
    dispatch((s) => answerFraming(s, content, quest.id, i))
  }

  return (
    <div class="modal-backdrop">
      <div class="modal framing" role="dialog" aria-modal="true" aria-label={t(quest.titleKey)}>
        <div class="modal-title">🎤 {t(quest.titleKey)}</div>

        {!active.started ? (
          <>
            <div class="bubble-row">
              <Portrait id={speaker} />
              <div class="bubble">
                <div class="bubble-name">{speakerName(speaker)}</div>
                <div class="bubble-text">
                  {step.introKey ? t(step.introKey) : t('ui.framing.help')}
                </div>
              </div>
            </div>
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
        ) : (
          question && (
            <>
              <div class="framing-hud">
                <span>
                  {t('ui.framing.question', { n: index + 1, total: step.questions.length })}
                </span>
                {credibility !== null && (
                  <span>{t('ui.framing.credibility', { value: credibility })}</span>
                )}
              </div>
              {feedback && (
                <div class={`framing-feedback ${verdict(feedback.score).cls}`} key={feedback.key}>
                  <b>{verdict(feedback.score).text}</b>
                  {feedback.reply && <span> {feedback.reply}</span>}
                </div>
              )}
              <div class="bubble-row" key={`q${index}`}>
                <Portrait id={speaker} />
                <div class="bubble">
                  <div class="bubble-name">{speakerName(speaker)}</div>
                  <div class="bubble-text">{t(question.textKey)}</div>
                </div>
              </div>
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
                  <button
                    key={a.textKey}
                    type="button"
                    class="btn btn-choice"
                    onClick={() => answer(i)}
                  >
                    {t(a.textKey)}
                  </button>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}
