// The single "is this mobile" test for the whole project: dust density, dpr and the goal
// cards will all decide together, so a tablet can't get mobile cards and desktop density.
// 639px is the same cut already used by src/hud/goalIndicator.css and src/hud/goalCards.css.
export const MOBILE_QUERY = '(pointer: coarse) and (max-width: 639px)'

export function isMobile(matchMedia?: (query: string) => { matches: boolean }): boolean {
  // A caller-supplied matchMedia (e.g. in tests) decides without touching the window.
  if (matchMedia) return matchMedia(MOBILE_QUERY).matches
  // Without window or matchMedia there is nothing to measure against: not mobile.
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(MOBILE_QUERY).matches
}
