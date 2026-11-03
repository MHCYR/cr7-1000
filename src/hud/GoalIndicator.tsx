import { useMemo, useState, useSyncExternalStore } from 'react'
import { clubes, goles } from '../data/goles.ts'
import { es } from '../i18n/es.ts'
import { type GoalCardData, goalCardData } from './goalCard.ts'
import { type CurrentGoal, progressCounter } from './goalIndicator.ts'
import './tokens.css'
import './goalIndicator.css'

/**
 * The indicator over the tunnel (#5): the goal closest to the camera in large type, its team,
 * rival and date, and the counter of goals scored toward the target. It is hidden with the
 * portrait, before the camera reaches goal 1, and rerenders only when the current goal changes.
 */
export function GoalIndicator({ goal }: { goal: CurrentGoal }) {
  const current = useSyncExternalStore(goal.subscribe, goal.get)
  // Keeps the last goal while it fades out on the way back to the portrait.
  const [shown, setShown] = useState(1)
  if (current > 0 && current !== shown) setShown(current)

  const card = useMemo(() => goalCardData(shown, goles, clubes), [shown])
  const counter = useMemo(() => progressCounter(goles.length), [])
  const hidden = current === 0
  const className = ['goal-indicator', 'hud-glass', !card.scored && 'goal-indicator--missing', hidden && 'goal-indicator--hidden']
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={className} aria-label={es.indicator.region} aria-hidden={hidden || undefined}>
      <div className="goal-indicator__tags">
        <Sticker scored={card.scored} />
      </div>
      <p className="goal-indicator__number">{card.numero}</p>
      {card.scored ? <GoalData card={card} /> : <p className="goal-indicator__note">{card.remaining}</p>}
      <div className="goal-counter">
        <p className="goal-counter__text">
          {counter.scored} <span>{es.counter.of}</span> {counter.target} <span>{es.counter.goals}</span>
        </p>
        <div className="goal-counter__bar" role="img" aria-label={counter.label}>
          <div className="goal-counter__fill" style={{ width: `${counter.fill * 100}%` }} />
        </div>
      </div>
    </aside>
  )
}

function Sticker({ scored }: { scored: boolean }) {
  return scored ? (
    <span className="goal-indicator__sticker">{es.goalCard.scored}</span>
  ) : (
    <span className="goal-indicator__sticker goal-indicator__sticker--missing">
      <span className="goal-card__ring" aria-hidden="true" />
      {es.goalCard.missing}
    </span>
  )
}

function GoalData({ card }: { card: Extract<GoalCardData, { scored: true }> }) {
  return (
    <dl className="goal-indicator__data">
      <div className="goal-indicator__row">
        <dt>{es.indicator.team}</dt>
        <dd>{card.equipo.nombre}</dd>
      </div>
      <div className="goal-indicator__row">
        <dt>{es.indicator.rival}</dt>
        <dd>{card.rival.nombre}</dd>
      </div>
      <div className="goal-indicator__row">
        <dt>{es.goalCard.date}</dt>
        <dd>{card.fecha}</dd>
      </div>
    </dl>
  )
}
