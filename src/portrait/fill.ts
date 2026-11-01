import { createRandom } from '../lib/random.ts'

// Look of the fill pixels: small squares of random sizes, and a pixel dispersion on the
// edge of the figure that softens its outline. `edge` is the per-pixel value from
// samplePortrait (src/portrait/sample.ts): 1 on the outermost pixels, falling to 0 inside.
// Goal pixels are not touched by any of this.

/** Side of a fill pixel, relative to a grid cell: each pixel gets a random one in this range. */
export const FILL_SIZE = { min: 0.5, max: 1.2 } as const

/** Farthest an edge pixel scatters from its cell, in grid cells. */
export const EDGE_DISPERSION = 6

/** How much the fill pixels on the very edge shrink (0 = not at all, 1 = to nothing). */
export const EDGE_SHRINK = 0.5

/**
 * Random side for every fill pixel, in [FILL_SIZE.min, FILL_SIZE.max] relative to a grid
 * cell, shrunk by up to EDGE_SHRINK on the pixels at the edge of the figure.
 */
export function fillSizes(
  edge: Float32Array,
  seed: number,
  size: { min: number; max: number } = FILL_SIZE,
  shrink: number = EDGE_SHRINK,
): Float32Array {
  const random = createRandom(seed)
  const sizes = new Float32Array(edge.length)
  for (let i = 0; i < sizes.length; i++) {
    sizes[i] = (size.min + random() * (size.max - size.min)) * (1 - shrink * edge[i])
  }
  return sizes
}

/**
 * New xyz positions where the pixels at the edge of the figure are scattered in the portrait
 * plane (z unchanged), up to EDGE_DISPERSION cells away. The distance grows with edge², so
 * pixels inside the figure (edge 0) stay exactly in their cells.
 */
export function disperseEdges(
  positions: Float32Array,
  edge: Float32Array,
  cellSize: number,
  seed: number,
  dispersion: number = EDGE_DISPERSION,
): Float32Array {
  const random = createRandom(seed)
  const dispersed = new Float32Array(positions)
  for (let i = 0; i < edge.length; i++) {
    // Always two randoms per pixel, so a pixel's scatter does not depend on the others' edge.
    const angle = random() * 2 * Math.PI
    const radius = Math.sqrt(random())
    const distance = radius * dispersion * cellSize * edge[i] ** 2
    dispersed[i * 3] += Math.cos(angle) * distance
    dispersed[i * 3 + 1] += Math.sin(angle) * distance
  }
  return dispersed
}
