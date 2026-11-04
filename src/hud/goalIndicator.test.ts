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
  it('counts up to the current goal', () => {
    expect(progressCounter(16, 978, 1000)).toEqual({ current: 16, target: 1000, fill: 0.016, scoredFill: 0.016, label: '16 de 1000 goles' })
  })

  it('fills in spray only up to the last goal scored', () => {
    const counter = progressCounter(994, 978, 1000)

    expect(counter.fill).toBeCloseTo(0.994)
    expect(counter.scoredFill).toBeCloseTo(0.978)
    expect(counter.label).toBe('994 de 1000 goles')
  })

  it('is empty before the first goal', () => {
    expect(progressCounter(0, 978, 1000)).toMatchObject({ current: 0, fill: 0, scoredFill: 0 })
  })

  it('never goes past the target', () => {
    expect(progressCounter(1012, 1012, 1000)).toMatchObject({ current: 1000, fill: 1, scoredFill: 1, label: '1000 de 1000 goles' })
  })
})
