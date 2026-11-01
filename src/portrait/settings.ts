import { ASSEMBLY, SCATTER, type AssemblyTiming, fillDelays, goalDelays, scatterStart } from './assemble.ts'
import { EDGE_DISPERSION, EDGE_SHRINK, FILL_SIZE, disperseEdges, fillSizes } from './fill.ts'
import { EDGE_BAND, FILL_DENSITY, type Portrait, type PortraitOptions } from './sample.ts'

// Every number that shapes the portrait, in one plain object: the dev controls edit it, and
// it can be copied as a whole (JSON-safe, no functions). Defaults come from the constants of
// the modules that use them, so a portrait built from `defaultSettings()` is the one built
// before the settings existed.

export interface PortraitSettings {
  /** Timing of the entry animation, in seconds. */
  assembly: AssemblyTiming
  /** Box the start positions of the points are scattered in (see SCATTER). */
  scatter: { x: number; y: number; z: number }
  fill: {
    /** Side of a fill pixel relative to a grid cell. */
    size: { min: number; max: number }
    /** Farthest an edge pixel scatters, in grid cells. */
    dispersion: number
    /** How much the pixels on the very edge shrink (0 to 1). */
    shrink: number
  }
  /** What samplePortrait reads from the photo. */
  sampling: { density: number; edgeBand: number }
  /** Share of the viewport the portrait may fill. */
  fit: { height: number; width: number }
  /** Opacity of a point while it is still scattered, before it fades to solid on landing. */
  initialOpacity: number
  /** One seed for the goal spread and every random buffer. */
  seed: number
}

/** Share of the viewport the portrait may fill. */
export const FIT = { height: 0.88, width: 0.92 }

/** Opacity of the scattered points, faint like a starfield. */
export const INITIAL_OPACITY = 0.35

/** Seed of the default portrait: it spreads the goals and gives the buffers their seeds 1 to 5. */
export const DEFAULT_SEED = 1000

// Choosing the density per device is #7; desktop for now.
export function defaultSettings(): PortraitSettings {
  return {
    assembly: { ...ASSEMBLY },
    scatter: { ...SCATTER },
    fill: { size: { ...FILL_SIZE }, dispersion: EDGE_DISPERSION, shrink: EDGE_SHRINK },
    sampling: { density: FILL_DENSITY.desktop, edgeBand: EDGE_BAND },
    fit: { ...FIT },
    initialOpacity: INITIAL_OPACITY,
    seed: DEFAULT_SEED,
  }
}

export interface BufferSeeds {
  fillStart: number
  fillDelays: number
  goalStart: number
  disperse: number
  fillSizes: number
}

/**
 * One seed per random buffer. The default seed gives 1 to 5, as the buffers always had; any
 * other seed moves every buffer to its own block of 8, so no two buffers or seeds share one.
 */
export function bufferSeeds(seed: number): BufferSeeds {
  const base = (seed - DEFAULT_SEED) * 8
  return { fillStart: base + 1, fillDelays: base + 2, goalStart: base + 3, disperse: base + 4, fillSizes: base + 5 }
}

/** The options for samplePortrait; changing any of them needs the photo read again. */
export function samplingOptions(settings: PortraitSettings): PortraitOptions {
  return { fillCount: settings.sampling.density, edgeBand: settings.sampling.edgeBand, seed: settings.seed }
}

/** The settings that shape the buffers; the rest (duration, opacity, fit) only reaches the shader. */
export interface BufferSettings {
  assembly: Pick<AssemblyTiming, 'fillStagger' | 'goalsStart' | 'goalsStagger'>
  scatter: PortraitSettings['scatter']
  fill: PortraitSettings['fill']
  seed: number
}

/** Buffers derived from a sampled portrait; goal colors and sizes do not depend on the settings. */
export function buildBuffers(portrait: Portrait, settings: BufferSettings) {
  const seeds = bufferSeeds(settings.seed)
  const { assembly, scatter, fill } = settings
  const fillPositions = disperseEdges(portrait.fill.positions, portrait.fill.edge, portrait.cellSize, seeds.disperse, fill.dispersion)
  return {
    fillPositions,
    fillStart: scatterStart(fillPositions, seeds.fillStart, scatter),
    fillDelays: fillDelays(portrait.fill.count, seeds.fillDelays, assembly.fillStagger),
    fillSizes: fillSizes(portrait.fill.edge, seeds.fillSizes, fill.size, fill.shrink),
    goalStart: scatterStart(portrait.goals.positions, seeds.goalStart, scatter),
    goalDelays: goalDelays(portrait.goals.count, assembly),
  }
}
