import { PHOTOS } from '../hud/cristiano.ts'

// The portrait comes from one of Cristiano's photos, drawn at random on each visit so the page
// looks different every time, and never the same photo as the visit before.

/** Every photo the portrait can be drawn from, `/cristiano/<year>.webp`, oldest first. */
export const PORTRAIT_PHOTOS: readonly string[] = Object.values(PHOTOS)

/** localStorage key holding the photo of the last visit. */
export const LAST_PORTRAIT_KEY = 'cr7:last-portrait'

/**
 * A photo at random from `photos`, other than `last` whenever there is another one to choose.
 * `random` returns a number in [0, 1), like Math.random.
 */
export function pickPortrait(photos: readonly string[], last: string | null, random: () => number = Math.random): string {
  if (photos.length === 0) throw new Error('There is no photo to draw the portrait from')
  const others = photos.filter((photo) => photo !== last)
  const pool = others.length > 0 ? others : photos
  return pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)]
}

/** Minimal Storage needed to remember the last photo; reading or writing it may throw. */
export type PortraitStorage = Pick<Storage, 'getItem' | 'setItem'>

const browserStorage = (): PortraitStorage | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Draws this visit's photo, avoiding the last visit's, and remembers it for the next one. Without
 * storage (private windows, blocked site data) it is just a random photo.
 */
export function choosePortrait(storage: PortraitStorage | null = browserStorage(), random: () => number = Math.random, photos: readonly string[] = PORTRAIT_PHOTOS): string {
  let last: string | null = null
  try {
    last = storage?.getItem(LAST_PORTRAIT_KEY) ?? null
  } catch {
    // Unreadable storage: draw without avoiding the last photo.
  }
  const photo = pickPortrait(photos, last, random)
  try {
    storage?.setItem(LAST_PORTRAIT_KEY, photo)
  } catch {
    // Unwritable storage: the next visit may repeat this photo.
  }
  return photo
}
