import { formatDuration, formatNumber, locationRate } from '@spin-doctor/shared'
import { useEffect, useRef, useState } from 'preact/hooks'
import { content } from '../content'
import { t } from '../i18n'
import { AssetIcon } from './AssetIcon'
import { useGame } from './hooks'

/** Counts smoothly towards the real value, so collected tills visibly tick up. */
function useCountUp(target: number): number {
  const [shown, setShown] = useState(target)
  const ref = useRef(target)
  useEffect(() => {
    let raf = 0
    const step = () => {
      const diff = target - ref.current
      if (Math.abs(diff) < Math.max(0.5, Math.abs(target) * 1e-4) || diff < 0) {
        ref.current = target
      } else {
        ref.current += diff * 0.18
        raf = requestAnimationFrame(step)
      }
      setShown(ref.current)
    }
    step()
    return () => cancelAnimationFrame(raf)
  }, [target])
  return shown
}

export function Hud() {
  const state = useGame()
  const currency = content.stats.find((s) => s.id === content.currency)!
  const others = content.stats.filter((s) => s.id !== content.currency && s.display !== 'hidden')
  const spin = useCountUp(state.stats[currency.id] ?? 0)
  return (
    <header class="hud">
      <div class="hud-main">
        <div class="hud-spin" aria-live="off">
          <AssetIcon
            class="hud-emoji"
            path={`icons/stat-${currency.id}.png`}
            emoji={currency.emoji ?? ''}
          />
          <strong>{formatNumber(spin)}</strong>
          <span class="hud-label">{t(`stat.${currency.id}.name`)}</span>
        </div>
        <div class="hud-rate">
          {t('ui.perSecond', { value: formatNumber(locationRate(state, content, state.location)) })}
        </div>
      </div>
      <div class="hud-stats">
        {others.map((s) => {
          const v = state.stats[s.id] ?? 0
          if (s.display === 'bar') {
            const pct = Math.max(0, Math.min(100, v))
            return (
              <div class="meter" key={s.id} title={t(`stat.${s.id}.name`)}>
                <span class="meter-label">
                  <AssetIcon
                    class="chip-icon"
                    path={`icons/stat-${s.id}.png`}
                    emoji={s.emoji ?? ''}
                  />
                  {t(`stat.${s.id}.name`)} <b>{Math.round(v)}</b>
                </span>
                {/* biome-ignore lint/a11y/useSemanticElements: <meter> cannot be styled as a crumbling bar */}
                <div
                  class="crumble"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(v)}
                  aria-label={t(`stat.${s.id}.name`)}
                  style={{ '--pct': `${pct}%`, '--damage': String(1 - pct / 100) }}
                >
                  <div class="crumble-fill" />
                </div>
              </div>
            )
          }
          return (
            <div class="chip" key={s.id}>
              <AssetIcon class="chip-icon" path={`icons/stat-${s.id}.png`} emoji={s.emoji ?? ''} />
              {t(`stat.${s.id}.name`)}{' '}
              <b>{s.display === 'percent' ? `${Math.round(v)} %` : formatNumber(v)}</b>
            </div>
          )
        })}
        {state.modifiers
          .filter((m) => m.until > state.now)
          .map((m) => (
            <div class="chip chip-bad" key={m.id}>
              {t(m.labelKey)} · {formatDuration((m.until - state.now) / 1000)}
            </div>
          ))}
      </div>
    </header>
  )
}
