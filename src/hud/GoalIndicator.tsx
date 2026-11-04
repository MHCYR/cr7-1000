import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { clubes, goles } from '../data/goles.ts'
import { es } from '../i18n/es.ts'
import { type CristianoData, type CristianoPhoto, cristianoData } from './cristiano.ts'
import type { CardClub } from './goalCard.ts'
import { type CurrentGoal, progressCounter } from './goalIndicator.ts'
import './tokens.css'
import './goalIndicator.css'

/**
 * The indicator over the tunnel (#5). The goal cards already name each goal and its rival, so
 * this one is about Cristiano at the current goal: his photo of that year, his age that day and
 * the club he played for then, with its crest (also on goals for Portugal), over a counter that
 * fills up to the goal as the page scrolls. It is hidden with the portrait and rerenders only when the current goal changes.
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

/** A photo in the frame: loading, fading in over the ones below, or fully shown. */
interface PhotoLayer {
  photo: CristianoPhoto
  state: 'loading' | 'fading' | 'shown'
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Drops what can no longer be seen: every layer under the topmost fully shown one, and photos
 * that were still loading when a newer one replaced them.
 */
function visibleLayers(layers: PhotoLayer[]): PhotoLayer[] {
  const top = layers.length - 1
  const base = layers.findLastIndex((layer) => layer.state === 'shown')
  return layers.filter((layer, i) => i >= Math.max(base, 0) && (layer.state !== 'loading' || i === top))
}

/**
 * Cristiano's photo of the year, cross-faded: each new photo fades in over the ones below once
 * its image has loaded, and they leave only when it is fully shown, so the frame never dims in
 * between, even scrolling fast through the years. A year without a photo shows a placeholder.
 */
function Photo({ photo }: { photo: CristianoPhoto }) {
  const initial = (): PhotoLayer => ({ photo, state: photo.src ? 'loading' : 'shown' })
  const [layers, setLayers] = useState<PhotoLayer[]>(() => [initial()])
  const top = layers[layers.length - 1]
  if (top.photo.year !== photo.year || top.photo.src !== photo.src) setLayers(visibleLayers([...layers, initial()]))

  const update = useCallback((year: number, state: PhotoLayer['state']) => {
    setLayers((current) => visibleLayers(current.map((layer) => (layer.photo.year === year ? { ...layer, state } : layer))))
  }, [])

  return (
    <div className="goal-indicator__photo" role="img" aria-label={photo.alt}>
      {layers.map(({ photo: { year, src }, state }) => (
        <div
          key={year}
          className={`goal-indicator__photo-layer${state === 'loading' ? '' : ' goal-indicator__photo-layer--shown'}`}
          onTransitionEnd={(event) => event.propertyName === 'opacity' && update(year, 'shown')}
        >
          {src ? (
            <img src={src} alt="" decoding="async" onLoad={() => update(year, reducedMotion() ? 'shown' : 'fading')} />
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
