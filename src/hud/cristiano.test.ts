import { describe, expect, it } from 'vitest'
import type { Clubes, Gol } from '../data/gol.ts'
import { ageOn, cristianoData } from './cristiano.ts'

const clubes: Clubes = {
  '985': { nombre: 'Manchester United', escudo: '/escudos/985.webp' },
  '1003': { nombre: 'Portsmouth FC', escudo: null },
}

const goles: Gol[] = [{ numero: 1, fecha: '2006-11-04', equipoId: '985', rivalId: '1003' }]

describe('ageOn', () => {
  it('counts whole years since his birth on 5 February 1985', () => {
    expect(ageOn('2006-11-04')).toBe(21)
    expect(ageOn('2026-05-29')).toBe(41)
  })

  it('adds the year only from his birthday on', () => {
    expect(ageOn('2003-02-04')).toBe(17)
    expect(ageOn('2003-02-05')).toBe(18)
    expect(ageOn('2003-01-31')).toBe(17)
  })
})

describe('cristianoData', () => {
  it('describes Cristiano on the day of a scored goal', () => {
    expect(cristianoData(1, goles, clubes, {}, 1000)).toEqual({
      numero: 1,
      scored: true,
      photo: { year: 2006, src: null, alt: 'Cristiano Ronaldo en 2006' },
      fecha: '4 nov 2006',
      edad: '21 años',
      equipo: { nombre: 'Manchester United', escudo: '/escudos/985.webp', alt: 'Escudo de Manchester United', initials: 'MU' },
    })
  })

  it('uses the photo of the year when there is one', () => {
    const data = cristianoData(1, goles, clubes, { 2006: '/cristiano/2006.webp' }, 1000)

    expect(data.scored && data.photo.src).toBe('/cristiano/2006.webp')
  })

  it('says how many goals are left for a missing goal', () => {
    expect(cristianoData(2, goles, clubes, {}, 1000)).toEqual({ numero: 2, scored: false, remaining: 'Faltan 999 goles para la meta' })
  })
})
