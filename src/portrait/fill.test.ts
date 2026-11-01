import { describe, expect, it } from 'vitest'
import { EDGE_DISPERSION, FILL_SIZE, disperseEdges, fillSizes } from './fill.ts'

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
