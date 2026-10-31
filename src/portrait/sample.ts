import { createRandom } from '../lib/random.ts'

// Turns the portrait photo into the hybrid cloud (docs/adr/0001): a dense grid of dust
// colored by the photo, with the goal pixels spread inside the figure.

/** The pixels of an image, as returned by CanvasRenderingContext2D.getImageData. */
export interface ImageLike {
  width: number
  height: number
  /** RGBA bytes, row by row from the top-left corner. */
  data: ArrayLike<number>
}

/** Approximate dust points per device (docs/SPEC.md); choosing the device is #7. */
export const DUST_DENSITY = { desktop: 50_000, mobile: 20_000 } as const

export const GOAL_PIXELS = 1000

export interface PortraitOptions {
  /** Approximate number of dust points. */
  dustCount: number
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
  /** Colors are rgb triplets in [0, 1], ready for a THREE.BufferAttribute. */
  dust: { count: number; positions: Float32Array; colors: Float32Array }
  /** Goal pixel i holds goal number i + 1: chronological from the feet to the head. */
  goals: { count: number; positions: Float32Array }
}

interface Cell {
  x: number
  y: number
  pixel: number
}

export function samplePortrait(image: ImageLike, options: PortraitOptions): Portrait {
  const { width, height, data } = image
  const { dustCount, goalCount = GOAL_PIXELS, seed = 1000, alphaThreshold = 128 } = options

  let opaquePixels = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] >= alphaThreshold) opaquePixels++

  // Grid step (in pixels) so the figure holds about dustCount + goalCount cells.
  const step = Math.max(1, Math.sqrt(opaquePixels / (dustCount + goalCount)))

  const cells: Cell[] = []
  for (let row = 0; (row + 0.5) * step < height; row++) {
    const py = Math.floor((row + 0.5) * step)
    for (let column = 0; (column + 0.5) * step < width; column++) {
      const px = Math.floor((column + 0.5) * step)
      const pixel = (py * width + px) * 4
      if (data[pixel + 3] < alphaThreshold) continue
      cells.push({ x: (px + 0.5 - width / 2) / height, y: (height / 2 - py - 0.5) / height, pixel })
    }
  }

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
  const dustCells = cells.slice(goalCount)

  const dust = {
    count: dustCells.length,
    positions: new Float32Array(dustCells.length * 3),
    colors: new Float32Array(dustCells.length * 3),
  }
  dustCells.forEach((cell, i) => {
    dust.positions.set([cell.x, cell.y, 0], i * 3)
    dust.colors.set([data[cell.pixel] / 255, data[cell.pixel + 1] / 255, data[cell.pixel + 2] / 255], i * 3)
  })

  const goals = { count: goalCount, positions: new Float32Array(goalCount * 3) }
  goalCells.forEach((cell, i) => goals.positions.set([cell.x, cell.y, 0], i * 3))

  return { aspect: width / height, cellSize: step / height, dust, goals }
}
