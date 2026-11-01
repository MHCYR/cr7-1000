import { describe, expect, it } from 'vitest'
import { goalDelays, scatterStart, ASSEMBLY, SCATTER } from './assemble.ts'
import { EDGE_DISPERSION, EDGE_SHRINK, FILL_SIZE, disperseEdges, fillSizes } from './fill.ts'
import { EDGE_BAND, FILL_DENSITY, samplePortrait } from './sample.ts'
import { FILL_ZOOM, fillOrder } from '../tunnel/tunnel.ts'
import {
  PORTRAIT_DEFAULTS,
  type PortraitSettings,
  SEED_MAX,
  bufferSeeds,
  buildBuffers,
  defaultSettings,
  samplingOptions,
  serializeSettings,
} from './settings.ts'

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
      initialOpacity: 0.35,
      zoom: { ...FILL_ZOOM },
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

  it('is the canonical PORTRAIT_DEFAULTS, and editing a copy leaves it untouched', () => {
    expect(defaultSettings()).toEqual(PORTRAIT_DEFAULTS)
    expect(defaultSettings()).not.toBe(PORTRAIT_DEFAULTS)

    const edited = defaultSettings()
    edited.scatter.x = 9
    edited.fill.size.min = 9
    expect(PORTRAIT_DEFAULTS.scatter.x).toBe(SCATTER.x)
    expect(PORTRAIT_DEFAULTS.fill.size.min).toBe(FILL_SIZE.min)
    expect(SCATTER.x).toBe(2.6)
  })
})

describe('bufferSeeds', () => {
  it('keeps the seeds the buffers always used for the default seed', () => {
    expect(bufferSeeds(1000)).toEqual({ fillStart: 1, fillDelays: 2, goalStart: 3, disperse: 4, fillSizes: 5, fillOrder: 6 })
  })

  it('derives other seeds repeatably and without overlap between buffers or seeds', () => {
    const seen = new Set<number>()
    for (const seed of [0, 1, 999, 1001, 1002, 123456]) {
      expect(bufferSeeds(seed)).toEqual(bufferSeeds(seed))
      for (const value of Object.values(bufferSeeds(seed))) seen.add(value)
    }
    expect(seen.size).toBe(6 * 6)
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
    expect(buffers.fillOrder).toEqual(fillOrder(dispersed, 6, FILL_ZOOM.jitter))
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
    settings.zoom.jitter = 0

    const buffers = buildBuffers(portrait, settings)

    expect(buffers.fillPositions).toEqual(fill.positions)
    expect(buffers.fillStart.every((value, i) => value === (i % 3 === 2 ? -0.5 : 0))).toBe(true)
    expect(buffers.goalStart.every((value, i) => value === (i % 3 === 2 ? -0.5 : 0))).toBe(true)
    expect(buffers.fillDelays.every((delay) => delay === 0)).toBe(true)
    expect(buffers.goalDelays[0]).toBe(5)
    expect(buffers.fillSizes.every((size) => size === 1)).toBe(true)
    expect(buffers.fillOrder).toEqual(fillOrder(fill.positions, 6, 0))
    expect(buildBuffers(portrait, settings)).toEqual(buffers)
  })

  it('ignores the settings that only reach the shader, so they never rebuild a buffer', () => {
    const settings = defaultSettings()
    const base = buildBuffers(portrait, settings)
    settings.assembly.duration = 9
    settings.initialOpacity = 1
    settings.fit = { height: 0.5, width: 0.5 }
    settings.zoom = { ...settings.zoom, zoomEnd: 0.1, zoomDepth: 1, flyEnd: 0.9, flight: 0.05, reach: 9, fade: 3 }

    expect(buildBuffers(portrait, settings)).toEqual(base)
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
    expect(other.fillOrder).not.toEqual(base.fillOrder)
    expect(other.fillPositions).not.toEqual(base.fillPositions)
    expect(other.goalDelays).toEqual(base.goalDelays)
  })
})

// A disk of changing colors: big enough for 1000 goals plus the fill, and different at every cell.
const photo = (() => {
  const size = 100
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside = (x - 50) ** 2 + (y - 50) ** 2 < 45 ** 2
      data.set([x * 2, y * 2, (x * y) % 256, inside ? 255 : 0], (y * size + x) * 4)
    }
  }
  return { width: size, height: size, data }
})()

