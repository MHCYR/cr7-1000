import { describe, expect, it, vi } from 'vitest'
import { createCardWindow, createGoalCardLayer } from './cardWindow.ts'

describe('createCardWindow', () => {
  it('starts at the first goal', () => {
    expect(createCardWindow().start()).toBe(0)
  })

  it('notifies its listeners only when the start changes', () => {
    const cardWindow = createCardWindow()
    const listener = vi.fn()
    cardWindow.subscribe(listener)

    cardWindow.set(0)
    cardWindow.set(3)
    cardWindow.set(3)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(cardWindow.start()).toBe(3)
  })

  it('stops notifying a listener once unsubscribed', () => {
    const cardWindow = createCardWindow()
    const listener = vi.fn()
    const unsubscribe = cardWindow.subscribe(listener)

    unsubscribe()
    cardWindow.set(5)

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('createGoalCardLayer', () => {
  it('keeps each mounted slot at its goal index and forgets it once unmounted', () => {
    const layer = createGoalCardLayer()
    const element = {} as HTMLElement

    layer.mount(4, element)
    expect(layer.slots[4]).toBe(element)

    layer.mount(4, null)
    expect(layer.slots[4]).toBeNull()
  })
})
