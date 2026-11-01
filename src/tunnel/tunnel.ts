// Act two of prototype B (docs/SPEC.md): the tunnel. Every goal pixel has a second position,
// goal number n at z = -n × separation, and page scroll first flies the goal pixels there
// (progress 0 → 1) and then moves the camera along Z, past the goals from 1 to the last.
// All lengths are world units; the GPU does the interpolation (src/scene/assemblyShader.ts).

import { createRandom } from '../lib/random.ts'

export const TUNNEL = {
  /** Distance in Z between two consecutive goals. */
  separation: 0.5,
  /** Goals sit on a ring around the camera path, so the camera passes beside them. */
  radius: { min: 0.6, max: 2.2 },
  /** Camera Z while the portrait is on screen. */
  cameraStart: 5,
  /** Scroll, in CSS pixels, that moves the camera from one goal to the next. */
  pixelsPerGoal: 24,
} as const

/** Seed of the tunnel X/Y spread. */
export const TUNNEL_SEED = 4

/** Tunnel positions of `count` goals in chronological order: index i is goal number i + 1. */
export function tunnelPositions(count: number, seed: number = TUNNEL_SEED, tunnel = TUNNEL): Float32Array {
  const random = createRandom(seed)
  const { separation, radius } = tunnel
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2
    const distance = radius.min + random() * (radius.max - radius.min)
    positions.set([Math.cos(angle) * distance, Math.sin(angle) * distance, -(i + 1) * separation], i * 3)
  }
  return positions
}

/**
 * The goal closest to the camera, round(z / separation): 0 before the camera reaches the
 * tunnel, and never past the last goal.
 */
export function currentGoal(cameraZ: number, separation: number, goalCount: number): number {
  const goal = Math.round(-cameraZ / separation)
  return Math.min(Math.max(goal, 0), goalCount)
}

/** Scroll, in CSS pixels, that moves the camera from its start to the last goal. */
export function tunnelScroll(goalCount: number, tunnel = TUNNEL): number {
  return (tunnel.cameraStart / tunnel.separation + goalCount) * tunnel.pixelsPerGoal
}

/** Scroll, in CSS pixels, from the portrait to the last goal: one viewport, then the tunnel. */
export function scrollHeight(viewportHeight: number, goalCount: number, tunnel = TUNNEL): number {
  return viewportHeight + tunnelScroll(goalCount, tunnel)
}

export interface ScrollState {
  /** 0 with the portrait assembled, 1 with every goal pixel in the tunnel. */
  progress: number
  cameraZ: number
}

/**
 * Where the scene stands at `scrollY`: the first viewport of scroll flies the goal pixels to
 * the tunnel with the camera still; the rest moves the camera to the last goal. Pure, so
 * scrolling back up gives back the same states down to the portrait.
 */
export function scrollState(scrollY: number, viewportHeight: number, goalCount: number, tunnel = TUNNEL): ScrollState {
  const scroll = Math.min(Math.max(scrollY, 0), scrollHeight(viewportHeight, goalCount, tunnel))
  const progress = viewportHeight > 0 ? Math.min(scroll / viewportHeight, 1) : 1
  const travelled = (Math.max(scroll - viewportHeight, 0) / tunnel.pixelsPerGoal) * tunnel.separation
  return { progress, cameraZ: tunnel.cameraStart - travelled }
}
