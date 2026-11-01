import { describe, expect, it } from 'vitest'
import type { Clubes, Gol } from '../data/gol.ts'
import { crestInitials, formatFecha, goalCardData } from './goalCard.ts'

const clubes: Clubes = {
  '18544': { nombre: 'Al-Nassr', escudo: '/escudos/18544.webp' },
  '3': { nombre: 'Al-Taawoun', escudo: null },
}

const goles: Gol[] = [
  { numero: 1, fecha: '2026-05-29', equipoId: '18544', rivalId: '3' },
  { numero: 2, fecha: '2026-09-03', equipoId: '18544', rivalId: '3' },
]

describe('formatFecha', () => {
  it('writes the date in Spanish, without a trailing dot after the month', () => {
    expect(formatFecha('2026-05-29')).toBe('29 may 2026')
    expect(formatFecha('2003-08-16')).toBe('16 ago 2003')
  })

  it('keeps the calendar day whatever the time zone', () => {
    expect(formatFecha('2026-01-01')).toBe('1 ene 2026')
    expect(formatFecha('2026-12-31')).toBe('31 dic 2026')
  })
})

describe('crestInitials', () => {
  it('takes the first letters of up to two words', () => {
    expect(crestInitials('Al-Nassr')).toBe('AN')
    expect(crestInitials('Real Madrid CF')).toBe('RM')
    expect(crestInitials('Portugal')).toBe('P')
  })

  it('skips words that do not start with a letter', () => {
    expect(crestInitials('Bayer 04 Leverkusen')).toBe('BL')
  })
})

describe('goalCardData', () => {
  it('describes a scored goal with both clubs and the date', () => {
    const card = goalCardData(1, goles, clubes, 1000)

    expect(card).toEqual({
      numero: 1,
      scored: true,
      label: 'Gol 1, Al-Nassr contra Al-Taawoun, 29 may 2026',
      fecha: '29 may 2026',
      equipo: { nombre: 'Al-Nassr', escudo: '/escudos/18544.webp', alt: 'Escudo de Al-Nassr', initials: 'AN' },
      rival: { nombre: 'Al-Taawoun', escudo: null, alt: 'Escudo de Al-Taawoun', initials: 'AT' },
    })
  })

  it('describes a missing goal with how many goals are left for the target', () => {
    expect(goalCardData(988, goles, clubes, 1000)).toEqual({
      numero: 988,
      scored: false,
      label: 'Gol 988, por marcar',
      remaining: 'Faltan 998 goles para la meta',
    })
  })

  it('uses the singular with one goal left', () => {
    const card = goalCardData(3, goles, clubes, 3)

    expect(card.scored).toBe(false)
    expect(card.scored === false && card.remaining).toBe('Falta 1 gol para la meta')
  })
})
