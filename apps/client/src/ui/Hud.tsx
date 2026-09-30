import {
  check,
  formatDuration,
  formatFull,
  formatNumber,
  type GameState,
  locationRate,
} from '@spin-doctor/shared'
import { useEffect, useRef, useState } from 'preact/hooks'
import { content } from '../content'
import { has, t } from '../i18n'
import { AssetIcon } from './AssetIcon'
import { useGame } from './hooks'
import { explainStat } from './StatExplainer'

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
  const others = content.stats.filter(
    (s) => s.id !== content.currency && s.display !== 'hidden' && check(state, content, s.visible),
  )
  const spin = useCountUp(state.stats[currency.id] ?? 0)
  // Every digit is shown; long numbers shrink so they still fit on a phone.
  const spinText = formatFull(spin)
  const spinSize = `min(34px, ${Math.min(8, 100 / spinText.length).toFixed(2)}vw)`
  return (
    <header class="hud">
      <div class="hud-main">
        <button
          type="button"
          class="hud-spin hud-button"
          aria-live="off"
          aria-label={t('ui.explain.open', { name: t(`stat.${currency.id}.name`) })}
          onClick={() => explainStat(currency.id)}
        >
          <AssetIcon
            class="hud-emoji"
            path={`icons/stat-${currency.id}.png`}
            emoji={currency.emoji ?? ''}
          />
          <strong style={{ fontSize: spinSize }}>{spinText}</strong>
        </button>
        <div class="hud-unit">
          <span class="hud-label">{t(`stat.${currency.id}.name`)}</span>
          <span class="hud-rate">
            {t('ui.perSecondShort', {
              value: formatNumber(locationRate(state, content, state.location)),
            })}
          </span>
        </div>
      </div>
      <div class="hud-stats">
        {others.map((s) => {
          const v = state.stats[s.id] ?? 0
          const bar = s.display === 'bar'
          const pct = Math.max(0, Math.min(100, v))
          return (
            <button
              type="button"
              class={`stat hud-button ${bar ? 'stat-bar' : ''}`}
              key={s.id}
              aria-label={t('ui.explain.open', { name: t(`stat.${s.id}.name`) })}
              onClick={() => explainStat(s.id)}
            >
              <AssetIcon class="chip-icon" path={`icons/stat-${s.id}.png`} emoji={s.emoji ?? ''} />
              <span class="stat-label">{statLabel(s.id)}</span>
              <b>
                {s.display === 'percent'
                  ? `${Math.round(v)} %`
                  : bar
                    ? Math.round(v)
                    : formatNumber(v)}
              </b>
              {bar && (
                // biome-ignore lint/a11y/useSemanticElements: <meter> cannot be styled as a crumbling bar
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
              )}
            </button>
          )
        })}
      </div>
      {/* Timed effects float over the scene, so they never change the HUD height. */}
      <div class="hud-mods">
        {groupModifiers(state.modifiers.filter((m) => m.until > state.now)).map((g) => (
          <div class={`chip ${g.good ? 'chip-good' : 'chip-bad'}`} key={`${g.labelKey}:${g.good}`}>
            {t(g.labelKey)}
            {g.count > 1 ? ` ×${g.count}` : ''} · {formatDuration((g.until - state.now) / 1000)}
          </div>
        ))}
      </div>
    </header>
  )
}

/** The HUD grid is narrow: a stat may bring a short name (`stat.<id>.short`). */
function statLabel(id: string): string {
  return has(`stat.${id}.short`) ? t(`stat.${id}.short`) : t(`stat.${id}.name`)
}

/** Same label (e.g. several „ruhig“ news situations) → one chip with a count. */
function groupModifiers(mods: GameState['modifiers']) {
  const groups = new Map<
    string,
    { labelKey: string; count: number; until: number; good: boolean }
  >()
  for (const m of mods) {
    const good = m.effects.every((e) => e.value >= 1)
    const key = `${m.labelKey}:${good}`
    const g = groups.get(key)
    if (g) {
      g.count += 1
      g.until = Math.max(g.until, m.until)
    } else groups.set(key, { labelKey: m.labelKey, count: 1, until: m.until, good })
  }
  return [...groups.values()]
}
