import { answerDialog, type Step } from '@spin-doctor/shared'
import { useEffect, useState } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, prefersReducedMotion } from '../../juice/audio'
import { dispatch, getState } from '../../store'
import { useAsset } from '../hooks'
import type { StepViewProps } from './types'

type DialogStep = Extract<Step, { type: 'dialog' }>

function speakerName(id: string): string {
  if (id === 'you') return getState().playerName || t('speaker.you')
  const sp = content.speakers.find((s) => s.id === id)
  return sp ? t(sp.nameKey) : id
}

function Portrait({ id }: { id: string }) {
  const hasArt = useAsset(`portraits/${id}.png`)
  const color = content.speakers.find((s) => s.id === id)?.color ?? '#888'
  if (hasArt) return <img class="portrait" src={`assets/portraits/${id}.png`} alt="" />
  return (
    <div class="portrait" style={{ background: color }} aria-hidden="true">
      {speakerName(id)
        .replace(/^(Dr\.|Präsident)\s+/, '')
        .slice(0, 1)}
    </div>
  )
}

/** Types text letter by letter; tapping completes it instantly. */
function useTyping(text: string, onDone: () => void): [string, () => void] {
  const instant = prefersReducedMotion() || getState().settings.reducedMotion
  const [n, setN] = useState(instant ? text.length : 0)
  useEffect(() => {
    if (n >= text.length) {
      onDone()
      return
    }
    const id = setTimeout(() => {
      setN((x) => Math.min(text.length, x + 2))
      if (n % 8 === 0) play('typing')
    }, 28)
    return () => clearTimeout(id)
  }, [n, text])
  return [text.slice(0, n), () => setN(text.length)]
}

function Bubble({
  speaker,
  text,
  onDone,
  mine,
}: {
  speaker: string
  text: string
  onDone: () => void
  mine?: boolean
}) {
  const [shown, skip] = useTyping(text, onDone)
  return (
    <div class={`bubble-row ${mine ? 'bubble-mine' : ''}`}>
      <Portrait id={speaker} />
      <div class="bubble" onClick={skip}>
        <div class="bubble-name">{speakerName(speaker)}</div>
        <div class="bubble-text">
          {shown}
          <span class="sr-only">{text.slice(shown.length)}</span>
        </div>
      </div>
    </div>
  )
}

export function DialogView({ quest, step }: StepViewProps<DialogStep>) {
  const [line, setLine] = useState(0)
  const [typed, setTyped] = useState(false)
  const [choice, setChoice] = useState<number | null>(null)
  const [replyTyped, setReplyTyped] = useState(false)
  const lines = step.lines.slice(0, line + 1)
  const lastLine = line === step.lines.length - 1
  const picked = choice === null ? undefined : step.choices?.[choice]
  // Replies to the player's own statement come from the press corps.
  const replySpeaker = step.speaker === 'you' ? 'frieda' : step.speaker

  const next = () => {
    if (!lastLine) {
      setLine(line + 1)
      setTyped(false)
      return
    }
    dispatch((s) => answerDialog(s, content, quest.id, choice ?? undefined))
  }

  return (
    <div class="modal-backdrop">
      <div class="modal dialog" role="dialog" aria-modal="true" aria-label={t(quest.titleKey)}>
        <div class="modal-title">{t(quest.titleKey)}</div>
        <div class="bubbles">
          {lines.map((key, i) => (
            <Bubble
              key={key}
              speaker={step.speaker}
              mine={step.speaker === 'you'}
              text={t(key)}
              onDone={() => i === line && setTyped(true)}
            />
          ))}
          {picked && (
            <>
              <div class="bubble-row bubble-mine">
                <div class="bubble bubble-choice">{t(picked.textKey)}</div>
              </div>
              {picked.replyKey && (
                <Bubble
                  speaker={replySpeaker}
                  text={t(picked.replyKey)}
                  onDone={() => setReplyTyped(true)}
                />
              )}
            </>
          )}
        </div>
        <div class="dialog-actions">
          {typed && lastLine && step.choices?.length && choice === null
            ? step.choices.map((c, i) => (
                <button
                  key={c.textKey}
                  type="button"
                  class="btn btn-choice"
                  onClick={() => setChoice(i)}
                >
                  {t(c.textKey)}
                </button>
              ))
            : typed &&
              (!picked?.replyKey || replyTyped) && (
                <button type="button" class="btn btn-primary" onClick={next}>
                  {t('ui.dialog.continue')}
                </button>
              )}
        </div>
      </div>
    </div>
  )
}
