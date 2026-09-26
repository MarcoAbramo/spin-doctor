import { content } from '../../content'
import { t } from '../../i18n'
import { useAsset, useGame } from '../hooks'

function Illustration({ id }: { id: string }) {
  const path = `illustrations/lexicon-${id}.png`
  return useAsset(path) ? <img class="lexicon-img" src={`assets/${path}`} alt="" /> : null
}

export function LexiconTab() {
  const state = useGame()
  return (
    <div>
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
    </div>
  )
}
