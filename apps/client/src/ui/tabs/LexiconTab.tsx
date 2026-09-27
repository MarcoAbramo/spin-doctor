import { useState } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'
import { useAsset, useGame } from '../hooks'
import { RealityBody } from '../modals/RealityCard'

type Section = 'lexicon' | 'reality'
let lastSection: Section = 'lexicon'

function Illustration({ id }: { id: string }) {
  const path = `illustrations/lexicon-${id}.png`
  return useAsset(path) ? <img class="lexicon-img" src={`assets/${path}`} alt="" /> : null
}

function LexiconList() {
  const state = useGame()
  return (
    <>
      <p class="empty">{t('ui.lexicon.intro')}</p>
      <ul class="list">
        {content.lexicon.map((card) => {
          const unlocked = state.lexicon.includes(card.id)
          return (
            <li class={`card lexicon ${unlocked ? '' : 'card-locked'}`} key={card.id}>
              <div class="card-body">
                <div class="card-title">
                  {unlocked ? '📖' : '🔒'} {t(`lexicon.${card.id}.title`)}
                </div>
                {unlocked ? (
                  <>
                    <Illustration id={card.id} />
                    <p class="lexicon-body">{t(`lexicon.${card.id}.body`)}</p>
                    <div class="card-meta">
                      {t('ui.lexicon.source')}:{' '}
                      <a href={card.source.url} target="_blank" rel="noopener noreferrer">
                        {card.source.label}
                      </a>
                    </div>
                  </>
                ) : (
                  <div class="card-flavor">{t('ui.lexicon.locked')}</div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function RealityList() {
  const state = useGame()
  return (
    <>
      <p class="empty">{t('ui.reality.intro')}</p>
      <ul class="list">
        {content.realityChecks.map((card) => {
          const unlocked = state.realityChecks.includes(card.id)
          return (
            <li class={`card lexicon ${unlocked ? '' : 'card-locked'}`} key={card.id}>
              <div class="card-body">
                <div class="card-title">
                  {unlocked ? '📰' : '🔒'} {t(`reality.${card.id}.title`)}
                </div>
                {unlocked ? (
                  <RealityBody card={card} />
                ) : (
                  <div class="card-flavor">{t('ui.reality.locked')}</div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p class="card-flavor">{t('ui.reality.disclaimer')}</p>
    </>
  )
}

export function LexiconTab() {
  const [section, setSection] = useState<Section>(lastSection)
  const pick = (s: Section) => {
    lastSection = s
    setSection(s)
  }
  return (
    <div>
      {content.realityChecks.length > 0 && (
        <div class="segmented" role="tablist">
          {(['lexicon', 'reality'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={section === s}
              class={`btn btn-small ${section === s ? '' : 'btn-ghost'}`}
              onClick={() => pick(s)}
            >
              {t(s === 'lexicon' ? 'ui.lexicon.switchLexicon' : 'ui.lexicon.switchReality')}
            </button>
          ))}
        </div>
      )}
      {section === 'lexicon' ? <LexiconList /> : <RealityList />}
    </div>
  )
}
