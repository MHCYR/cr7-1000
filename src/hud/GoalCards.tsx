import { type PointerEvent, memo, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { clubes, goles } from '../data/goles.ts'
import { es } from '../i18n/es.ts'
import { GOAL_PIXELS } from '../portrait/sample.ts'
import { BLURRED_CARDS, CARD_WINDOW } from './cardLayout.ts'
import type { GoalCardLayer } from './cardWindow.ts'
import { type CardClub, type GoalCardData, goalCardData } from './goalCard.ts'
import './tokens.css'
import './goalCards.css'

interface GoalCardsProps {
  /** Its slots get one entry per mounted card, index i for goal i + 1; the scene moves them every frame. */
  layer: GoalCardLayer
  count?: number
}

/**
 * The goal cards of the tunnel (DESIGN.md, GoalCard) over the canvas: only the CARD_WINDOW goals
 * from the camera on, so the DOM never holds more cards than that (#21). React renders them
 * again only when the window slides, once per goal, and tracks the one open card; their screen
 * positions are written straight to the DOM by the scene (src/hud/cardLayout.ts).
 */
export function GoalCards({ layer, count = GOAL_PIXELS }: GoalCardsProps) {
  const { mount, window: cardWindow } = layer
  const cards = useMemo(() => Array.from({ length: count }, (_, i) => goalCardData(i + 1, goles, clubes)), [count])
  const start = useSyncExternalStore(cardWindow.subscribe, cardWindow.start)
  const end = Math.min(start + CARD_WINDOW, count)
  // Only one card is open at a time.
  const [open, setOpen] = useState<number | null>(null)
  const show = useCallback((numero: number) => setOpen(numero), [])
  const hide = useCallback((numero: number) => setOpen((current) => (current === numero ? null : current)), [])

  // A card that leaves the window closes, so it does not open again when it comes back.
  if (open !== null && (open <= start || open > end)) setOpen(null)

  // On touch, a card closes when tapping outside it.
  useEffect(() => {
    const close = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.goal-card')) setOpen(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  return (
    <div className="goal-cards">
      {cards.slice(start, end).map((card, offset) => (
        <GoalSlot
          key={card.numero}
          mount={mount}
          card={card}
          // The goal closest to the camera has the lowest number ahead: it stacks on top.
          zIndex={count - card.numero}
          blurred={offset < BLURRED_CARDS}
          open={open === card.numero}
          onOpen={show}
          onClose={hide}
        />
      ))}
    </div>
  )
}

interface GoalSlotProps extends GoalCardProps {
  mount: GoalCardLayer['mount']
  zIndex: number
  /** Only the cards closest to the camera blur the tunnel behind them. */
  blurred: boolean
}

const GoalSlot = memo(function GoalSlot({ mount, zIndex, blurred, ...cardProps }: GoalSlotProps) {
  const index = cardProps.card.numero - 1
  const setSlot = useCallback((element: HTMLElement | null) => mount(index, element), [mount, index])
  const className = ['goal-slot', cardProps.open && 'goal-slot--open', !blurred && 'goal-slot--unblurred'].filter(Boolean).join(' ')

  return (
    <div ref={setSlot} className={className} style={{ zIndex }}>
      <GoalCard {...cardProps} />
    </div>
  )
})

interface GoalCardProps {
  card: GoalCardData
  open: boolean
  onOpen: (numero: number) => void
  onClose: (numero: number) => void
}

const GoalCard = memo(function GoalCard({ card, open, onOpen, onClose }: GoalCardProps) {
  const { numero } = card
  const fromMouse = (event: PointerEvent) => event.pointerType === 'mouse'
  const className = ['goal-card', 'hud-glass', open && 'goal-card--open', !card.scored && 'goal-card--missing']
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={className}
      tabIndex={0}
      aria-label={card.label}
      onPointerEnter={(event) => fromMouse(event) && onOpen(numero)}
      onPointerLeave={(event) => fromMouse(event) && onClose(numero)}
      onFocus={() => onOpen(numero)}
      onBlur={() => onClose(numero)}
      onClick={() => onOpen(numero)}
    >
      <div className="goal-card__head">
        <p className="goal-card__number">{numero}</p>
        {open ? <Sticker scored={card.scored} /> : <StateMark scored={card.scored} />}
      </div>
      {open && (card.scored ? <ScoredDetails card={card} /> : <MissingDetails remaining={card.remaining} />)}
    </article>
  )
})

function StateMark({ scored }: { scored: boolean }) {
  return scored ? <span className="goal-card__mark" aria-hidden="true" /> : <span className="goal-card__ring" aria-hidden="true" />
}

function Sticker({ scored }: { scored: boolean }) {
  return (
    <span className="goal-card__sticker goal-card__reveal">
      {!scored && <span className="goal-card__ring" aria-hidden="true" />}
      {scored ? es.goalCard.scored : es.goalCard.missing}
    </span>
  )
}

function ScoredDetails({ card }: { card: Extract<GoalCardData, { scored: true }> }) {
  return (
    <div className="goal-card__details goal-card__reveal">
      <div className="goal-card__teams">
        <Team club={card.equipo} side="own" />
        <span className="goal-card__versus">{es.goalCard.versus}</span>
        <Team club={card.rival} side="rival" />
      </div>
      <dl className="goal-card__date">
        <dt className="goal-card__label">{es.goalCard.date}</dt>
        <dd>{card.fecha}</dd>
      </dl>
    </div>
  )
}

function Team({ club, side }: { club: CardClub; side: 'own' | 'rival' }) {
  return (
    <figure className="goal-card__team">
      {club.escudo ? (
        <div className={`goal-card__crest goal-card__crest--${side}`}>
          <img src={club.escudo} alt={club.alt} />
        </div>
      ) : (
        <div className={`goal-card__crest goal-card__crest--${side}`} role="img" aria-label={club.alt}>
          {club.initials}
        </div>
      )}
      <figcaption className="goal-card__label">{club.nombre}</figcaption>
    </figure>
  )
}

function MissingDetails({ remaining }: { remaining: string }) {
  return (
    <div className="goal-card__details goal-card__reveal">
      <div className="goal-card__teams" aria-hidden="true">
        <div className="goal-card__crest goal-card__crest--empty">{es.goalCard.unknownCrest}</div>
        <span className="goal-card__versus">{es.goalCard.versus}</span>
        <div className="goal-card__crest goal-card__crest--empty">{es.goalCard.unknownCrest}</div>
      </div>
      <p className="goal-card__remaining">{remaining}</p>
    </div>
  )
}
