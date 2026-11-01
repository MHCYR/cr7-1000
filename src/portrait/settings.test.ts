import { describe, expect, it } from 'vitest'
import { goalDelays, scatterStart, ASSEMBLY, SCATTER } from './assemble.ts'
import { EDGE_DISPERSION, EDGE_SHRINK, FILL_SIZE, disperseEdges, fillSizes } from './fill.ts'
import { EDGE_BAND, FILL_DENSITY } from './sample.ts'
import { bufferSeeds, buildBuffers, defaultSettings, samplingOptions } from './settings.ts'

const fill = {
  count: 3,
  positions: new Float32Array([0, 0, 0, 0.1, 0.2, 0, -0.1, 0.3, 0]),
  colors: new Float32Array(9),
  edge: new Float32Array([1, 0.5, 0]),
}
const portrait = { aspect: 1, cellSize: 0.01, fill, goals: { count: 4, positions: new Float32Array(12) } }

describe('defaultSettings', () => {
  it('takes every value from the current constants', () => {
    expect(defaultSettings()).toEqual({
      assembly: { ...ASSEMBLY },
      scatter: { ...SCATTER },
      fill: { size: { ...FILL_SIZE }, dispersion: EDGE_DISPERSION, shrink: EDGE_SHRINK },
      sampling: { density: FILL_DENSITY.desktop, edgeBand: EDGE_BAND },
      fit: { height: 0.88, width: 0.92 },
      seed: 1000,
    })
  })

  it('survives a JSON round trip, so it can be copied as a whole', () => {
    expect(JSON.parse(JSON.stringify(defaultSettings()))).toEqual(defaultSettings())
  })

  it('hands out independent copies, so editing one never changes the defaults', () => {
    const edited = defaultSettings()
    edited.fill.size.max = 9
    edited.assembly.duration = 9

    expect(defaultSettings().fill.size.max).toBe(FILL_SIZE.max)
    expect(defaultSettings().assembly.duration).toBe(ASSEMBLY.duration)
    expect(FILL_SIZE.max).toBe(1.2)
  })
})

describe('bufferSeeds', () => {
  it('keeps the seeds the buffers always used for the default seed', () => {
    expect(bufferSeeds(1000)).toEqual({ fillStart: 1, fillDelays: 2, goalStart: 3, disperse: 4, fillSizes: 5 })
  })

  it('derives other seeds repeatably and without overlap between buffers or seeds', () => {
    const seen = new Set<number>()
    for (const seed of [0, 1, 999, 1001, 1002, 123456]) {
      expect(bufferSeeds(seed)).toEqual(bufferSeeds(seed))
      for (const value of Object.values(bufferSeeds(seed))) seen.add(value)
    }
    expect(seen.size).toBe(6 * 5)
  })
})

describe('samplingOptions', () => {
  it('turns the settings into the options of samplePortrait', () => {
    const settings = defaultSettings()
    expect(samplingOptions(settings)).toEqual({ fillCount: 50_000, edgeBand: 8, seed: 1000 })

    settings.sampling.density = 12_000
    settings.sampling.edgeBand = 3
    settings.seed = 77
    expect(samplingOptions(settings)).toEqual({ fillCount: 12_000, edgeBand: 3, seed: 77 })
  })
})

describe('buildBuffers', () => {
  it('builds exactly the buffers the scene built before the settings existed', () => {
    const buffers = buildBuffers(portrait, defaultSettings())
    const dispersed = disperseEdges(fill.positions, fill.edge, 0.01, 4)

    expect(buffers.fillPositions).toEqual(dispersed)
    expect(buffers.fillStart).toEqual(scatterStart(dispersed, 1))
    expect(buffers.fillSizes).toEqual(fillSizes(fill.edge, 5))
    expect(buffers.goalStart).toEqual(scatterStart(portrait.goals.positions, 3))
    expect(buffers.goalDelays).toEqual(goalDelays(4))
    expect(buffers.fillDelays).toHaveLength(3)
    expect(buffers.fillDelays.every((delay) => delay >= 0 && delay <= 1.3)).toBe(true)
  })

  it('applies every changed setting and stays repeatable', () => {
    const settings = defaultSettings()
    settings.scatter = { x: 0, y: 0, z: 0 }
    settings.assembly.goalsStart = 5
    settings.assembly.fillStagger = 0
    settings.fill.size = { min: 1, max: 1 }
    settings.fill.shrink = 0
    settings.fill.dispersion = 0

    const buffers = buildBuffers(portrait, settings)

    expect(buffers.fillPositions).toEqual(fill.positions)
    expect(buffers.fillStart.every((value, i) => value === (i % 3 === 2 ? -0.5 : 0))).toBe(true)
    expect(buffers.goalStart.every((value, i) => value === (i % 3 === 2 ? -0.5 : 0))).toBe(true)
    expect(buffers.fillDelays.every((delay) => delay === 0)).toBe(true)
    expect(buffers.goalDelays[0]).toBe(5)
    expect(buffers.fillSizes.every((size) => size === 1)).toBe(true)
    expect(buildBuffers(portrait, settings)).toEqual(buffers)
  })

  it('reshuffles the random buffers for another seed', () => {
    const settings = defaultSettings()
    const base = buildBuffers(portrait, settings)
    settings.seed = 1001
    const other = buildBuffers(portrait, settings)

    expect(other.fillStart).not.toEqual(base.fillStart)
    expect(other.goalStart).not.toEqual(base.goalStart)
    expect(other.fillDelays).not.toEqual(base.fillDelays)
    expect(other.fillSizes).not.toEqual(base.fillSizes)
    expect(other.fillPositions).not.toEqual(base.fillPositions)
    expect(other.goalDelays).toEqual(base.goalDelays)
  })
})
