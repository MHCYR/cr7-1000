import { describe, expect, it } from 'vitest'
import { createRandom } from '../lib/random.ts'
import { EDGE_DISPERSION, EDGE_SHRINK, FILL_SIZE, disperseEdges, fillSizes } from './fill.ts'

const interior = new Float32Array(400)
const edge = new Float32Array(400).fill(1)

describe('fillSizes', () => {
  it('gives the fill pixels random sizes within the range', () => {
    const sizes = fillSizes(interior, 5)

    expect(sizes).toHaveLength(400)
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(FILL_SIZE.min)
      expect(size).toBeLessThanOrEqual(FILL_SIZE.max)
    }
    expect(new Set(sizes).size).toBeGreaterThan(300)
  })

  it('shrinks the fill pixels on the edge of the figure', () => {
    const mean = (values: Float32Array) => values.reduce((sum, value) => sum + value, 0) / values.length

    expect(mean(fillSizes(edge, 5))).toBeLessThan(mean(fillSizes(interior, 5)) * 0.75)
  })

  it('is deterministic for the same seed', () => {
    expect(fillSizes(interior, 5)).toEqual(fillSizes(interior, 5))
    expect(fillSizes(interior, 5)).not.toEqual(fillSizes(interior, 6))
  })
})

describe('disperseEdges', () => {
  const cellSize = 0.01
  const positions = new Float32Array(400 * 3).map((_, i) => (i % 3 === 2 ? 0 : (i % 7) * 0.05))

  function distances(dispersed: Float32Array): number[] {
    const result: number[] = []
    for (let i = 0; i < positions.length; i += 3) {
      result.push(Math.hypot(dispersed[i] - positions[i], dispersed[i + 1] - positions[i + 1]))
    }
    return result
  }

  it('leaves the fill pixels inside the figure in their cells', () => {
    expect(disperseEdges(positions, interior, cellSize, 9)).toEqual(positions)
  })

  it('scatters the fill pixels on the edge, at most EDGE_DISPERSION cells away, in the portrait plane', () => {
    const dispersed = disperseEdges(positions, edge, cellSize, 9)

    const moved = distances(dispersed)
    expect(moved.filter((distance) => distance > 0).length).toBeGreaterThan(390)
    for (const distance of moved) expect(distance).toBeLessThanOrEqual(EDGE_DISPERSION * cellSize + 1e-6)
    for (let i = 2; i < dispersed.length; i += 3) expect(dispersed[i]).toBe(0)
  })

  it('scatters less the farther a pixel is from the edge', () => {
    const half = new Float32Array(400).fill(0.5)
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

    expect(mean(distances(disperseEdges(positions, half, cellSize, 9)))).toBeLessThan(
      mean(distances(disperseEdges(positions, edge, cellSize, 9))),
    )
  })

  it('is deterministic for the same seed', () => {
    expect(disperseEdges(positions, edge, cellSize, 9)).toEqual(disperseEdges(positions, edge, cellSize, 9))
  })
})

describe('configurable fill', () => {
  const cellSize = 0.01
  const positions = new Float32Array(400 * 3).map((_, i) => (i % 3 === 2 ? 0 : (i % 7) * 0.05))
  const half = new Float32Array(400).fill(0.5)

  it('keeps the previous sizes and dispersion when no option is given', () => {
    expect([FILL_SIZE, EDGE_DISPERSION, EDGE_SHRINK]).toEqual([{ min: 0.5, max: 1.2 }, 6, 0.5])

    const sizeRandom = createRandom(5)
    expect(fillSizes(half, 5)).toEqual(half.map((e) => (0.5 + sizeRandom() * 0.7) * (1 - 0.5 * e)))

    const scatterRandom = createRandom(9)
    const expected = new Float32Array(positions)
    for (let i = 0; i < half.length; i++) {
      const angle = scatterRandom() * 2 * Math.PI
      const distance = Math.sqrt(scatterRandom()) * 6 * cellSize * half[i] ** 2
      expected[i * 3] += Math.cos(angle) * distance
      expected[i * 3 + 1] += Math.sin(angle) * distance
    }
    expect(disperseEdges(positions, half, cellSize, 9)).toEqual(expected)
  })

  it('draws sizes from the requested range', () => {
    const sizes = fillSizes(interior, 5, { min: 2, max: 3 })

    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(2)
    expect(Math.max(...sizes)).toBeLessThanOrEqual(3)
    expect(Math.max(...sizes)).toBeGreaterThan(2.9)
    expect(fillSizes(interior, 5, { min: 1, max: 1 }).every((size) => size === 1)).toBe(true)
  })

  it('shrinks the edge pixels by the requested amount', () => {
    const size = { min: 1, max: 1 }

    expect(fillSizes(edge, 5, size, 0).every((s) => s === 1)).toBe(true)
    expect(fillSizes(edge, 5, size, 1).every((s) => s === 0)).toBe(true)
    expect(fillSizes(half, 5, size, 0.4)[0]).toBeCloseTo(0.8)
    expect(fillSizes(interior, 5, size, 1).every((s) => s === 1)).toBe(true)
  })

  it('scatters the edge pixels up to the requested distance', () => {
    const farthest = (dispersion: number) => {
      const dispersed = disperseEdges(positions, edge, cellSize, 9, dispersion)
      return Math.max(...positions.map((_, i) => (i % 3 === 0 ? Math.hypot(dispersed[i] - positions[i], dispersed[i + 1] - positions[i + 1]) : 0)))
    }

    expect(farthest(2)).toBeLessThanOrEqual(2 * cellSize + 1e-6)
    expect(farthest(2)).toBeGreaterThan(1.5 * cellSize)
    expect(farthest(20)).toBeGreaterThan(10 * cellSize)
    expect(disperseEdges(positions, edge, cellSize, 9, 0)).toEqual(positions)
  })
})
