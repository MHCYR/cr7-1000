import { useMemo, useState, useSyncExternalStore } from 'react'
import { clubes, goles } from '../data/goles.ts'
import { es } from '../i18n/es.ts'
import { type CristianoData, type CristianoPhoto, cristianoData } from './cristiano.ts'
import type { CardClub } from './goalCard.ts'
import { type CurrentGoal, progressCounter } from './goalIndicator.ts'
import './tokens.css'
import './goalIndicator.css'

/**
 * The indicator over the tunnel (#5). The goal cards already name each goal and its rival, so
 * this one is about Cristiano at the current goal: his photo of that year, the date, his age that
 * day and his team with its crest, over a counter that fills up to the goal as the page scrolls.
 * It is hidden with the portrait and rerenders only when the current goal changes.
 */
export function GoalIndicator({ goal }: { goal: CurrentGoal }) {
  const current = useSyncExternalStore(goal.subscribe, goal.get)
  // Keeps the last goal while it fades out on the way back to the portrait.
  const [shown, setShown] = useState(1)
  if (current > 0 && current !== shown) setShown(current)

  const data = useMemo(() => cristianoData(shown, goles, clubes), [shown])
  const counter = progressCounter(shown, goles.length)
  const hidden = current === 0
  const className = ['goal-indicator', 'hud-glass', hidden && 'goal-indicator--hidden'].filter(Boolean).join(' ')

  return (
    <aside className={className} aria-label={es.indicator.region} aria-hidden={hidden || undefined}>
      {data.scored ? <Cristiano data={data} /> : <Missing remaining={data.remaining} />}
      <div className="goal-counter">
        <p className="goal-counter__text">
          {counter.current} <span>{es.counter.of}</span> {counter.target} <span>{es.counter.goals}</span>
        </p>
        <div className="goal-counter__bar" role="img" aria-label={counter.label}>
          <div className="goal-counter__fill goal-counter__fill--missing" style={{ width: `${counter.fill * 100}%` }} />
          <div className="goal-counter__fill" style={{ width: `${counter.scoredFill * 100}%` }} />
        </div>
      </div>
    </aside>
  )
}

function Cristiano({ data }: { data: Extract<CristianoData, { scored: true }> }) {
  return (
    <div className="goal-indicator__body">
      <Photo photo={data.photo} />
      <dl className="goal-indicator__data">
        <div className="goal-indicator__row">
          <dt>{es.indicator.date}</dt>
          <dd>{data.fecha}</dd>
        </div>
        <div className="goal-indicator__row">
          <dt>{es.indicator.age}</dt>
          <dd>{data.edad}</dd>
        </div>
        <div className="goal-indicator__row">
          <dt>{es.indicator.team}</dt>
          <dd className="goal-indicator__team">
            <Crest club={data.equipo} />
            {data.equipo.nombre}
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** Cristiano's photo of the year, or a placeholder with the year while there is none. */
function Photo({ photo }: { photo: CristianoPhoto }) {
  return photo.src ? (
    <img className="goal-indicator__photo" src={photo.src} alt={photo.alt} />
  ) : (
    <div className="goal-indicator__photo goal-indicator__photo--pending" role="img" aria-label={photo.alt}>
      <span className="goal-indicator__photo-label">{es.indicator.photoPending}</span>
      <span className="goal-indicator__photo-year">{photo.year}</span>
    </div>
  )
}

function Crest({ club }: { club: CardClub }) {
  return club.escudo ? (
    <span className="goal-indicator__crest">
      <img src={club.escudo} alt={club.alt} />
    </span>
  ) : (
    <span className="goal-indicator__crest" role="img" aria-label={club.alt}>
      {club.initials}
    </span>
  )
}

function Missing({ remaining }: { remaining: string }) {
  return (
    <div className="goal-indicator__body">
      <div className="goal-indicator__photo goal-indicator__photo--pending" aria-hidden="true">
        <span className="goal-indicator__photo-year">?</span>
      </div>
      <p className="goal-indicator__note">{remaining}</p>
    </div>
  )
}
