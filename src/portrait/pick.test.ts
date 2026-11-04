import { describe, expect, it } from 'vitest'
import { LAST_PORTRAIT_KEY, PORTRAIT_PHOTOS, choosePortrait, pickPortrait } from './pick.ts'

const photos = ['/a.webp', '/b.webp', '/c.webp']

const memoryStorage = (initial: Record<string, string> = {}) => {
  const items = new Map(Object.entries(initial))
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

const throwing = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

describe('PORTRAIT_PHOTOS', () => {
  it('holds the 25 photos of public/cristiano/, each served from the site root', () => {
    const files = Object.keys(import.meta.glob('/public/cristiano/*.webp')).map((file) => file.replace('/public', ''))
    expect(PORTRAIT_PHOTOS).toHaveLength(25)
    expect([...PORTRAIT_PHOTOS].sort()).toEqual(files.sort())
  })
})

describe('pickPortrait', () => {
  it('spreads the random number over every photo', () => {
    expect(pickPortrait(photos, null, () => 0)).toBe('/a.webp')
    expect(pickPortrait(photos, null, () => 0.5)).toBe('/b.webp')
    expect(pickPortrait(photos, null, () => 0.999)).toBe('/c.webp')
  })

  it('never repeats the last photo', () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) expect(pickPortrait(photos, '/b.webp', () => r)).not.toBe('/b.webp')
  })

  it('ignores a last photo that is no longer in the list', () => {
    expect(pickPortrait(photos, '/gone.webp', () => 0.999)).toBe('/c.webp')
  })

  it('repeats the only photo there is', () => {
    expect(pickPortrait(['/a.webp'], '/a.webp')).toBe('/a.webp')
  })

  it('fails without photos', () => {
    expect(() => pickPortrait([], null)).toThrow('There is no photo to draw the portrait from')
  })
})

describe('choosePortrait', () => {
  it('avoids the stored photo and stores the new one', () => {
    const storage = memoryStorage({ [LAST_PORTRAIT_KEY]: '/a.webp' })
    const photo = choosePortrait(storage, () => 0, photos)
    expect(photo).toBe('/b.webp')
    expect(storage.items.get(LAST_PORTRAIT_KEY)).toBe('/b.webp')
  })

  it('draws at random without storage', () => {
    expect(choosePortrait(null, () => 0, photos)).toBe('/a.webp')
  })

  it('draws at random when the storage throws', () => {
    expect(choosePortrait(throwing, () => 0.5, photos)).toBe('/b.webp')
  })
})
