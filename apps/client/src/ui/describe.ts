import { type Effect, formatNumber } from '@spin-doctor/shared'
import { t } from '../i18n'

/** Human-readable effect list for upgrade cards. */
export function describeEffects(effects: Effect[]): string[] {
  const out: string[] = []
  for (const e of effects) {
    switch (e.type) {
      case 'multiplier': {
        const value = formatNumber(e.value)
        if (e.target === 'tap') out.push(t('ui.effect.tap', { value }))
        else if (e.target === 'production') out.push(t('ui.effect.production', { value }))
        else if (e.target === 'scandal-detection') out.push(t('ui.effect.scandal'))
        else if (e.target.startsWith('generator:'))
          out.push(
            t('ui.effect.generator', { name: t(`generator.${e.target.slice(10)}.name`), value }),
          )
        else if (e.target === 'till-cap') out.push(t('ui.effect.tillCap', { value }))
        else if (e.target.startsWith('till-cap:'))
          out.push(
            t('ui.effect.tillCapAt', { name: t(`location.${e.target.slice(9)}.name`), value }),
          )
        else if (e.target.startsWith('location:'))
          out.push(
            t('ui.effect.location', { name: t(`location.${e.target.slice(9)}.name`), value }),
          )
        else if (e.target.startsWith('stat-gain:'))
          out.push(t('ui.effect.statGain', { name: t(`stat.${e.target.slice(10)}.name`), value }))
        break
      }
      case 'addStat':
        out.push(
          t('ui.effect.stat', {
            name: t(`stat.${e.stat}.name`),
            value: `${e.value > 0 ? '+' : '−'}${formatNumber(Math.abs(e.value))}`,
          }),
        )
        break
      case 'unlockLexicon':
        out.push(t('ui.effect.lexicon', { name: t(`lexicon.${e.card}.title`) }))
        break
      case 'productionSeconds':
        out.push(t('ui.effect.productionSeconds', { value: e.seconds }))
        break
      default:
        break
    }
  }
  return out
}
