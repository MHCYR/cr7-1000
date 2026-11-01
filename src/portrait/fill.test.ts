import { describe, expect, it } from 'vitest'
import { EDGE_DISPERSION, FILL_KEEP, FILL_SIZE, GLITCH_BAND, disperseEdges, fillSizes, thinFill } from './fill.ts'

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

describe('thinFill', () => {
  // A 200 x 200 grid whose colors and edge encode the cell, to check they stay aligned.
  const cellSize = 0.005
  const side = 200
  const grid = {
    count: side * side,
    positions: new Float32Array(side * side * 3),
    colors: new Float32Array(side * side * 3),
    edge: new Float32Array(side * side),
  }
  for (let row = 0; row < side; row++) {
    for (let column = 0; column < side; column++) {
      const i = row * side + column
      grid.positions.set([(column - 100) * cellSize, (row - 100) * cellSize, 0], i * 3)
      grid.colors.set([column / side, row / side, 0.5], i * 3)
      grid.edge[i] = (row * side + column) / (side * side)
    }
  }

  it('keeps only part of the fill pixels, leaving empty space between them', () => {
    const thinned = thinFill(grid, cellSize, 11)
    const kept = thinned.count / grid.count

    expect(kept).toBeGreaterThan(FILL_KEEP.min)
    expect(kept).toBeLessThan(FILL_KEEP.max)
    expect(thinned.positions).toHaveLength(thinned.count * 3)
    expect(thinned.colors).toHaveLength(thinned.count * 3)
    expect(thinned.edge).toHaveLength(thinned.count)
  })

  it('keeps the color and edge of every kept pixel with its position', () => {
    const thinned = thinFill(grid, cellSize, 11)

    for (let i = 0; i < thinned.count; i++) {
      const column = Math.round(thinned.positions[i * 3] / cellSize) + 100
      const row = Math.round(thinned.positions[i * 3 + 1] / cellSize) + 100
      expect(thinned.colors[i * 3]).toBeCloseTo(column / side)
      expect(thinned.colors[i * 3 + 1]).toBeCloseTo(row / side)
      expect(thinned.edge[i]).toBeCloseTo((row * side + column) / (side * side))
    }
  })

  it('thins some horizontal bands much more than others, like a glitch', () => {
    const thinned = thinFill(grid, cellSize, 11)
    const keptPerRow = new Array(side).fill(0)
    for (let i = 0; i < thinned.count; i++) keptPerRow[Math.round(thinned.positions[i * 3 + 1] / cellSize) + 100]++

    const ratios = keptPerRow.map((kept) => kept / side)
    expect(Math.max(...ratios) - Math.min(...ratios)).toBeGreaterThan((FILL_KEEP.max - FILL_KEEP.min) / 2)
    // Rows in the same band share their density.
    for (let row = 0; row + 1 < side; row++) {
      if (Math.floor(row / GLITCH_BAND) === Math.floor((row + 1) / GLITCH_BAND)) {
        expect(Math.abs(ratios[row] - ratios[row + 1])).toBeLessThan((FILL_KEEP.max - FILL_KEEP.min) / 2)
      }
    }
  })

  it('is deterministic for the same seed', () => {
    expect(thinFill(grid, cellSize, 11)).toEqual(thinFill(grid, cellSize, 11))
    expect(thinFill(grid, cellSize, 11)).not.toEqual(thinFill(grid, cellSize, 12))
  })
})
