import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { clubes, goles } from '../data/goles.ts'
import { es } from '../i18n/es.ts'
import { type CristianoData, PHOTOS, cristianoData, photoBlend, yearStarts } from './cristiano.ts'
import type { CardClub } from './goalCard.ts'
import { type IndicatorLink, type SharedNumber, progressCounter } from './goalIndicator.ts'
import './tokens.css'
import './goalIndicator.css'

/**
 * The indicator over the tunnel (#5). The goal cards already name each goal and its rival, so
 * this one is about Cristiano at the current goal: his photo of that year, his age that day and
 * the club he played for then, with its crest (also on goals for Portugal), over a counter that
 * fills up to the goal as the page scrolls. It is hidden with the portrait and rerenders only when the current goal changes.
 */
export function GoalIndicator({ link }: { link: IndicatorLink }) {
  const { goal, position } = link
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
      {data.scored ? <Cristiano data={data} position={position} /> : <Missing remaining={data.remaining} />}
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

function Cristiano({ data, position }: { data: Extract<CristianoData, { scored: true }>; position: SharedNumber }) {
  return (
    <div className="goal-indicator__body">
      <Photo position={position} alt={data.photo.alt} />
      <dl className="goal-indicator__data">
        <div className="goal-indicator__row">
          <dt>{es.indicator.age}</dt>
          <dd>{data.edad}</dd>
        </div>
        <div className="goal-indicator__row">
          <dt>{es.indicator.club}</dt>
          {data.club ? (
            <dd className="goal-indicator__team">
              <Crest club={data.club} />
              {data.club.nombre}
            </dd>
          ) : (
            <dd>{es.indicator.noClub}</dd>
          )}
        </div>
      </dl>
    </div>
  )
}

const YEAR_STARTS = yearStarts(goles)

/**
 * Cristiano's photo of the year, cross-faded with the scroll (photoBlend): around the first goal
 * of a year the old photo loses opacity as the new one gains it, never more than two at once.
 * React renders the pair only when it changes; the opacities go straight to the DOM every time
 * the position moves. A year without a photo shows a placeholder.
 */
function Photo({ position, alt }: { position: SharedNumber; alt: string }) {
  const [pair, setPair] = useState(() => {
    const { from, to } = photoBlend(position.get(), YEAR_STARTS)
    return { from, to }
  })
  const below = useRef<HTMLDivElement>(null)
  const above = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const apply = () => {
      const { from, to, t } = photoBlend(position.get(), YEAR_STARTS)
      if (from !== pair.from || to !== pair.to) return setPair({ from, to })
      if (below.current) below.current.style.opacity = (1 - t).toFixed(3)
      if (above.current) above.current.style.opacity = t.toFixed(3)
    }
    apply()
    return position.subscribe(apply)
  }, [position, pair])

  // The photos of the next years load ahead, so a fade never starts on an empty layer.
  useEffect(() => {
    for (const year of [pair.to + 1, pair.to + 2, pair.from - 1]) {
      if (PHOTOS[year]) new Image().src = PHOTOS[year]
    }
  }, [pair])

  const years = pair.from === pair.to ? [pair.to] : [pair.from, pair.to]
  return (
    <div className="goal-indicator__photo" role="img" aria-label={alt}>
      {years.map((year) => (
        <div key={year} ref={year === pair.to ? above : below} className="goal-indicator__photo-layer">
          {PHOTOS[year] ? (
            <img src={PHOTOS[year]} alt="" decoding="async" />
          ) : (
            <div className="goal-indicator__photo-pending">
              <span className="goal-indicator__photo-label">{es.indicator.photoPending}</span>
              <span className="goal-indicator__photo-year">{year}</span>
            </div>
          )}
        </div>
      ))}
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
      <div className="goal-indicator__photo" aria-hidden="true">
        <div className="goal-indicator__photo-pending">
          <span className="goal-indicator__photo-year">?</span>
        </div>
      </div>
      <p className="goal-indicator__note">{remaining}</p>
    </div>
  )
}
