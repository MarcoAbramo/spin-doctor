import { registerSW } from 'virtual:pwa-register'
import { render } from 'preact'
import { content } from './content'
import { t } from './i18n'
import { play, setSoundEnabled, setVibrationEnabled, vibrate } from './juice/audio'
import { getState, onGameEvent, startGame, subscribe } from './store'
import { App } from './ui/App'
import { openReality } from './ui/modals/RealityCard'
import { locationName, scene, world } from './ui/SceneView'
import { pushToast } from './ui/toast-store'
import { setTransitionReducedMotion, stamp } from './ui/transitions'
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/700.css'
import './ui/styles.css'

startGame()

// Game events → juice & toasts. The simulation stays unaware of any of this.
onGameEvent((e) => {
  switch (e.type) {
    case 'milestone':
      play('milestone')
      vibrate([20, 40, 20])
      scene.current?.confetti()
      pushToast(
        t('ui.toast.milestone', { name: t(`generator.${e.generator}.name`), count: e.count }),
        'good',
      )
      break
    case 'scandal':
      if (e.noticed) {
        play('scandal')
        vibrate([60, 40, 60])
        scene.current?.shake()
        pushToast(t('ui.toast.scandal'), 'bad')
      } else pushToast(t('ui.toast.scandalDodged'))
      break
    case 'lexicon-unlocked':
      play('upgrade')
      pushToast(t('ui.toast.lexicon', { name: t(`lexicon.${e.card}.title`) }), 'good')
      break
    case 'reality-unlocked': {
      const card = e.card
      pushToast(t('ui.reality.unlocked', { title: t(`reality.${card}.title`) }), 'info', {
        label: t('ui.reality.open'),
        run: () => openReality(card),
      })
      break
    }
    case 'daily-completed':
      play('success')
      pushToast(t('ui.toast.daily'), 'good')
      break
    case 'quality':
      if (e.labelKey) {
        const tone =
          e.score >= 0.75 || e.score >= 15
            ? 'good'
            : e.score >= 0.35 || e.score >= 8
              ? 'meh'
              : 'bad'
        stamp(
          t(e.labelKey),
          e.score <= 1 ? t('ui.quality.result', { value: Math.round(e.score * 100) }) : '',
          tone,
        )
        play(tone === 'good' ? 'milestone' : tone === 'meh' ? 'success' : 'scandal')
        if (tone === 'bad') scene.current?.shake()
      }
      break
    case 'till-full':
      pushToast(t('ui.toast.tillFull', { name: locationName(e.location) }), 'info')
      break
    case 'hotspot': {
      const label = content.locations
        .find((l) => l.id === e.location)
        ?.hotspots?.events.find((h) => h.id === e.id)?.labelKey
      play('notify')
      pushToast(
        t('ui.toast.hotspot', { name: locationName(e.location), label: label ? t(label) : '' }),
        e.multiplier >= 1 ? 'good' : 'bad',
      )
      break
    }
    case 'quest-started':
      play('notify')
      break
    case 'quest-completed': {
      const q = e.quest
      if (!q.startsWith('president-post') && !q.startsWith('headline-swipe'))
        pushToast(t('ui.toast.quest', { name: t(`quest.${q}.title`) }), 'good')
      break
    }
    default:
      break
  }
})

// Keep juice settings in sync with the saved settings.
function syncSettings(): void {
  const { settings } = getState()
  setSoundEnabled(settings.sound)
  setVibrationEnabled(settings.vibration)
  const reduced =
    settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  scene.current?.setReducedMotion(reduced)
  world.map?.setReducedMotion(reduced)
  setTransitionReducedMotion(reduced)
}
subscribe(syncSettings)
syncSettings()

const updateSW = registerSW({
  onNeedRefresh() {
    pushToast(t('ui.toast.update'), 'info', {
      label: t('ui.toast.reload'),
      run: () => void updateSW(true),
    })
  },
  onOfflineReady() {
    pushToast(t('ui.toast.offlineReady'), 'good')
  },
})

render(<App />, document.getElementById('app')!)
