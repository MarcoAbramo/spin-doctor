import { useEffect, useRef, useState } from 'preact/hooks'
import { t } from '../i18n'
import { AssetIcon } from './AssetIcon'
import { Hud } from './Hud'
import { OfflineModal } from './modals/OfflineModal'
import { QuestModal } from './modals/QuestModal'
import { RealityModal } from './modals/RealityCard'
import { ObjectiveBar } from './ObjectiveBar'
import { SceneView, setSceneInset } from './SceneView'
import { StatExplainer } from './StatExplainer'
import { Toasts } from './Toasts'
import { GeneratorsTab } from './tabs/GeneratorsTab'
import { LexiconTab } from './tabs/LexiconTab'
import { QuestsTab } from './tabs/QuestsTab'
import { SettingsTab } from './tabs/SettingsTab'
import { UpgradesTab } from './tabs/UpgradesTab'

const TABS = [
  { id: 'generators', icon: '🏭', view: GeneratorsTab },
  { id: 'upgrades', icon: '⬆️', view: UpgradesTab },
  { id: 'quests', icon: '📋', view: QuestsTab },
  { id: 'lexicon', icon: '📚', view: LexiconTab },
  { id: 'settings', icon: '⚙️', view: SettingsTab },
] as const

type TabId = (typeof TABS)[number]['id']

const PANEL_KEY = 'spin-doctor.panel-open'
function readPanelOpen(): boolean {
  try {
    return localStorage.getItem(PANEL_KEY) !== '0'
  } catch {
    return true
  }
}
function savePanelOpen(open: boolean): void {
  try {
    localStorage.setItem(PANEL_KEY, open ? '1' : '0')
  } catch {
    // Storage unavailable (private mode) — the choice just isn't remembered.
  }
}

export function App() {
  const [tab, setTab] = useState<TabId>('generators')
  const [open, setOpenState] = useState(readPanelOpen)
  const setOpen = (next: boolean) => {
    setOpenState(next)
    savePanelOpen(next)
  }
  const View = TABS.find((x) => x.id === tab)!.view
  const drawer = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const [panelH, setPanelH] = useState(0)
  const [side, setSide] = useState(false)

  // The drawer always keeps its open size, so the scene never has to move: folding
  // it away only slides it down (or, on short landscape screens, to the right) and
  // uncovers the rest of the room.
  useEffect(() => {
    const d = drawer.current
    const p = panel.current
    if (!d || !p) return
    const measure = () => {
      const isSide = getComputedStyle(d).getPropertyValue('--drawer-side').trim() === '1'
      setSide(isSide)
      setSceneInset(
        isSide ? { bottom: 0, right: d.offsetWidth } : { bottom: d.offsetHeight, right: 0 },
      )
      setPanelH(p.offsetHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(d)
    observer.observe(p)
    return () => observer.disconnect()
  }, [])

  return (
    <div class="app">
      <Hud />
      <div class="stage">
        <SceneView />
        <StatExplainer />
        <div
          class="drawer"
          ref={drawer}
          style={{
            transform: open ? 'none' : side ? 'translateX(100%)' : `translateY(${panelH}px)`,
          }}
        >
          {/* One bar of fixed height: the current objective sits next to the handle,
              so objectives coming and going never move the scene. */}
          <div class="drawer-bar">
            <ObjectiveBar />
            <button
              type="button"
              class="panel-handle"
              aria-expanded={open}
              aria-controls="panel"
              aria-label={open ? t('ui.panel.collapse') : t('ui.panel.expand')}
              onClick={() => setOpen(!open)}
            >
              <span class="panel-grip" aria-hidden="true" />
              <span aria-hidden="true">{open ? '▾' : '▴'}</span>
              <span class="panel-handle-label" aria-hidden="true">
                {open ? t('ui.panel.collapse') : t('ui.panel.expand')}
              </span>
            </button>
          </div>
          <section
            class="panel"
            id="panel"
            ref={panel}
            role="tabpanel"
            aria-label={t(`ui.tab.${tab}`)}
            aria-hidden={!open}
            inert={!open}
          >
            <View />
          </section>
        </div>
      </div>
      <div class="tabs" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={open && tab === x.id}
            aria-controls="panel"
            class={`tab ${open && tab === x.id ? 'tab-active' : ''}`}
            onClick={() => {
              // Tapping the open tab again folds the menu away; any other tab opens it.
              if (open && tab === x.id) setOpen(false)
              else {
                setTab(x.id)
                setOpen(true)
              }
            }}
          >
            <AssetIcon class="tab-icon" path={`icons/tab-${x.id}.png`} emoji={x.icon} />
            <span class="tab-label">{t(`ui.tab.${x.id}`)}</span>
          </button>
        ))}
      </div>
      <QuestModal />
      <OfflineModal />
      <RealityModal />
      <Toasts />
    </div>
  )
}
