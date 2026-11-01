import { createRandom } from '../lib/random.ts'

// Entry animation (docs/SPEC.md, like vadimcarazan.com): every point starts scattered in
// front of the camera like a starfield and flies to its place in the portrait. The fill
// pixels land first; then the goal pixels land in chronological order, from the feet to the head.
// The GPU runs this per point (src/scene/assemblyShader.ts); these functions are the source
// of truth for the buffers and the timing.

/** Timing in seconds. */
export const ASSEMBLY = {
  /** How long one point takes to fly from its start to the portrait. */
  duration: 1.6,
  /** Fill pixels start at random within this window. */
  fillStagger: 1.3,
  /** When goal 1 starts flying. */
  goalsStart: 1,
  /** Time between goal 1 and the last goal pixel starting to fly. */
  goalsStagger: 1.4,
} as const

export type AssemblyTiming = { -readonly [K in keyof typeof ASSEMBLY]: number }

/** Width of the box the start positions fill, in portrait units; z is how far behind the portrait. */
export const SCATTER = { x: 2.6, y: 1.6, z: 2.5 }

/** When the last point lands; from then on the portrait is still. */
export function assemblyEnd(timing: AssemblyTiming = ASSEMBLY): number {
  return Math.max(timing.fillStagger, timing.goalsStart + timing.goalsStagger) + timing.duration
}

export const ASSEMBLY_END = assemblyEnd()

/**
 * Start positions for the points whose portrait positions are `targets` (xyz triplets,
 * portrait units). They spread wider than the portrait and always behind it (z < 0).
 */
export function scatterStart(targets: Float32Array, seed: number, scatter: typeof SCATTER = SCATTER): Float32Array {
  const random = createRandom(seed)
  const start = new Float32Array(targets.length)
  for (let i = 0; i < start.length; i += 3) {
    start[i] = (random() - 0.5) * scatter.x
    start[i + 1] = (random() - 0.5) * scatter.y
    start[i + 2] = -0.5 - random() * scatter.z
  }
  return start
}

/** Random start delays for the fill pixels, in [0, fillStagger]. */
export function fillDelays(count: number, seed: number, fillStagger: number = ASSEMBLY.fillStagger): Float32Array {
  const random = createRandom(seed)
  const delays = new Float32Array(count)
  for (let i = 0; i < count; i++) delays[i] = random() * fillStagger
  return delays
}

/** Start delays for the goal pixels in chronological order: goal 1 first. */
export function goalDelays(
  count: number,
  { goalsStart, goalsStagger }: Pick<AssemblyTiming, 'goalsStart' | 'goalsStagger'> = ASSEMBLY,
): Float32Array {
  const delays = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    delays[i] = goalsStart + (count > 1 ? (goalsStagger * i) / (count - 1) : 0)
  }
  return delays
}

/**
 * How far a point with this delay is from its start (0) to its place in the portrait (1)
 * at `elapsed` seconds into the animation: ease-out cubic, exactly 1 once it lands.
 */
export function assemblyOffset(elapsed: number, delay: number, duration: number = ASSEMBLY.duration): number {
  const local = Math.min(Math.max((elapsed - delay) / duration, 0), 1)
  return 1 - (1 - local) ** 3
}
