// The entry animation clock, shared by the fill and the goal pixels. Plain data and pure
// steps, so the scene can restart it without touching the buffers or the WebGL context.

export interface AnimationClock {
  /** Seconds into the animation. */
  elapsed: number
  /** Render-clock time of second 0; null until the next frame sets it. */
  startedAt: number | null
}

export function createClock(): AnimationClock {
  return { elapsed: 0, startedAt: null }
}

/**
 * Advances the clock to `now` (the render clock, in seconds). It stops at `end`, when the last
 * point has landed. With reduced motion the portrait is assembled from the first frame.
 */
export function tickClock(clock: AnimationClock, now: number, end: number, reducedMotion: boolean): void {
  if (reducedMotion) {
    clock.elapsed = end
    return
  }
  if (clock.elapsed >= end) return
  clock.startedAt ??= now
  clock.elapsed = Math.min(now - clock.startedAt, end)
}

/** Back to second 0 at once; the animation plays again from the next frame. */
export function restartClock(clock: AnimationClock, end: number, reducedMotion: boolean): void {
  clock.startedAt = null
  clock.elapsed = reducedMotion ? end : 0
}