const DECLARATION = 'export const PORTRAIT_DEFAULTS: PortraitSettings = '

/** What pasting the declaration over the constant in settings.ts gives: the value it declares. */
function pasted(source: string): PortraitSettings {
  expect(source.startsWith(DECLARATION)).toBe(true)
  return new Function(`return ${source.slice(DECLARATION.length)}`)()
}

const custom: PortraitSettings = {
  assembly: { duration: 2.35, fillStagger: 0.7, goalsStart: 1.15, goalsStagger: 2.05 },
  scatter: { x: 3.1, y: 0.9, z: 4.25 },
  fill: { size: { min: 0.35, max: 0.8 }, dispersion: 3.3, shrink: 0.15 },
  sampling: { density: 400, edgeBand: 3 },
  fit: { height: 0.7, width: 0.81 },
  initialOpacity: 0.6,
  zoom: { zoomEnd: 0.3, zoomDepth: 1.75, flyEnd: 0.8, flight: 0.15, reach: 7.25, fade: 0.8, jitter: 0.6 },
  seed: 4242,
}

describe('serializeSettings', () => {
  it('writes the exact declaration to paste over PORTRAIT_DEFAULTS in settings.ts', () => {
    expect(serializeSettings(defaultSettings())).toBe(`${DECLARATION}{
  assembly: {
    duration: 1.6,
    fillStagger: 1.3,
    goalsStart: 1,
    goalsStagger: 1.4,
  },
  scatter: {
    x: 2.6,
    y: 1.6,
    z: 2.5,
  },
  fill: {
    size: {
      min: 0.5,
      max: 1.2,
    },
    dispersion: 6,
    shrink: 0.5,
  },
  sampling: {
    density: 50000,
    edgeBand: 8,
  },
  fit: {
    height: 0.88,
    width: 0.92,
  },
  initialOpacity: 0.35,
  zoom: {
    zoomEnd: 0.25,
    zoomDepth: 2.5,
    flyEnd: 0.75,
    flight: 0.2,
    reach: 5.5,
    fade: 1.5,
    jitter: 0.3,
  },
  seed: 1000,
}`)
  })

  it('pasted back, rebuilds the same portrait: same sample and same buffers', () => {
    const back = pasted(serializeSettings(custom))
    expect(back).toEqual(custom)

    const portrait = samplePortrait(photo, samplingOptions(custom))
    const again = samplePortrait(photo, samplingOptions(back))
    expect(again).toEqual(portrait)
    expect(buildBuffers(again, back)).toEqual(buildBuffers(portrait, custom))
    // The custom values really change the portrait, so the comparison above proves something.
    expect(portrait.fill.count).not.toBe(samplePortrait(photo, samplingOptions(defaultSettings())).fill.count)
    expect(buildBuffers(portrait, custom).fillSizes).not.toEqual(buildBuffers(portrait, defaultSettings()).fillSizes)
  })

  it('keeps fractions exactly, as a number JS reads back unchanged', () => {
    const settings = { ...custom, initialOpacity: 0.1 + 0.2, seed: SEED_MAX }
    expect(pasted(serializeSettings(settings))).toEqual(settings)
  })

  it('refuses a value that cannot be written as a number, instead of writing a wrong portrait', () => {
    const broken = { ...custom, initialOpacity: Number.NaN }
    expect(() => serializeSettings(broken)).toThrow(RangeError)
  })
})

describe('SEED_MAX', () => {
  it('is the last seed whose buffer seeds never wrap onto another seed', () => {
    const wrapped = (seed: number) => Object.values(bufferSeeds(seed)).map((value) => value >>> 0)
    expect(SEED_MAX).toBe(2 ** 29 - 1)
    expect(new Set([...wrapped(0), ...wrapped(1), ...wrapped(SEED_MAX - 1), ...wrapped(SEED_MAX)]).size).toBe(4 * 6)
    expect(wrapped(SEED_MAX + 1)).toEqual(wrapped(0))
  })
})
