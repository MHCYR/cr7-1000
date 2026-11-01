import { createRandom } from '../lib/random.ts'

// Turns the portrait photo into the hybrid cloud (docs/adr/0001): a dense grid of fill pixels
// colored by the photo, with the goal pixels spread inside the figure.

/** The pixels of an image, as returned by CanvasRenderingContext2D.getImageData. */
export interface ImageLike {
  width: number
  height: number
  /** RGBA bytes, row by row from the top-left corner. */
  data: ArrayLike<number>
}

/** Approximate fill pixels per device (docs/SPEC.md); choosing the device is #7. */
export const FILL_DENSITY = { desktop: 50_000, mobile: 20_000 } as const

export const GOAL_PIXELS = 1000

/** Fill pixels closer than this many grid cells to the edge of the figure are on its edge band. */
export const EDGE_BAND = 8

export interface PortraitOptions {
  /** Approximate number of fill pixels. */
  fillCount: number
  goalCount?: number
  /** Seed for spreading the goal pixels; the same seed gives the same portrait. */
  seed?: number
  /** Pixels with a lower alpha are background and produce nothing. */
  alphaThreshold?: number
}

/**
 * Positions are xyz triplets with z = 0. The portrait is centered on the origin,
 * 1 unit tall and `aspect` units wide, with y pointing up.
 */
export interface Portrait {
  aspect: number
  /** Distance between neighbouring grid cells, in portrait units. */
  cellSize: number
  /**
   * Colors are rgb triplets in [0, 1], ready for a THREE.BufferAttribute. `edge` is how close
   * each fill pixel is to the edge of the figure: 1 next to the background or the image border,
   * falling to 0 at EDGE_BAND cells inside.
   */
  fill: { count: number; positions: Float32Array; colors: Float32Array; edge: Float32Array }
  /** Goal pixel i holds goal number i + 1: chronological from the feet to the head. */
  goals: { count: number; positions: Float32Array }
}

interface Cell {
  x: number
  y: number
  pixel: number
  row: number
  column: number
  /** Grid steps (4-neighbour) to the nearest cell outside the figure. */
  depth: number
}

export function samplePortrait(image: ImageLike, options: PortraitOptions): Portrait {
  const { width, height, data } = image
  const { fillCount, goalCount = GOAL_PIXELS, seed = 1000, alphaThreshold = 128 } = options

  let opaquePixels = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] >= alphaThreshold) opaquePixels++

  // Grid step (in pixels) so the figure holds about fillCount + goalCount cells.
  const step = Math.max(1, Math.sqrt(opaquePixels / (fillCount + goalCount)))

  const cells: Cell[] = []
  for (let row = 0; (row + 0.5) * step < height; row++) {
    const py = Math.floor((row + 0.5) * step)
    for (let column = 0; (column + 0.5) * step < width; column++) {
      const px = Math.floor((column + 0.5) * step)
      const pixel = (py * width + px) * 4
      if (data[pixel + 3] < alphaThreshold) continue
      cells.push({ x: (px + 0.5 - width / 2) / height, y: (height / 2 - py - 0.5) / height, pixel, row, column, depth: 0 })
    }
  }
  measureDepth(cells)

  if (cells.length < goalCount) {
    throw new Error(
      `The figure has ${cells.length} cells, fewer than the ${goalCount} goal pixels it must hold`,
    )
  }

  // Partial Fisher-Yates: the first goalCount cells become goal pixels, spread at random.
  const random = createRandom(seed)
  for (let i = 0; i < goalCount; i++) {
    const j = i + Math.floor(random() * (cells.length - i))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  const goalCells = cells.slice(0, goalCount).sort((a, b) => a.y - b.y || a.x - b.x)
  const fillCells = cells.slice(goalCount)

  const fill = {
    count: fillCells.length,
    positions: new Float32Array(fillCells.length * 3),
    colors: new Float32Array(fillCells.length * 3),
    edge: new Float32Array(fillCells.length),
  }
  fillCells.forEach((cell, i) => {
    fill.positions.set([cell.x, cell.y, 0], i * 3)
    fill.colors.set([data[cell.pixel] / 255, data[cell.pixel + 1] / 255, data[cell.pixel + 2] / 255], i * 3)
    fill.edge[i] = Math.max(0, 1 - (cell.depth - 1) / EDGE_BAND)
  })

  const goals = { count: goalCount, positions: new Float32Array(goalCount * 3) }
  goalCells.forEach((cell, i) => goals.positions.set([cell.x, cell.y, 0], i * 3))

  return { aspect: width / height, cellSize: step / height, fill, goals }
}

/**
 * Sets each cell's depth with a breadth-first search from the edge: cells with a neighbour
 * outside the figure (background or beyond the image border) have depth 1.
 */
function measureDepth(cells: Cell[]): void {
  let rows = 0
  let columns = 0
  for (const cell of cells) {
    rows = Math.max(rows, cell.row + 1)
    columns = Math.max(columns, cell.column + 1)
  }
  const grid = new Map<number, Cell>()
  for (const cell of cells) grid.set(cell.row * columns + cell.column, cell)
  const at = (row: number, column: number) =>
    row < 0 || row >= rows || column < 0 || column >= columns ? undefined : grid.get(row * columns + column)
  const neighbours = (cell: Cell) => [
    at(cell.row - 1, cell.column),
    at(cell.row + 1, cell.column),
    at(cell.row, cell.column - 1),
    at(cell.row, cell.column + 1),
  ]

  let frontier = cells.filter((cell) => neighbours(cell).includes(undefined))
  for (const cell of frontier) cell.depth = 1
  while (frontier.length > 0) {
    const next: Cell[] = []
    for (const cell of frontier) {
      for (const neighbour of neighbours(cell)) {
        if (neighbour && neighbour.depth === 0) {
          neighbour.depth = cell.depth + 1
          next.push(neighbour)
        }
      }
    }
    frontier = next
  }
}
