import { describe, expect, it } from 'vitest'
import { TUNNEL_FOG } from '../tunnel/tunnel.ts'
import { CARD_REVEAL, READING_DISTANCE, type CardView, cardPlacement } from './cardLayout.ts'

const view: CardView = { cameraZ: 0, focal: 1000, width: 1200, height: 800, progress: 1, fog: TUNNEL_FOG }

describe('cardPlacement', () => {
  it('projects a goal from the screen center by its X/Y over its depth', () => {
    const placement = cardPlacement(2, 1, -10, view)

    expect(placement?.x).toBeCloseTo(600 + 200)
    expect(placement?.y).toBeCloseTo(400 - 100)
  })

  it('keeps the design size up to the reading distance and shrinks with the perspective beyond it', () => {
    expect(cardPlacement(0, 0, -READING_DISTANCE / 2, view)?.scale).toBe(1)
    expect(cardPlacement(0, 0, -READING_DISTANCE, view)?.scale).toBe(1)
    expect(cardPlacement(0, 0, -READING_DISTANCE * 2, view)?.scale).toBeCloseTo(0.5)
  })

  it('fades the cards in the tunnel fog and hides those past it', () => {
    expect(cardPlacement(0, 0, -TUNNEL_FOG.near, view)?.opacity).toBe(1)
    const middle = cardPlacement(0, 0, -(TUNNEL_FOG.near + TUNNEL_FOG.far) / 2, view)?.opacity ?? 0
    expect(middle).toBeGreaterThan(0)
    expect(middle).toBeLessThan(1)
    expect(cardPlacement(0, 0, -TUNNEL_FOG.far, view)).toBeNull()
  })

  it('hides the cards until the goals reach the tunnel', () => {
    expect(cardPlacement(0, 0, -10, { ...view, progress: CARD_REVEAL.start })).toBeNull()
    expect(cardPlacement(0, 0, -10, { ...view, progress: CARD_REVEAL.end })?.opacity).toBe(1)
  })

  it('hides cards behind the camera or off screen', () => {
    expect(cardPlacement(0, 0, 1, view)).toBeNull()
    expect(cardPlacement(0, 0, 0, view)).toBeNull()
    expect(cardPlacement(10, 0, -5, view)).toBeNull()
    expect(cardPlacement(0, -10, -5, view)).toBeNull()
  })
})
