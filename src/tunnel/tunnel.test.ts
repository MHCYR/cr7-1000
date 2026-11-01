import { describe, expect, it } from 'vitest'
import { FILL_ZOOM, TUNNEL, currentGoal, fillOffset, fillOrder, nearFade, scrollHeight, scrollState, TUNNEL_FOG, tunnelFade, tunnelPositions } from './tunnel.ts'

const { separation } = TUNNEL

describe('currentGoal', () => {
  it('is 0 before the camera enters the tunnel', () => {
    expect(currentGoal(TUNNEL.cameraStart, separation, 1000)).toBe(0)
    expect(currentGoal(0, separation, 1000)).toBe(0)
    expect(currentGoal(-0.49 * separation, separation, 1000)).toBe(0)
  })

  it('is goal 1 when the camera reaches the first goal', () => {
    expect(currentGoal(-separation, separation, 1000)).toBe(1)
    expect(currentGoal(-0.5 * separation, separation, 1000)).toBe(1)
    expect(currentGoal(-1.49 * separation, separation, 1000)).toBe(1)
  })

  it('is the goal closest to the camera: round(z / separation)', () => {
    expect(currentGoal(-1.51 * separation, separation, 1000)).toBe(2)
    expect(currentGoal(-16 * separation, separation, 1000)).toBe(16)
  })

  it('is goal 1000 at the end of the tunnel and never goes past it', () => {
    expect(currentGoal(-1000 * separation, separation, 1000)).toBe(1000)
    expect(currentGoal(-1200 * separation, separation, 1000)).toBe(1000)
  })
})

describe('tunnelPositions', () => {
  const positions = tunnelPositions(1000, 7)

  it('puts goal number n at z = -n × separation', () => {
    expect(positions).toHaveLength(3000)
    expect(positions[2]).toBeCloseTo(-separation)
    expect(positions[2 + 15 * 3]).toBeCloseTo(-16 * separation)
    expect(positions[2 + 999 * 3]).toBeCloseTo(-1000 * separation)
  })

  it('spreads X/Y at random on a ring around the camera path, so the camera passes beside every goal', () => {
    expect(TUNNEL.radius).toEqual({ min: 2, max: 3.5 })
    for (let i = 0; i < positions.length; i += 3) {
      const radius = Math.hypot(positions[i], positions[i + 1])
      expect(radius).toBeGreaterThanOrEqual(TUNNEL.radius.min - 1e-6)
      expect(radius).toBeLessThanOrEqual(TUNNEL.radius.max + 1e-6)
    }
    expect(new Set(Array.from({ length: 10 }, (_, i) => positions[i * 3])).size).toBe(10)
  })

  it('respects a custom radius without changing chronological depth', () => {
    const custom = tunnelPositions(100, 7, { ...TUNNEL, radius: { min: 3, max: 4 } })
    for (let i = 0; i < 100; i++) {
      expect(Math.hypot(custom[i * 3], custom[i * 3 + 1])).toBeGreaterThanOrEqual(3 - 1e-6)
      expect(Math.hypot(custom[i * 3], custom[i * 3 + 1])).toBeLessThanOrEqual(4 + 1e-6)
      expect(custom[i * 3 + 2]).toBeCloseTo(-(i + 1) * separation)
    }
  })

  it('is fixed by its seed', () => {
    expect(tunnelPositions(1000, 7)).toEqual(positions)
    expect(tunnelPositions(1000, 8)).not.toEqual(positions)
  })
})

