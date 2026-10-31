import { describe, expect, it } from 'vitest'
import { ASSEMBLY, ASSEMBLY_END, assemblyOffset, dustDelays, goalDelays, scatterStart } from './assemble.ts'

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
  it('staggers the dust within the dust window', () => {
    const delays = dustDelays(500, 3)

    expect(delays).toHaveLength(500)
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(0)
      expect(delay).toBeLessThanOrEqual(ASSEMBLY.dustStagger)
    }
    expect(dustDelays(500, 3)).toEqual(delays)
  })

  it('lands the goal pixels after the dust starts, in chronological order', () => {
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
    const delays = [...dustDelays(500, 3), ...goalDelays(1000)]

    for (const delay of delays) {
      expect(assemblyOffset(ASSEMBLY_END, delay)).toBe(1)
      expect(assemblyOffset(ASSEMBLY_END + 60, delay)).toBe(1)
    }
  })
})
