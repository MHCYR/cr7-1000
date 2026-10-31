import { createRandom } from '../lib/random.ts'

// Entry animation (docs/SPEC.md, like vadimcarazan.com): every point starts scattered in
// front of the camera like a starfield and flies to its place in the portrait. The dust
// lands first; then the goal pixels land in chronological order, from the feet to the head.
// The GPU runs this per point (src/scene/assemblyShader.ts); these functions are the source
// of truth for the buffers and the timing.

/** Timing in seconds. */
export const ASSEMBLY = {
  /** How long one point takes to fly from its start to the portrait. */
  duration: 1,
  /** Dust points start at random within this window. */
  dustStagger: 0.8,
  /** When goal 1 starts flying. */
  goalsStart: 0.6,
  /** Time between goal 1 and the last goal pixel starting to fly. */
  goalsStagger: 0.9,
} as const

/** When the last point lands; from then on the portrait is still. */
export const ASSEMBLY_END = Math.max(ASSEMBLY.dustStagger, ASSEMBLY.goalsStart + ASSEMBLY.goalsStagger) + ASSEMBLY.duration

/**
 * Start positions for the points whose portrait positions are `targets` (xyz triplets,
 * portrait units). They spread wider than the portrait and always behind it (z < 0).
 */
export function scatterStart(targets: Float32Array, seed: number): Float32Array {
  const random = createRandom(seed)
  const start = new Float32Array(targets.length)
  for (let i = 0; i < start.length; i += 3) {
    start[i] = (random() - 0.5) * 2.6
    start[i + 1] = (random() - 0.5) * 1.6
    start[i + 2] = -0.5 - random() * 2.5
  }
  return start
}

/** Random start delays for the dust, in [0, ASSEMBLY.dustStagger]. */
export function dustDelays(count: number, seed: number): Float32Array {
  const random = createRandom(seed)
  const delays = new Float32Array(count)
  for (let i = 0; i < count; i++) delays[i] = random() * ASSEMBLY.dustStagger
  return delays
}

/** Start delays for the goal pixels in chronological order: goal 1 first. */
export function goalDelays(count: number): Float32Array {
  const delays = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    delays[i] = ASSEMBLY.goalsStart + (count > 1 ? (ASSEMBLY.goalsStagger * i) / (count - 1) : 0)
  }
  return delays
}

/**
 * How far a point with this delay is from its start (0) to its place in the portrait (1)
 * at `elapsed` seconds into the animation: ease-out cubic, exactly 1 once it lands.
 */
export function assemblyOffset(elapsed: number, delay: number): number {
  const local = Math.min(Math.max((elapsed - delay) / ASSEMBLY.duration, 0), 1)
  return 1 - (1 - local) ** 3
}
