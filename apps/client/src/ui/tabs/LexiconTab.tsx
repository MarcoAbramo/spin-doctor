import { content } from '../../content'
import { t } from '../../i18n'
import { useGame } from '../hooks'

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
