// Act two of prototype B (docs/SPEC.md): the tunnel. Every goal pixel has a second position,
// goal number n at z = -n × separation, and page scroll first flies the goal pixels there
// (progress 0 → 1) and then moves the camera along Z, past the goals from 1 to the last.
// Meanwhile the fill pixels come toward the camera and pass beside it, so the camera enters
// the image instead of watching it fade: first all at once, then one by one. All lengths are world units; the GPU does the
// interpolation (src/scene/assemblyShader.ts).

import { createRandom } from '../lib/random.ts'

export const TUNNEL = {
  /** Distance in Z between two consecutive goals. */
  separation: 0.15,
  /** Goals sit on a ring around the camera path, so the camera passes beside them. */
  radius: { min: 0.5, max: 0.9 },
  /** Camera Z while the portrait is on screen. */
  cameraStart: 5,
  /** Scroll, in CSS pixels, that moves the camera from one goal to the next. */
  pixelsPerGoal: 24,
  /**
   * Scroll of the entry, as a share of the viewport height: the goals fly to the tunnel and the
   * cards take over in it, then the camera moves. The fill pixels are gone from sight by then,
   * so a longer entry only leaves a pause before the tunnel.
   */
  entry: 0.466,
} as const

/**
 * How the fill pixels come toward the camera while the goals fly to the tunnel: first the whole
 * image at once, so it grows, then one by one from the center out, as if it had depth. Every
 * timing is a share of a viewport of scroll (ScrollState.fill, 0 to 1), so it does not follow
 * TUNNEL.entry: the last ones, already out of sight, finish while the camera enters the tunnel.
 * Every length is in world units.
 */
export const FILL_ZOOM = {
  /** Progress at which the image stops growing as a whole. */
  zoomEnd: 0.25,
  /** How far toward the camera the whole image comes by zoomEnd; below cameraStart. */
  zoomDepth: 2.5,
  /** Progress at which the last fill pixel is past the camera; below 1, the goals finish aligning in sight. */
  flyEnd: 0.75,
  /** Progress one fill pixel takes to fly from zoomDepth past the camera. */
  flight: 0.2,
  /** How far toward the camera each fill pixel ends, from the portrait: past cameraStart, behind the camera. */
  reach: TUNNEL.cameraStart + 0.5,
  /** Distance to the camera from which a fill pixel starts fading out, so it never fills the screen. */
  fade: 1.5,
  /** Share of randomness in the fly-out order: 0 is a perfect ring from the center out, 1 is pure chance. */
  jitter: 0.3,
} as const

/** Distance fog on the goal walls, in world units in front of the camera; near stays past cameraStart. */
export const TUNNEL_FOG = { near: 13.5, far: 19.5 } as const

/** How many times bigger a goal pixel is in the tunnel than in the portrait. */
export const TUNNEL_GOAL_SCALE = 0.5

export interface TunnelFog { near: number; far: number }

export type FillZoom = { -readonly [K in keyof typeof FILL_ZOOM]: number }

/** Seed of the tunnel X/Y spread. */
export const TUNNEL_SEED = 4

/** Tunnel positions of `count` goals in chronological order: index i is goal number i + 1. */
export function tunnelPositions(count: number, seed: number = TUNNEL_SEED, tunnel: { separation: number; radius: { min: number; max: number } } = TUNNEL): Float32Array {
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

/** Scroll, in CSS pixels, of the entry: TUNNEL.entry of the viewport height. */
export function entryScroll(viewportHeight: number, tunnel: { entry: number } = TUNNEL): number {
  return viewportHeight * tunnel.entry
}

/** Scroll, in CSS pixels, from the portrait to the last goal: the entry, then the tunnel. */
export function scrollHeight(viewportHeight: number, goalCount: number, tunnel = TUNNEL): number {
  return entryScroll(viewportHeight, tunnel) + tunnelScroll(goalCount, tunnel)
}

/** Hermite smoothstep, as in GLSL: 0 at or below `edge0`, 1 at or above `edge1`. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

/**
 * Opacity factor of a goal pixel at `depth` in front of the camera: 1 up to `near`, 0 from
 * `far` on. It also hides the goals while they fly deep into the tunnel, so they never pile up
 * at the center of the screen; the assembled portrait, closer than `near`, is untouched.
 */
export function tunnelFade(depth: number, fog: TunnelFog = TUNNEL_FOG): number {
  return 1 - smoothstep(fog.near, fog.far, depth)
}

/**
 * How far toward the camera (+Z) a fill pixel is at this progress, from the portrait. Up to
 * zoomEnd every pixel moves the same, so the perspective grows the image from the center of
 * the screen; then each one flies past the camera, those of lower `order` first, while the rest
 * wait at zoomDepth, and by flyEnd all of them are at `reach`. When the windows leave no room
 * for a stagger, they all fly at once. The vertex shader applies the same formula
 * (src/scene/assemblyShader.ts).
 */
export function fillOffset(
  progress: number,
  order: number,
  { zoomEnd, zoomDepth, flyEnd, flight, reach }: Pick<FillZoom, 'zoomEnd' | 'zoomDepth' | 'flyEnd' | 'flight' | 'reach'> = FILL_ZOOM,
): number {
  const together = smoothstep(0, Math.max(zoomEnd, 0.0001), progress) * zoomDepth
  const duration = Math.max(Math.min(flight, flyEnd - zoomEnd), 0.0001)
  const launch = zoomEnd + order * Math.max(flyEnd - zoomEnd - duration, 0)
  return together + smoothstep(launch, launch + duration, progress) * (reach - zoomDepth)
}

/**
 * Fly-out order of the fill pixels at `positions` (xyz triplets, centered on the origin), in
 * [0, 1]: their distance to the center as a share of the farthest one, mixed with `jitter` of
 * chance, so the face leaves first and the edges last without a perfect ring.
 */
export function fillOrder(positions: Float32Array, seed: number, jitter: number = FILL_ZOOM.jitter): Float32Array {
  const random = createRandom(seed)
  const count = positions.length / 3
  const distances = new Float32Array(count)
  let farthest = 0
  for (let i = 0; i < count; i++) {
    distances[i] = Math.hypot(positions[i * 3], positions[i * 3 + 1])
    farthest = Math.max(farthest, distances[i])
  }
  const order = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const radial = farthest > 0 ? distances[i] / farthest : 0
    order[i] = (1 - jitter) * radial + jitter * random()
  }
  return order
}