describe('scrollState', () => {
  const viewport = 800
  const goals = 1000

  it('shows the assembled portrait at the top of the page', () => {
    expect(scrollState(0, viewport, goals)).toEqual({ progress: 0, cameraZ: TUNNEL.cameraStart })
  })

  it('spends the first viewport of scroll flying the goals to the tunnel, with the camera still', () => {
    expect(scrollState(viewport / 2, viewport, goals)).toEqual({ progress: 0.5, cameraZ: TUNNEL.cameraStart })
    expect(scrollState(viewport, viewport, goals)).toEqual({ progress: 1, cameraZ: TUNNEL.cameraStart })
  })

  it('then moves the camera into the tunnel, one separation per pixelsPerGoal of scroll', () => {
    const { progress, cameraZ } = scrollState(viewport + 10 * TUNNEL.pixelsPerGoal, viewport, goals)
    expect(progress).toBe(1)
    expect(cameraZ).toBeCloseTo(TUNNEL.cameraStart - 10 * separation)
  })

  it('reaches goal 1000 at the bottom of the page and stops there', () => {
    const bottom = scrollHeight(viewport, goals)
    expect(currentGoal(scrollState(bottom, viewport, goals).cameraZ, separation, goals)).toBe(1000)
    expect(scrollState(bottom + 500, viewport, goals).cameraZ).toBeCloseTo(-goals * separation)
  })

  it('is reversible: scrolling back up rebuilds the portrait', () => {
    const bottom = scrollHeight(viewport, goals)
    scrollState(bottom, viewport, goals)
    expect(scrollState(0, viewport, goals)).toEqual({ progress: 0, cameraZ: TUNNEL.cameraStart })
    expect(scrollState(-40, viewport, goals)).toEqual({ progress: 0, cameraZ: TUNNEL.cameraStart })
  })
})

describe('fillOffset', () => {
  const zoom = { zoomEnd: 0.25, zoomDepth: 2, flyEnd: 0.75, flight: 0.2, reach: 6 }

  it('leaves the portrait in place at the top of the page', () => {
    expect(fillOffset(0, 0, zoom)).toBe(0)
    expect(fillOffset(-0.2, 1, zoom)).toBe(0)
  })

  it('first brings the whole image toward the camera at once, so it grows', () => {
    for (const progress of [0.05, 0.125, 0.2]) {
      expect(fillOffset(progress, 0, zoom)).toBe(fillOffset(progress, 1, zoom))
      expect(fillOffset(progress, 0.4, zoom)).toBe(fillOffset(progress, 1, zoom))
    }
    expect(fillOffset(0.125, 0.5, zoom)).toBeCloseTo(1)
    expect(fillOffset(0.25, 0.5, zoom)).toBe(2)
  })

  it('then flies the pixels one by one: lower order first, the rest wait at zoomDepth', () => {
    // order 0 starts at zoomEnd; order 1 waits until flyEnd - flight.
    expect(fillOffset(0.35, 0, zoom)).toBeCloseTo(4)
    expect(fillOffset(0.35, 1, zoom)).toBe(2)
    expect(fillOffset(0.5, 0.2, zoom)).toBeGreaterThan(fillOffset(0.5, 0.6, zoom))
    expect(fillOffset(0.5, 0.6, zoom)).toBeGreaterThan(fillOffset(0.5, 0.9, zoom))
    expect(fillOffset(0.55, 1, zoom)).toBe(2)
    expect(fillOffset(0.65, 1, zoom)).toBeCloseTo(4)
  })

  it('has every pixel at reach, past the portrait, by flyEnd', () => {
    for (const order of [0, 0.3, 0.7, 1]) {
      expect(fillOffset(0.75, order, zoom)).toBe(6)
      expect(fillOffset(1, order, zoom)).toBe(6)
    }
  })

  it('is reversible: the same progress and order always give the same offset', () => {
    fillOffset(1, 0.5, zoom)
    expect(fillOffset(0.5, 0.5, zoom)).toBe(fillOffset(0.5, 0.5, zoom))
    expect(fillOffset(0, 0.5, zoom)).toBe(0)
  })

  it('flies every pixel at once when the windows leave no room for a stagger', () => {
    const tight = { ...zoom, flyEnd: 0.4, flight: 0.3 }
    expect(fillOffset(0.35, 0, tight)).toBe(fillOffset(0.35, 1, tight))
    expect(fillOffset(0.4, 1, tight)).toBe(6)
  })

  it('by default grows the image, then takes every fill pixel past the camera before the goals land', () => {
    expect(FILL_ZOOM.zoomEnd).toBeLessThan(FILL_ZOOM.flyEnd)
    expect(FILL_ZOOM.flyEnd).toBeLessThan(1)
    expect(FILL_ZOOM.zoomDepth).toBeLessThan(TUNNEL.cameraStart)
    expect(fillOffset(FILL_ZOOM.flyEnd, 1, FILL_ZOOM)).toBeGreaterThan(TUNNEL.cameraStart)
  })
})

