// Where each goal card sits on screen (DESIGN.md, Comportamiento en el túnel). The camera only
// moves along Z and looks down -Z, so a goal at depth d in front of it projects to the screen
// center plus its X/Y times focal / d. Cards keep their design size up to READING_DISTANCE and
// shrink with the perspective beyond it, fading in the same fog as the goal pixels did.
// Only the CARD_WINDOW goals ahead of the camera are cards (#21); past CARD_DEPTH the cards fade
// back into goal pixels, which the vertex shader shows from that same depth on.

import { TUNNEL, type TunnelFog, currentGoal, smoothstep, tunnelFade } from '../tunnel/tunnel.ts'

/** Depth, in world units, at which a card shows at its design size: about the closest one on screen. */
export const READING_DISTANCE = 8

/** Scroll progress over which the cards take over from the goal pixels as these reach the tunnel. */
export const CARD_REVEAL = { start: 0.8, end: 1 } as const

/** Most goal cards mounted at once: the goals ahead of them stay as goal pixels. */
export const CARD_WINDOW = 48

/**
 * Depth, in world units, over which the farthest cards fade into goal pixels. It ends short of
 * the window, whose last goal is never closer than CARD_WINDOW - 1.5 goals, so a card that can
 * be seen is always mounted.
 */
export const CARD_DEPTH = {
  start: (CARD_WINDOW - 2) * TUNNEL.separation - 1.5,
  end: (CARD_WINDOW - 2) * TUNNEL.separation,
} as const

/** Cards closest to the camera that blur the tunnel behind them; the rest skip backdrop-filter. */
export const BLURRED_CARDS = 12

/** Point of the resting card that sits on its goal, in CSS pixels from its top left corner. */
export const CARD_ANCHOR = { x: 80, y: 36 } as const

/** Largest card, open, in CSS pixels: a card farther than this past the screen edge is not drawn. */
const CARD_EXTENT = { width: 272, height: 320 } as const

export interface CardPlacement {
  /** Screen position of the goal, in CSS pixels from the top left corner. */
  x: number
  y: number
  scale: number
  opacity: number
}

export interface CardView {
  cameraZ: number
  /** Focal length in CSS pixels: projectionMatrix[1][1] × half the viewport height. */
  focal: number
  width: number
  height: number
  /** Scroll progress, 0 with the portrait, 1 with every goal in the tunnel. */
  progress: number
  fog: TunnelFog
  /** Depth over which the cards hand off to the goal pixels (CARD_DEPTH). */
  cardDepth: { start: number; end: number }
}

/**
 * Goal indices that hold a card, as [start, end): `max` goals from the one closest to the
 * camera (currentGoal, maybe still half a goal ahead) and never past the last goal. Goal n sits
 * at z = -n × separation, so the goals in sight always follow one another.
 */
export function visibleRange(cameraZ: number, separation: number, max: number, count: number): [number, number] {
  const start = Math.max(currentGoal(cameraZ, separation, count) - 1, 0)
  return [start, Math.min(start + max, count)]
}

/** The card of the goal at world (x, y, z), or null when it is hidden: behind the camera, in the fog or off screen. */
export function cardPlacement(x: number, y: number, z: number, view: CardView): CardPlacement | null {
  const depth = view.cameraZ - z
  if (depth <= 0) return null
  const opacity =
    smoothstep(CARD_REVEAL.start, CARD_REVEAL.end, view.progress) *
    tunnelFade(depth, view.fog) *
    (1 - smoothstep(view.cardDepth.start, view.cardDepth.end, depth))
  if (opacity <= 0.01) return null

  const scale = Math.min(1, READING_DISTANCE / depth)
  const screenX = view.width / 2 + (x * view.focal) / depth
  const screenY = view.height / 2 - (y * view.focal) / depth
  const left = screenX - CARD_ANCHOR.x * scale
  const top = screenY - CARD_ANCHOR.y * scale
  if (left > view.width || top > view.height) return null
  if (left + CARD_EXTENT.width * scale < 0 || top + CARD_EXTENT.height * scale < 0) return null
  return { x: screenX, y: screenY, scale, opacity }
}

/**
 * Moves the card slots in `range` (visibleRange) to their goals, straight on the DOM so
 * scrolling never rerenders React: slot i holds the card of goal i + 1, and `positions` the
 * tunnel xyz of each goal. Slots React has not mounted yet are skipped.
 */
export function layoutCards(slots: readonly (HTMLElement | null)[], positions: Float32Array, view: CardView, range: readonly [number, number]): void {
  const end = Math.min(range[1], slots.length, positions.length / 3)
  for (let i = range[0]; i < end; i++) {
    const slot = slots[i]
    if (!slot) continue
    const placement = cardPlacement(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], view)
    if (!placement) {
      if (slot.style.visibility !== 'hidden') slot.style.visibility = 'hidden'
      continue
    }
    const { x, y, scale, opacity } = placement
    slot.style.visibility = 'visible'
    slot.style.opacity = opacity.toFixed(3)
    slot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)}) translate(-${CARD_ANCHOR.x}px, -${CARD_ANCHOR.y}px)`
  }
}
