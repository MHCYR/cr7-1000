import { describe, expect, it, vi } from 'vitest'
import { createCurrentGoal, progressCounter } from './goalIndicator.ts'

describe('createCurrentGoal', () => {
  it('starts before the first goal', () => {
    expect(createCurrentGoal().get()).toBe(0)
  })

  it('notifies its listeners only when the goal changes', () => {
    const goal = createCurrentGoal()
    const listener = vi.fn()
    goal.subscribe(listener)

    goal.set(0)
    goal.set(16)
    goal.set(16)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(goal.get()).toBe(16)
  })

  it('stops notifying a listener once unsubscribed', () => {
    const goal = createCurrentGoal()
    const listener = vi.fn()
    const unsubscribe = goal.subscribe(listener)

    unsubscribe()
    goal.set(5)

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('progressCounter', () => {
  it('counts the scored goals toward the target', () => {
    expect(progressCounter(16, 1000)).toEqual({ scored: 16, target: 1000, fill: 0.016, label: '16 de 1000 goles' })
  })

  it('fills the bar with the share of the target already scored', () => {
    expect(progressCounter(978, 1000).fill).toBeCloseTo(0.978)
    expect(progressCounter(0, 1000).fill).toBe(0)
  })

  it('never goes past the target', () => {
    expect(progressCounter(1012, 1000)).toEqual({ scored: 1000, target: 1000, fill: 1, label: '1000 de 1000 goles' })
  })

  it('keeps «goles» plural with a single goal scored: it names the target', () => {
    expect(progressCounter(1, 1000).label).toBe('1 de 1000 goles')
  })
})
