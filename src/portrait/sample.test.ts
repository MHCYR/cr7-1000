import { describe, expect, it } from 'vitest'
import { EDGE_BAND, type ImageLike, samplePortrait } from './sample.ts'

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
  it('produces no fill or goal pixels where the image is transparent', () => {
    const halfTransparent = makeImage(200, 200, (x) => (x < 100 ? [0, 0, 0, 0] : [255, 0, 0, 255]))
    const portrait = samplePortrait(halfTransparent, { fillCount: 8000 })

    expect(portrait.fill.count).toBeGreaterThan(0)
    for (const [x] of [...points(portrait.fill.positions), ...points(portrait.goals.positions)]) {
      expect(x).toBeGreaterThan(0)
    }
  })

  it('colors each fill pixel with the color of the photo at that cell', () => {
    const redOverBlue = makeImage(200, 200, (_, y) => (y < 100 ? [255, 0, 0, 255] : [0, 0, 255, 255]))
    const { fill } = samplePortrait(redOverBlue, { fillCount: 8000 })

    points(fill.positions).forEach(([, y], i) => {
      const color = Array.from(fill.colors.slice(i * 3, i * 3 + 3))
      expect(color).toEqual(y > 0 ? [1, 0, 0] : [0, 0, 1])
    })
  })

  it('places exactly 1000 goal pixels inside the figure, ordered from the bottom up', () => {
    const inCircle = (x: number, y: number) => (x - 100) ** 2 + (y - 100) ** 2 < 90 ** 2
    const circle = makeImage(200, 200, (x, y) => (inCircle(x, y) ? [255, 255, 255, 255] : [0, 0, 0, 0]))
    const { goals } = samplePortrait(circle, { fillCount: 8000 })

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

  it('never puts a goal pixel on top of a fill pixel', () => {
    const { fill, goals } = samplePortrait(opaque, { fillCount: 8000 })
    const fillKeys = new Set(points(fill.positions).map((point) => point.join()))
    for (const point of points(goals.positions)) expect(fillKeys.has(point.join())).toBe(false)
  })

  it('follows the requested fill density', () => {
    for (const fillCount of [5000, 20000]) {
      const { fill } = samplePortrait(opaque, { fillCount })
      expect(Math.abs(fill.count - fillCount) / fillCount).toBeLessThan(0.1)
    }
  })

  it('marks how close each fill pixel is to the edge of the figure', () => {
    const inCircle = (x: number, y: number) => (x - 100) ** 2 + (y - 100) ** 2 < 90 ** 2
    const circle = makeImage(200, 200, (x, y) => (inCircle(x, y) ? [255, 255, 255, 255] : [0, 0, 0, 0]))
    const { fill, cellSize } = samplePortrait(circle, { fillCount: 8000 })

    expect(fill.edge).toHaveLength(fill.count)
    points(fill.positions).forEach(([x, y], i) => {
      const edge = fill.edge[i]
      expect(edge).toBeGreaterThanOrEqual(0)
      expect(edge).toBeLessThanOrEqual(1)
      // Distance from this cell to the border of the circle, in grid cells.
      const inside = (0.45 - Math.hypot(x, y)) / cellSize
      // On a curved edge the closest background cell can be one step further away.
      if (inside < 0.3) expect(edge).toBeGreaterThanOrEqual(1 - 1 / EDGE_BAND)
      if (inside > EDGE_BAND + 2) expect(edge).toBe(0)
    })
  })

  it('treats the border of the image as an edge of the figure', () => {
    const { fill, cellSize } = samplePortrait(opaque, { fillCount: 8000 })

    points(fill.positions).forEach(([x, y], i) => {
      const inside = (0.5 - Math.max(Math.abs(x), Math.abs(y))) / cellSize
      if (inside < 1) expect(fill.edge[i]).toBe(1)
      if (inside > EDGE_BAND + 1) expect(fill.edge[i]).toBe(0)
    })
  })

  it('is deterministic for the same image and density', () => {
    const first = samplePortrait(opaque, { fillCount: 8000 })
    const second = samplePortrait(opaque, { fillCount: 8000 })
    expect(second).toEqual(first)
  })

  it('reports the aspect ratio of the image', () => {
    const wide = makeImage(300, 150, () => [255, 255, 255, 255])
    expect(samplePortrait(wide, { fillCount: 8000 }).aspect).toBe(2)
  })

  it('fails when the figure is too small to hold every goal pixel', () => {
    const tiny = makeImage(200, 200, (x, y) => (x < 20 && y < 20 ? [255, 255, 255, 255] : [0, 0, 0, 0]))
    expect(() => samplePortrait(tiny, { fillCount: 100 })).toThrow(
      'The figure has 400 cells, fewer than the 1000 goal pixels it must hold',
    )
  })
})

describe('samplePortrait options', () => {
  it('keeps the previous seed and edge band when they are not given', () => {
    const base = samplePortrait(opaque, { fillCount: 8000 })

    expect(EDGE_BAND).toBe(8)
    expect(samplePortrait(opaque, { fillCount: 8000, seed: 1000, edgeBand: 8 })).toEqual(base)
  })

  it('spreads the goal pixels differently for another seed, repeatably', () => {
    const base = samplePortrait(opaque, { fillCount: 8000 })
    const other = samplePortrait(opaque, { fillCount: 8000, seed: 1001 })

    expect(samplePortrait(opaque, { fillCount: 8000, seed: 1001 })).toEqual(other)
    expect(other.goals.positions).not.toEqual(base.goals.positions)
    expect(other.goals.count).toBe(base.goals.count)
    expect(other.fill.count).toBe(base.fill.count)
  })

  it('narrows or widens the edge band without moving any pixel', () => {
    const base = samplePortrait(opaque, { fillCount: 8000 })
    const narrow = samplePortrait(opaque, { fillCount: 8000, edgeBand: 2 })
    const wide = samplePortrait(opaque, { fillCount: 8000, edgeBand: 20 })
    const onEdge = (edge: Float32Array) => edge.filter((value) => value > 0).length

    expect(narrow.fill.positions).toEqual(base.fill.positions)
    expect(wide.goals.positions).toEqual(base.goals.positions)
    expect(onEdge(narrow.fill.edge)).toBeLessThan(onEdge(base.fill.edge))
    expect(onEdge(base.fill.edge)).toBeLessThan(onEdge(wide.fill.edge))
    expect(Math.max(...narrow.fill.edge)).toBe(1)
    expect(Math.min(...narrow.fill.edge)).toBe(0)
  })

  it('has no edge at all when the band is zero wide', () => {
    const { fill } = samplePortrait(opaque, { fillCount: 8000, edgeBand: 0 })

    expect(fill.edge.every((value) => value === 0)).toBe(true)
  })
})
