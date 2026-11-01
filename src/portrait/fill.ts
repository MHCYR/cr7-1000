import { createRandom } from '../lib/random.ts'
import type { Portrait } from './sample.ts'

// Look of the fill pixels: squares of random sizes thinned out in glitchy horizontal bands,
// and a pixel dispersion on the edge of the figure that softens its outline. `edge` is the per-pixel value from
// samplePortrait (src/portrait/sample.ts): 1 on the outermost pixels, falling to 0 inside.
// Goal pixels are not touched by any of this.

/** Side of a fill pixel, relative to a grid cell: each pixel gets a random one in this range. */
export const FILL_SIZE = { min: 1.2, max: 3.6 } as const

/**
 * Share of the fill pixels kept, drawn per horizontal band so some bands are almost full
 * and others nearly empty: the empty space and the uneven bands give the glitch look.
 */
export const FILL_KEEP = { min: 0.03, max: 0.3 } as const

/** Height of a glitch band, in grid rows. */
export const GLITCH_BAND = 4

/** Farthest an edge pixel scatters from its cell, in grid cells. */
export const EDGE_DISPERSION = 3

/** How much the fill pixels on the very edge shrink (0 = not at all, 1 = to nothing). */
const EDGE_SHRINK = 0.5

/**
 * Random side for every fill pixel, in [FILL_SIZE.min, FILL_SIZE.max] relative to a grid
 * cell, shrunk by up to EDGE_SHRINK on the pixels at the edge of the figure.
 */
export function fillSizes(edge: Float32Array, seed: number): Float32Array {
  const random = createRandom(seed)
  const sizes = new Float32Array(edge.length)
  for (let i = 0; i < sizes.length; i++) {
    sizes[i] = (FILL_SIZE.min + random() * (FILL_SIZE.max - FILL_SIZE.min)) * (1 - EDGE_SHRINK * edge[i])
  }
  return sizes
}

/**
 * New xyz positions where the pixels at the edge of the figure are scattered in the portrait
 * plane (z unchanged), up to EDGE_DISPERSION cells away. The distance grows with edge², so
 * pixels inside the figure (edge 0) stay exactly in their cells.
 */
export function disperseEdges(positions: Float32Array, edge: Float32Array, cellSize: number, seed: number): Float32Array {
  const random = createRandom(seed)
  const dispersed = new Float32Array(positions)
  for (let i = 0; i < edge.length; i++) {
    // Always two randoms per pixel, so a pixel's scatter does not depend on the others' edge.
    const angle = random() * 2 * Math.PI
    const radius = Math.sqrt(random())
    const distance = radius * EDGE_DISPERSION * cellSize * edge[i] ** 2
    dispersed[i * 3] += Math.cos(angle) * distance
    dispersed[i * 3 + 1] += Math.sin(angle) * distance
  }
  return dispersed
}

/**
 * Drops part of the fill pixels to leave empty space between them. Every band of GLITCH_BAND
 * grid rows keeps its own random share in [FILL_KEEP.min, FILL_KEEP.max]; colors and edge
 * values stay with their pixels.
 */
export function thinFill(fill: Portrait['fill'], cellSize: number, seed: number): Portrait['fill'] {
  const random = createRandom(seed)
  const bandKeep = new Map<number, number>()
  const keepOf = (band: number) => {
    let keep = bandKeep.get(band)
    if (keep === undefined) {
      keep = FILL_KEEP.min + createRandom((seed * 1_000_003 + band * 7_919) >>> 0)() * (FILL_KEEP.max - FILL_KEEP.min)
      bandKeep.set(band, keep)
    }
    return keep
  }

  const kept: number[] = []
  for (let i = 0; i < fill.count; i++) {
    const band = Math.floor(Math.round(fill.positions[i * 3 + 1] / cellSize) / GLITCH_BAND)
    if (random() < keepOf(band)) kept.push(i)
  }

  const thinned = {
    count: kept.length,
    positions: new Float32Array(kept.length * 3),
    colors: new Float32Array(kept.length * 3),
    edge: new Float32Array(kept.length),
  }
  kept.forEach((index, i) => {
    thinned.positions.set(fill.positions.subarray(index * 3, index * 3 + 3), i * 3)
    thinned.colors.set(fill.colors.subarray(index * 3, index * 3 + 3), i * 3)
    thinned.edge[i] = fill.edge[index]
  })
  return thinned
}
