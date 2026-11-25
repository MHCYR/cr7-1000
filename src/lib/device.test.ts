import { describe, expect, it, vi } from 'vitest'
import { isMobile, MOBILE_QUERY } from './device.ts'

describe('isMobile', () => {
  it('is true when the media query matches', () => {
    const matchMedia = vi.fn(() => ({ matches: true }))
    expect(isMobile(matchMedia)).toBe(true)
  })

  it('is false when the media query does not match', () => {
    const matchMedia = vi.fn(() => ({ matches: false }))
    expect(isMobile(matchMedia)).toBe(false)
  })

  it('consults MOBILE_QUERY exactly', () => {
    const matchMedia = vi.fn(() => ({ matches: false }))
    isMobile(matchMedia)
    expect(matchMedia).toHaveBeenCalledWith(MOBILE_QUERY)
  })

  it('is false without window or matchMedia', () => {
    expect(isMobile()).toBe(false)
  })
})