describe('fillOrder', () => {
  // xyz triplets: the center, a pixel halfway out and two on the edge.
  const positions = new Float32Array([0, 0, 0, 0.5, 0, 0, 0, -1, 0, 1, 0, 0])

  it('without jitter is the distance to the center, as a share of the farthest pixel', () => {
    expect(Array.from(fillOrder(positions, 3, 0))).toEqual([0, 0.5, 1, 1])
  })

  it('mixes in some randomness, so the center-out order is not a perfect ring', () => {
    const order = fillOrder(positions, 3, 0.3)
    expect(order[2]).not.toBe(order[3])
    for (let i = 0; i < 4; i++) {
      const radial = [0, 0.5, 1, 1][i] * 0.7
      expect(order[i]).toBeGreaterThanOrEqual(radial)
      expect(order[i]).toBeLessThanOrEqual(radial + 0.3)
    }
  })

  it('is fixed by its seed', () => {
    expect(fillOrder(positions, 3, 0.3)).toEqual(fillOrder(positions, 3, 0.3))
    expect(fillOrder(positions, 4, 0.3)).not.toEqual(fillOrder(positions, 3, 0.3))
  })

  it('stays in [0, 1] for a single pixel at the center', () => {
    expect(Array.from(fillOrder(new Float32Array(3), 3, 0))).toEqual([0])
  })
})

describe('tunnelFade', () => {
  const fog = { near: 8, far: 30 }

  it('keeps nearby goals solid and hides goals at or beyond the fog end', () => {
    for (const depth of [-1, 0, 8]) expect(tunnelFade(depth, fog)).toBe(1)
    for (const depth of [30, 31, 500]) expect(tunnelFade(depth, fog)).toBe(0)
  })

  it('decreases smoothly with an exact half-opacity midpoint', () => {
    expect(tunnelFade(12, fog)).toBeGreaterThan(tunnelFade(19, fog))
    expect(tunnelFade(19, fog)).toBe(0.5)
    expect(tunnelFade(19, fog)).toBeGreaterThan(tunnelFade(26, fog))
  })

  it('hides the goals flying deep into the tunnel, so they never pile up at the center', () => {
    // Goal 1000 halfway through its flight is ~250 units away: fully in the fog.
    expect(tunnelFade(250, fog)).toBe(0)
  })

  it('by default leaves the assembled portrait untouched: it is closer than the fog start', () => {
    expect(TUNNEL_FOG.near).toBeGreaterThan(TUNNEL.cameraStart)
    expect(tunnelFade(TUNNEL.cameraStart)).toBe(1)
  })
})

describe('nearFade', () => {
  const fade = 1.5

  it('keeps a fill pixel solid while it is farther than `fade` from the camera', () => {
    expect(nearFade(1.5, fade)).toBe(1)
    expect(nearFade(5, fade)).toBe(1)
  })

  it('fades it out as it reaches the camera, and hides it behind the camera', () => {
    expect(nearFade(1, fade)).toBeGreaterThan(nearFade(0.5, fade))
    expect(nearFade(0.75, fade)).toBeCloseTo(0.5)
    expect(nearFade(0, fade)).toBe(0)
    expect(nearFade(-1, fade)).toBe(0)
  })
})
