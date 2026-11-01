// Act two of prototype B (docs/SPEC.md): the tunnel. Every goal pixel has a second position,
// goal number n at z = -n × separation, and page scroll first flies the goal pixels there
// (progress 0 → 1) and then moves the camera along Z, past the goals from 1 to the last.
// Meanwhile the fill pixels come toward the camera and pass beside it, so the camera enters
// the image instead of watching it fade. All lengths are world units; the GPU does the
// interpolation (src/scene/assemblyShader.ts).

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

/** How the fill pixels come toward the camera while the goals fly to the tunnel. */
export const FILL_ZOOM = {
  /** Progress at which every fill pixel is past the camera; below 1, the goals finish aligning in sight. */
  end: 0.65,
  /** How far toward the camera the fill moves, from the portrait: past cameraStart, so it ends behind the camera. */
  travel: TUNNEL.cameraStart + 0.5,
  /** Distance to the camera from which a fill pixel starts fading out, so it never fills the screen. */
  fade: 1.5,
} as const

export type FillZoom = { -readonly [K in keyof typeof FILL_ZOOM]: number }

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

/** Hermite smoothstep, as in GLSL: 0 at or below `edge0`, 1 at or above `edge1`. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

/**
 * How far toward the camera (+Z) the fill pixels are at this progress: 0 with the portrait
 * assembled, `travel` from `end` on. Every pixel moves the same, so the perspective grows them
 * and spreads them from the center of the screen, as if the camera went into the photo.
 */
export function fillZoom(progress: number, { end, travel }: Pick<FillZoom, 'end' | 'travel'> = FILL_ZOOM): number {
  return smoothstep(0, end, progress) * travel
}

/**
 * Opacity factor of a fill pixel at `depth` in front of the camera: 1 from `fade` on, 0 at the
 * camera and behind it. The vertex shader applies the same formula (src/scene/assemblyShader.ts).
 */
export function nearFade(depth: number, fade: number = FILL_ZOOM.fade): number {
  return smoothstep(0, fade, depth)
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
