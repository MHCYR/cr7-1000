import { describe, expect, it } from 'vitest'
import type { Clubes, Gol } from '../data/gol.ts'
import { clubes as realClubes, goles as realGoles } from '../data/goles.ts'
import { PHOTOS, ageOn, clubOn, cristianoData, photoBlend, yearStarts } from './cristiano.ts'

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

describe('PHOTOS', () => {
  it('has a photo for the year of every goal scored', () => {
    const years = new Set(realGoles.map((gol) => Number(gol.fecha.slice(0, 4))))

    expect([...years].filter((year) => !PHOTOS[year])).toEqual([])
  })

  it('points at files in public/', () => {
    const files = Object.keys(import.meta.glob('/public/cristiano/*.webp')).map((file) => file.replace('/public', ''))
    const missing = Object.values(PHOTOS).filter((src) => !files.includes(src))

    expect(missing).toEqual([])
  })
})

describe('yearStarts', () => {
  it('gives the first goal of each year', () => {
    expect(yearStarts(goles)).toEqual([
      { year: 2006, start: 1 },
      { year: 2007, start: 2 },
      { year: 2022, start: 3 },
    ])
  })
})

describe('photoBlend', () => {
  const starts = [
    { year: 2013, start: 330 },
    { year: 2014, start: 399 },
    { year: 2015, start: 460 },
  ]

  it('shows one photo away from a change of year', () => {
    expect(photoBlend(380, starts)).toEqual({ from: 2013, to: 2013, t: 1 })
    expect(photoBlend(420, starts)).toEqual({ from: 2014, to: 2014, t: 1 })
    expect(photoBlend(500, starts)).toEqual({ from: 2015, to: 2015, t: 1 })
  })

  it('fades one year into the next over 24 goals of scroll, centered on its first goal', () => {
    expect(photoBlend(386.9, starts)).toEqual({ from: 2013, to: 2013, t: 1 })
    expect(photoBlend(387, starts)).toEqual({ from: 2013, to: 2014, t: 0 })
    expect(photoBlend(399, starts)).toEqual({ from: 2013, to: 2014, t: 0.5 })
    expect(photoBlend(411, starts)).toEqual({ from: 2014, to: 2014, t: 1 })
  })

  it('eases in and out: slow at both ends, fastest at the first goal of the year', () => {
    expect(photoBlend(393, starts).t).toBeCloseTo(0.156)
    expect(photoBlend(405, starts).t).toBeCloseTo(0.844)
    expect(photoBlend(388, starts).t).toBeLessThan(1 / 24)
  })

  it('shortens the fade when two changes are close', () => {
    const close = [
      { year: 2002, start: 1 },
      { year: 2003, start: 6 },
      { year: 2004, start: 7 },
    ]

    expect(photoBlend(5.4, close)).toEqual({ from: 2002, to: 2002, t: 1 })
    expect(photoBlend(5.5, close)).toEqual({ from: 2002, to: 2003, t: 0 })
    expect(photoBlend(6, close)).toEqual({ from: 2002, to: 2003, t: 0.5 })
    expect(photoBlend(6.5, close)).toEqual({ from: 2003, to: 2004, t: 0 })
    expect(photoBlend(7, close)).toEqual({ from: 2003, to: 2004, t: 0.5 })
  })

  it('finds a change of year for every year from 2002 to 2026', () => {
    const real = yearStarts(realGoles)

    expect(real.map(({ year }) => year)).toEqual(Array.from({ length: 25 }, (_, i) => 2002 + i))
  })
})