/**
 * Opacity factor of a fill pixel at `depth` in front of the camera: 1 from `fade` on, 0 at the
 * camera and behind it. The vertex shader applies the same formula (src/scene/assemblyShader.ts).
 */
export function nearFade(depth: number, fade: number = FILL_ZOOM.fade): number {
  return smoothstep(0, fade, depth)
}

export interface ScrollState {
  /** 0 with the portrait assembled, 1 with every goal pixel in the tunnel: the entry. */
  progress: number
  /** Scroll over the first viewport, 0 to 1: the clock of the fill pixels (FILL_ZOOM). */
  fill: number
  cameraZ: number
}

/**
 * Where the scene stands at `scrollY`: the entry (entryScroll) flies the goal pixels to the
 * tunnel with the camera still; the rest moves the camera to the last goal. The fill pixels
 * follow the first viewport of scroll, past the entry. Pure, so scrolling back up gives back
 * the same states down to the portrait.
 */
export function scrollState(scrollY: number, viewportHeight: number, goalCount: number, tunnel = TUNNEL): ScrollState {
  const scroll = Math.min(Math.max(scrollY, 0), scrollHeight(viewportHeight, goalCount, tunnel))
  const entry = entryScroll(viewportHeight, tunnel)
  const progress = entry > 0 ? Math.min(scroll / entry, 1) : 1
  const fill = viewportHeight > 0 ? Math.min(scroll / viewportHeight, 1) : 1
  const travelled = (Math.max(scroll - entry, 0) / tunnel.pixelsPerGoal) * tunnel.separation
  return { progress, fill, cameraZ: tunnel.cameraStart - travelled }
}

export interface ScrollReadout {
  /** 'entry' while the goals fly to the tunnel, 'tunnel' once the camera moves. */
  phase: 'entry' | 'tunnel'
  /** Progress through the current phase, 0 to 100; in the entry it is ScrollState.progress × 100. */
  phasePercent: number
  /** The goal closest to the camera (currentGoal); 0 in the entry and before goal 1. */
  goal: number
  /** Progress through the whole page scroll, 0 to 100. */
  globalPercent: number
}

/**
 * Where `scrollY` falls on the scroll timeline, for the development readout: the phase, its
 * progress and the whole page's. Same scroll math as scrollState: the entry percent is its
 * progress, so CARD_REVEAL (src/hud/cardLayout.ts) reads as is; the FILL_ZOOM keyframes are
 * shares of a viewport, at keyframe / TUNNEL.entry of the entry.
 */
export function scrollReadout(scrollY: number, viewportHeight: number, goalCount: number, tunnel = TUNNEL): ScrollReadout {
  const height = scrollHeight(viewportHeight, goalCount, tunnel)
  const scroll = Math.min(Math.max(scrollY, 0), height)
  const { progress, cameraZ } = scrollState(scroll, viewportHeight, goalCount, tunnel)
  const globalPercent = height > 0 ? (scroll / height) * 100 : 100
  const entry = entryScroll(viewportHeight, tunnel)
  if (scroll <= entry) return { phase: 'entry', phasePercent: progress * 100, goal: 0, globalPercent }
  const length = tunnelScroll(goalCount, tunnel)
  return {
    phase: 'tunnel',
    phasePercent: length > 0 ? ((scroll - entry) / length) * 100 : 100,
    goal: currentGoal(cameraZ, tunnel.separation, goalCount),
    globalPercent,
  }
}
