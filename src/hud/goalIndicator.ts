// The indicator over the tunnel (#5, SPEC.md): the goal closest to the camera in large type,
// with its team, rival and date, and the progress counter toward the target. The scene sets the
// current goal every frame, outside React; GoalIndicator rerenders only when it changes.

import { es } from '../i18n/es.ts'
import { GOAL_TARGET } from './goalCard.ts'

/** The goal closest to the camera, shared outside React; 0 before the camera reaches goal 1. */
export interface CurrentGoal {
  get(): number
  set(goal: number): void
  subscribe(listener: () => void): () => void
}

export function createCurrentGoal(): CurrentGoal {
  let goal = 0
  const listeners = new Set<() => void>()
  return {
    get: () => goal,
    set(next) {
      if (next === goal) return
      goal = next
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
  }
}

export interface ProgressCounter {
  /** Official goals scored so far, never past the target. Not the current goal. */
  scored: number
  target: number
  /** Share of the target already scored, 0 to 1: the width of the bar. */
  fill: number
  /** The whole counter as one sentence, «978 de 1000 goles». */
  label: string
}

/** The counter of `scored` goals toward `target` (DESIGN.md, ProgressCounter). */
export function progressCounter(scored: number, target: number = GOAL_TARGET): ProgressCounter {
  const capped = Math.min(Math.max(scored, 0), target)
  return {
    scored: capped,
    target,
    fill: target > 0 ? capped / target : 0,
    label: es.counter.label(capped, target),
  }
}
