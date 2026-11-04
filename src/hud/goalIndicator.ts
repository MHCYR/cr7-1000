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
  /** The current goal, between 0 and the target. */
  current: number
  target: number
  /** Share of the target up to the current goal, 0 to 1: how far the bar is filled. */
  fill: number
  /** Share filled in `spray`: up to the current goal, but never past the last goal scored. */
  scoredFill: number
  /** The whole counter as one sentence, «57 de 1000 goles». */
  label: string
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max)

/**
 * The counter of the tunnel walk (DESIGN.md, ProgressCounter): it fills up to the current goal
 * as the page scrolls, in `spray` over the goals scored and in `concrete` past them.
 */
export function progressCounter(current: number, scored: number, target: number = GOAL_TARGET): ProgressCounter {
  const goal = clamp(current, target)
  const share = (value: number) => (target > 0 ? value / target : 0)
  return {
    current: goal,
    target,
    fill: share(goal),
    scoredFill: share(Math.min(goal, clamp(scored, target))),
    label: es.counter.label(goal, target),
  }
}
