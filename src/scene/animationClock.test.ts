import { describe, expect, it } from 'vitest'
import { createClock, restartClock, tickClock } from './animationClock.ts'

describe('tickClock', () => {
  it('starts at zero on the first frame, wherever the render clock stands', () => {
    const clock = createClock()
    tickClock(clock, 12.5, 4, false)

    expect(clock.elapsed).toBe(0)
  })

  it('follows the render clock and stops at the end', () => {
    const clock = createClock()
    tickClock(clock, 10, 4, false)
    tickClock(clock, 11.5, 4, false)
    expect(clock.elapsed).toBe(1.5)

    tickClock(clock, 20, 4, false)
    expect(clock.elapsed).toBe(4)
  })

  it('follows the current end: a longer timing keeps playing, a shorter one stays assembled', () => {
    const clock = createClock()
    tickClock(clock, 0, 4, false)
    tickClock(clock, 4, 4, false)

    tickClock(clock, 4.5, 6, false)
    expect(clock.elapsed).toBe(4.5)

    tickClock(clock, 5, 2, false)
    expect(clock.elapsed).toBeGreaterThanOrEqual(2)
  })

  it('shows the portrait assembled from the first frame with reduced motion', () => {
    const clock = createClock()
    tickClock(clock, 3, 4, true)
    expect(clock.elapsed).toBe(4)

    tickClock(clock, 4, 6, true)
    expect(clock.elapsed).toBe(6)
  })
})

describe('restartClock', () => {
  it('goes back to zero at once and replays from the next frame', () => {
    const clock = createClock()
    tickClock(clock, 0, 4, false)
    tickClock(clock, 9, 4, false)
    expect(clock.elapsed).toBe(4)

    restartClock(clock, 4, false)
    expect(clock.elapsed).toBe(0)

    tickClock(clock, 10, 4, false)
    expect(clock.elapsed).toBe(0)
    tickClock(clock, 11, 4, false)
    expect(clock.elapsed).toBe(1)
  })

  it('restarts mid-animation from zero', () => {
    const clock = createClock()
    tickClock(clock, 0, 4, false)
    tickClock(clock, 2, 4, false)

    restartClock(clock, 4, false)
    tickClock(clock, 2.5, 4, false)
    tickClock(clock, 3, 4, false)

    expect(clock.elapsed).toBe(0.5)
  })

  it('stays assembled with reduced motion', () => {
    const clock = createClock()
    restartClock(clock, 4, true)
    expect(clock.elapsed).toBe(4)

    tickClock(clock, 7, 4, true)
    expect(clock.elapsed).toBe(4)
  })
})
