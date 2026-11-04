import { describe, expect, it } from 'vitest'
import type { Clubes, Gol } from '../data/gol.ts'
import { clubes as realClubes, goles as realGoles } from '../data/goles.ts'
import { ageOn, clubOn, cristianoData } from './cristiano.ts'

const clubes: Clubes = {
  '985': { nombre: 'Manchester United', escudo: '/escudos/985.webp' },
  '1003': { nombre: 'Portsmouth FC', escudo: null },
  '3300': { nombre: 'Portugal', escudo: '/escudos/3300.webp' },
  '3441': { nombre: 'Ghana', escudo: null },
}

const goles: Gol[] = [
  { numero: 1, fecha: '2006-11-04', equipoId: '985', rivalId: '1003' },
  { numero: 2, fecha: '2007-06-02', equipoId: '3300', rivalId: '3441' },
  { numero: 3, fecha: '2022-11-24', equipoId: '3300', rivalId: '3441' },
]

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

describe('clubOn', () => {
  it('follows his clubs in order, from each signing date', () => {
    expect(clubOn('2002-10-07')).toBe('336')
    expect(clubOn('2003-08-11')).toBe('336')
    expect(clubOn('2003-08-12')).toBe('985')
    expect(clubOn('2009-07-01')).toBe('418')
    expect(clubOn('2018-07-10')).toBe('506')
    expect(clubOn('2021-09-01')).toBe('985')
    expect(clubOn('2023-01-01')).toBe('18544')
  })

  it('has no club between Manchester United and Al-Nassr', () => {
    expect(clubOn('2022-11-24')).toBeNull()
  })

  it('agrees with every club goal in goles.json', () => {
    const wrong = realGoles.filter((gol) => realClubes[gol.equipoId].nombre !== 'Portugal' && clubOn(gol.fecha) !== gol.equipoId)

    expect(wrong).toEqual([])
  })
})

describe('cristianoData', () => {
  it('describes Cristiano on the day of a scored goal', () => {
    expect(cristianoData(1, goles, clubes, {}, 1000)).toEqual({
      numero: 1,
      scored: true,
      photo: { year: 2006, src: null, alt: 'Cristiano Ronaldo en 2006' },
      edad: '21 años',
      club: { nombre: 'Manchester United', escudo: '/escudos/985.webp', alt: 'Escudo de Manchester United', initials: 'MU' },
    })
  })

  it('shows his club, not Portugal, on a goal for Portugal', () => {
    const data = cristianoData(2, goles, { ...clubes, ...realClubes }, {}, 1000)

    expect(data.scored && data.club?.nombre).toBe('Manchester United')
  })

  it('shows no club on the 2022 World Cup goal', () => {
    const data = cristianoData(3, goles, { ...clubes, ...realClubes }, {}, 1000)

    expect(data.scored && data.club).toBeNull()
  })

  it('uses the photo of the year when there is one', () => {
    const data = cristianoData(1, goles, clubes, { 2006: '/cristiano/2006.webp' }, 1000)

    expect(data.scored && data.photo.src).toBe('/cristiano/2006.webp')
  })

  it('says how many goals are left for a missing goal', () => {
    expect(cristianoData(4, goles, clubes, {}, 1000)).toEqual({ numero: 4, scored: false, remaining: 'Faltan 997 goles para la meta' })
  })
})
