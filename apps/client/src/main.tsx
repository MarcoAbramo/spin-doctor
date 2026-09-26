import { registerSW } from 'virtual:pwa-register'
import { render } from 'preact'
import { t } from './i18n'
import { play, setSoundEnabled, setVibrationEnabled, vibrate } from './juice/audio'
import { getState, onGameEvent, startGame, subscribe } from './store'
import { App } from './ui/App'
import { scene } from './ui/SceneView'
import { pushToast } from './ui/toast-store'
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
    case 'daily-completed':
      play('success')
      pushToast(t('ui.toast.daily'), 'good')
      break
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
  scene.current?.setReducedMotion(
    settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
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
