import { useState } from 'preact/hooks'
import { t } from '../i18n'
import { AssetIcon } from './AssetIcon'
import { Hud } from './Hud'
import { OfflineModal } from './modals/OfflineModal'
import { QuestModal } from './modals/QuestModal'
import { ObjectiveBar } from './ObjectiveBar'
import { SceneView } from './SceneView'
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

export function App() {
  const [tab, setTab] = useState<TabId>('generators')
  const View = TABS.find((x) => x.id === tab)!.view
  return (
    <div class="app">
      <Hud />
      <SceneView />
      <ObjectiveBar />
      <section class="panel" id="panel" role="tabpanel" aria-label={t(`ui.tab.${tab}`)}>
        <View />
      </section>
      <div class="tabs" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            aria-controls="panel"
            class={`tab ${tab === x.id ? 'tab-active' : ''}`}
            onClick={() => setTab(x.id)}
          >
            <AssetIcon class="tab-icon" path={`icons/tab-${x.id}.png`} emoji={x.icon} />
            <span class="tab-label">{t(`ui.tab.${x.id}`)}</span>
          </button>
        ))}
      </div>
      <QuestModal />
      <OfflineModal />
      <Toasts />
    </div>
  )
}
