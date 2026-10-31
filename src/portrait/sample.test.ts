import { describe, expect, it } from 'vitest'
import { type ImageLike, samplePortrait } from './sample.ts'

type Rgba = [number, number, number, number]

// Builds a synthetic image, so no test depends on the local-only placeholder photo.
function makeImage(width: number, height: number, paint: (x: number, y: number) => Rgba): ImageLike {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data.set(paint(x, y), (y * width + x) * 4)
  }
  return { width, height, data }
}

const opaque = makeImage(200, 200, () => [255, 255, 255, 255])

function points(positions: Float32Array): [number, number][] {
  const result: [number, number][] = []
  for (let i = 0; i < positions.length; i += 3) result.push([positions[i], positions[i + 1]])
  return result
}

describe('samplePortrait', () => {
  it('produces no dust or goal pixels where the image is transparent', () => {
    const halfTransparent = makeImage(200, 200, (x) => (x < 100 ? [0, 0, 0, 0] : [255, 0, 0, 255]))
    const portrait = samplePortrait(halfTransparent, { dustCount: 8000 })

    expect(portrait.dust.count).toBeGreaterThan(0)
    for (const [x] of [...points(portrait.dust.positions), ...points(portrait.goals.positions)]) {
      expect(x).toBeGreaterThan(0)
    }
  })

  it('colors each dust point with the color of the photo at that cell', () => {
    const redOverBlue = makeImage(200, 200, (_, y) => (y < 100 ? [255, 0, 0, 255] : [0, 0, 255, 255]))
    const { dust } = samplePortrait(redOverBlue, { dustCount: 8000 })

    points(dust.positions).forEach(([, y], i) => {
      const color = Array.from(dust.colors.slice(i * 3, i * 3 + 3))
      expect(color).toEqual(y > 0 ? [1, 0, 0] : [0, 0, 1])
    })
  })

  it('places exactly 1000 goal pixels inside the figure, ordered from the bottom up', () => {
    const inCircle = (x: number, y: number) => (x - 100) ** 2 + (y - 100) ** 2 < 90 ** 2
    const circle = makeImage(200, 200, (x, y) => (inCircle(x, y) ? [255, 255, 255, 255] : [0, 0, 0, 0]))
    const { goals } = samplePortrait(circle, { dustCount: 8000 })

    expect(goals.count).toBe(1000)
    const goalPoints = points(goals.positions)
    expect(goalPoints).toHaveLength(1000)
    goalPoints.forEach(([x, y], i) => {
      // Back to the sampled pixel: the portrait is centered and 1 unit tall, with y up.
      expect(inCircle(Math.floor(x * 200 + 100), Math.floor(100 - y * 200))).toBe(true)
      if (i > 0) expect(y).toBeGreaterThanOrEqual(goalPoints[i - 1][1])
    })
    expect(goalPoints[0][1]).toBeLessThan(-0.3)
    expect(goalPoints[999][1]).toBeGreaterThan(0.3)
  })

  it('never puts a goal pixel on top of a dust point', () => {
    const { dust, goals } = samplePortrait(opaque, { dustCount: 8000 })
    const dustKeys = new Set(points(dust.positions).map((point) => point.join()))
    for (const point of points(goals.positions)) expect(dustKeys.has(point.join())).toBe(false)
  })

  it('follows the requested dust density', () => {
    for (const dustCount of [5000, 20000]) {
      const { dust } = samplePortrait(opaque, { dustCount })
      expect(Math.abs(dust.count - dustCount) / dustCount).toBeLessThan(0.1)
    }
  })

  it('is deterministic for the same image and density', () => {
    const first = samplePortrait(opaque, { dustCount: 8000 })
    const second = samplePortrait(opaque, { dustCount: 8000 })
    expect(second).toEqual(first)
  })

  it('reports the aspect ratio of the image', () => {
    const wide = makeImage(300, 150, () => [255, 255, 255, 255])
    expect(samplePortrait(wide, { dustCount: 8000 }).aspect).toBe(2)
  })

  it('fails when the figure is too small to hold every goal pixel', () => {
    const tiny = makeImage(200, 200, (x, y) => (x < 20 && y < 20 ? [255, 255, 255, 255] : [0, 0, 0, 0]))
    expect(() => samplePortrait(tiny, { dustCount: 100 })).toThrow(
      'The figure has 400 cells, fewer than the 1000 goal pixels it must hold',
    )
  })
})
