import { describe, expect, it } from 'vitest'
import { createRandom } from '../lib/random.ts'
import { ASSEMBLY, ASSEMBLY_END, SCATTER, assemblyEnd, assemblyOffset, fillDelays, goalDelays, scatterStart } from './assemble.ts'

const targets = new Float32Array([0, 0, 0, 0.1, -0.2, 0, -0.3, 0.4, 0, 0.2, 0.45, 0])

describe('scatterStart', () => {
  it('gives every point a start position away from its place in the portrait', () => {
    const start = scatterStart(targets, 7)

    expect(start).toHaveLength(targets.length)
    for (let i = 0; i < targets.length; i += 3) {
      const distance = Math.hypot(start[i] - targets[i], start[i + 1] - targets[i + 1], start[i + 2] - targets[i + 2])
      expect(distance).toBeGreaterThan(0)
    }
  })

  it('is deterministic for the same seed', () => {
    expect(scatterStart(targets, 7)).toEqual(scatterStart(targets, 7))
    expect(scatterStart(targets, 7)).not.toEqual(scatterStart(targets, 8))
  })
})

describe('delays', () => {
  it('staggers the fill pixels within their window', () => {
    const delays = fillDelays(500, 3)

    expect(delays).toHaveLength(500)
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(0)
      expect(delay).toBeLessThanOrEqual(ASSEMBLY.fillStagger)
    }
    expect(fillDelays(500, 3)).toEqual(delays)
  })

  it('lands the goal pixels after the fill pixels start, in chronological order', () => {
    const delays = goalDelays(1000)

    expect(delays).toHaveLength(1000)
    expect(delays[0]).toBeCloseTo(ASSEMBLY.goalsStart)
    expect(delays[999]).toBeCloseTo(ASSEMBLY.goalsStart + ASSEMBLY.goalsStagger)
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeGreaterThan(delays[i - 1])
  })
})

describe('assemblyOffset', () => {
  it('keeps a point at its start until its delay passes', () => {
    expect(assemblyOffset(0, 0.5)).toBe(0)
    expect(assemblyOffset(0.5, 0.5)).toBe(0)
  })

  it('moves forward without overshooting while the point flies', () => {
    let previous = 0
    for (let t = 0.55; t < 0.5 + ASSEMBLY.duration; t += 0.05) {
      const offset = assemblyOffset(t, 0.5)
      expect(offset).toBeGreaterThan(previous)
      expect(offset).toBeLessThan(1)
      previous = offset
    }
  })

  it('ends with every point exactly in the portrait, which then stays still', () => {
    const delays = [...fillDelays(500, 3), ...goalDelays(1000)]

    for (const delay of delays) {
      expect(assemblyOffset(ASSEMBLY_END, delay)).toBe(1)
      expect(assemblyOffset(ASSEMBLY_END + 60, delay)).toBe(1)
    }
  })
})

describe('configurable assembly', () => {
  it('keeps the previous start positions, delays and timing when no option is given', () => {
    const random = createRandom(7)
    const expected = new Float32Array(targets.length)
    for (let i = 0; i < expected.length; i += 3) {
      expected[i] = (random() - 0.5) * 2.6
      expected[i + 1] = (random() - 0.5) * 1.6
      expected[i + 2] = -0.5 - random() * 2.5
    }
    expect(scatterStart(targets, 7)).toEqual(expected)
    expect(SCATTER).toEqual({ x: 2.6, y: 1.6, z: 2.5 })

    const delays = createRandom(3)
    expect(fillDelays(5, 3)).toEqual(new Float32Array(5).map(() => delays() * 1.3))
    expect(goalDelays(3)).toEqual(new Float32Array([1, 1.7, 2.4]))
    expect(assemblyEnd(ASSEMBLY)).toBe(ASSEMBLY_END)
    expect(assemblyOffset(1, 0.5)).toBe(assemblyOffset(1, 0.5, ASSEMBLY.duration))
  })

  it('scatters the start positions within the requested amplitudes, always behind the portrait', () => {
    const wide = new Float32Array(3000)
    const start = scatterStart(wide, 7, { x: 10, y: 4, z: 1 })

    for (let i = 0; i < start.length; i += 3) {
      expect(Math.abs(start[i])).toBeLessThanOrEqual(5)
      expect(Math.abs(start[i + 1])).toBeLessThanOrEqual(2)
      expect(start[i + 2]).toBeLessThanOrEqual(-0.5)
      expect(start[i + 2]).toBeGreaterThanOrEqual(-1.5)
    }
    expect(Math.max(...start.filter((_, i) => i % 3 === 0))).toBeGreaterThan(2.6 / 2)
    expect(scatterStart(wide, 7, { x: 0, y: 0, z: 0 }).every((value, i) => value === (i % 3 === 2 ? -0.5 : 0))).toBe(true)
    expect(scatterStart(targets, 7, { x: 3, y: 1, z: 2 })).toEqual(scatterStart(targets, 7, { x: 3, y: 1, z: 2 }))
  })

  it('staggers the fill pixels within the requested window', () => {
    const delays = fillDelays(500, 3, 0.4)

    expect(Math.max(...delays)).toBeLessThanOrEqual(0.4)
    expect(Math.max(...delays)).toBeGreaterThan(0.3)
    expect(fillDelays(500, 3, 0).every((delay) => delay === 0)).toBe(true)
  })

  it('spreads the goal pixels between the requested start and stagger', () => {
    const delays = goalDelays(11, { goalsStart: 2, goalsStagger: 5 })

    expect(delays[0]).toBeCloseTo(2)
    expect(delays[5]).toBeCloseTo(4.5)
    expect(delays[10]).toBeCloseTo(7)
    expect(goalDelays(1, { goalsStart: 2, goalsStagger: 5 })[0]).toBe(2)
  })

  it('flies for the requested duration and lands every point at the requested end', () => {
    const timing = { duration: 4, fillStagger: 0.5, goalsStart: 2, goalsStagger: 3 }

    expect(assemblyEnd(timing)).toBe(5 + 4)
    expect(assemblyEnd({ ...timing, fillStagger: 20 })).toBe(24)
    expect(assemblyOffset(1, 0, 2)).toBeCloseTo(assemblyOffset(0.25, 0, 0.5))
    expect(assemblyOffset(0.99, 0, 2)).toBeLessThan(1)
    expect(assemblyOffset(2, 0, 2)).toBe(1)
    for (const delay of [...fillDelays(100, 3, timing.fillStagger), ...goalDelays(100, timing)]) {
      expect(assemblyOffset(assemblyEnd(timing), delay, timing.duration)).toBe(1)
    }
  })
})
