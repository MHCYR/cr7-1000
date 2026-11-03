import { describe, expect, it } from 'vitest'
import { TUNNEL, TUNNEL_FOG, tunnelPositions } from '../tunnel/tunnel.ts'
import { CARD_DEPTH, CARD_REVEAL, CARD_WINDOW, READING_DISTANCE, type CardView, cardPlacement, layoutCards, visibleRange } from './cardLayout.ts'

// A card depth past the fog, so these tests see the projection, size and fog alone.
const view: CardView = { cameraZ: 0, focal: 1000, width: 1200, height: 800, progress: 1, fog: TUNNEL_FOG, cardDepth: { start: 200, end: 300 } }

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

  it('fades the farthest cards into goal points over the card depth', () => {
    const near = { ...view, cardDepth: { start: 4, end: 6 } }

    expect(cardPlacement(0, 0, -4, near)?.opacity).toBe(1)
    const middle = cardPlacement(0, 0, -5, near)?.opacity ?? 0
    expect(middle).toBeGreaterThan(0)
    expect(middle).toBeLessThan(1)
    expect(cardPlacement(0, 0, -6, near)).toBeNull()
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

describe('visibleRange', () => {
  const { separation, cameraStart } = TUNNEL

  it('starts at the first goal before the camera reaches the tunnel', () => {
    expect(visibleRange(cameraStart, separation, 48, 1000)).toEqual([0, 48])
  })

  it('starts at the goal closest to the camera in the middle of the tunnel', () => {
    // Goal 500 (index 499) is the closest to the camera, just behind or just ahead of it.
    expect(visibleRange(-500 * separation, separation, 48, 1000)).toEqual([499, 547])
    expect(visibleRange(-500.4 * separation, separation, 48, 1000)).toEqual([499, 547])
    expect(visibleRange(-500.6 * separation, separation, 48, 1000)).toEqual([500, 548])
  })

  it('never goes past the last goal at the end of the tunnel', () => {
    expect(visibleRange(-1000 * separation, separation, 48, 1000)).toEqual([999, 1000])
    expect(visibleRange(-1100 * separation, separation, 48, 1000)).toEqual([999, 1000])
  })

  it('ends at the last goal when max is more than the goals left', () => {
    expect(visibleRange(-980 * separation, separation, 48, 1000)).toEqual([979, 1000])
    expect(visibleRange(cameraStart, separation, 48, 10)).toEqual([0, 10])
  })

  it('holds every card that can be seen, from the portrait to the last goal', () => {
    const count = 1000
    const positions = tunnelPositions(count)
    const end = cameraStart / separation + count
    for (let step = 0; step <= end * 4; step++) {
      const cameraZ = cameraStart - (step / 4) * separation
      const [first, last] = visibleRange(cameraZ, separation, CARD_WINDOW, count)
      expect(last - first).toBeLessThanOrEqual(CARD_WINDOW)
      // Straight ahead and in a huge viewport, so only depth decides.
      const wide: CardView = { ...view, cameraZ, width: 1e6, height: 1e6, cardDepth: CARD_DEPTH }
      // Depth grows with the goal index: the goals right outside the window are the ones at risk.
      for (const i of [first - 1, last]) {
        if (i >= 0 && i < count) expect(cardPlacement(0, 0, positions[i * 3 + 2], wide)).toBeNull()
      }
    }
  })
})

describe('layoutCards', () => {
  const slot = () => ({ style: { visibility: '', opacity: '', transform: '' } }) as unknown as HTMLElement

  it('only moves the slots in the range', () => {
    const positions = new Float32Array([0, 0, -2, 0, 0, -3, 0, 0, -4, 0, 0, -5])
    const slots = [slot(), slot(), slot(), slot()]

    layoutCards(slots, positions, view, [1, 3])

    expect(slots.map((s) => s.style.visibility)).toEqual(['', 'visible', 'visible', ''])
    expect(slots[0].style.transform).toBe('')
    expect(slots[3].style.transform).toBe('')
  })

  it('skips slots that React has not mounted yet', () => {
    const positions = new Float32Array([0, 0, -2, 0, 0, -3])
    const slots = [null, slot()]

    layoutCards(slots, positions, view, [0, 2])

    expect(slots[1]?.style.visibility).toBe('visible')
  })
})
