import { describe, expect, it } from 'vitest'
import { FILL_ZOOM, TUNNEL, currentGoal, fillZoom, nearFade, scrollHeight, scrollState, tunnelPositions } from './tunnel.ts'

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
    for (let i = 0; i < positions.length; i += 3) {
      const radius = Math.hypot(positions[i], positions[i + 1])
      expect(radius).toBeGreaterThanOrEqual(TUNNEL.radius.min - 1e-6)
      expect(radius).toBeLessThanOrEqual(TUNNEL.radius.max + 1e-6)
    }
    expect(new Set(Array.from({ length: 10 }, (_, i) => positions[i * 3])).size).toBe(10)
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

describe('fillZoom', () => {
  const zoom = { end: 0.6, travel: 6 }

  it('leaves the portrait in place at the top of the page', () => {
    expect(fillZoom(0, zoom)).toBe(0)
    expect(fillZoom(-0.2, zoom)).toBe(0)
  })

  it('brings the fill pixels toward the camera as the goals fly, so the camera enters the image', () => {
    const steps = [0.1, 0.2, 0.3, 0.4, 0.5].map((progress) => fillZoom(progress, zoom))
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1])
    expect(fillZoom(0.3, zoom)).toBeCloseTo(3)
  })

  it('finishes before the goals land: from `end` on, the fill sits `travel` past the portrait', () => {
    expect(fillZoom(0.6, zoom)).toBe(6)
    expect(fillZoom(0.8, zoom)).toBe(6)
    expect(fillZoom(1, zoom)).toBe(6)
  })

  it('is reversible: the same progress always gives the same offset', () => {
    fillZoom(1, zoom)
    expect(fillZoom(0.3, zoom)).toBe(fillZoom(0.3, zoom))
    expect(fillZoom(0, zoom)).toBe(0)
  })

  it('by default takes every fill pixel past the camera before the goals land', () => {
    expect(FILL_ZOOM.end).toBeLessThan(1)
    expect(fillZoom(FILL_ZOOM.end, FILL_ZOOM)).toBeGreaterThan(TUNNEL.cameraStart)
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
