// The first goal of the card window (cardLayout.ts, visibleRange), shared outside React: the
// scene sets it every frame and GoalCards rerenders only when it changes, once per goal.

/** What the scene and GoalCards share about the cards. */
export interface GoalCardLayer {
  /** One entry per goal, index i for goal i + 1; only the mounted cards are not null. */
  readonly slots: readonly (HTMLElement | null)[]
  /** Called by each card slot as React mounts (element) and unmounts (null) it. */
  mount(index: number, element: HTMLElement | null): void
  readonly window: CardWindow
}

export function createGoalCardLayer(): GoalCardLayer {
  const slots: (HTMLElement | null)[] = []
  return {
    slots,
    mount: (index, element) => void (slots[index] = element),
    window: createCardWindow(),
  }
}

export interface CardWindow {
  start(): number
  set(start: number): void
  subscribe(listener: () => void): () => void
}

export function createCardWindow(): CardWindow {
  let start = 0
  const listeners = new Set<() => void>()
  return {
    start: () => start,
    set(next) {
      if (next === start) return
      start = next
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
  }
}
