import { describe, expect, it } from 'vitest'
import { validateClubes, validateGoles } from './gol.ts'

const clubes = {
  '336': { nombre: 'Sporting CP', escudo: '/escudos/336.png' },
  '979': { nombre: 'Moreirense FC', escudo: '/escudos/979.png' },
  '985': { nombre: 'Manchester United', escudo: '/escudos/985.png' },
  '355': { nombre: 'Bolton Wanderers', escudo: null },
}

const valid = [
  { numero: 1, fecha: '2002-10-07', equipoId: '336', rivalId: '979' },
  { numero: 2, fecha: '2002-10-07', equipoId: '336', rivalId: '979' },
  { numero: 3, fecha: '2003-08-27', equipoId: '985', rivalId: '355' },
]

describe('validateGoles', () => {
  it('returns the goals when the list is valid', () => {
    expect(validateGoles(valid, clubes)).toEqual(valid)
  })

  it('accepts several goals on the same date', () => {
    expect(() => validateGoles(valid.slice(0, 2), clubes)).not.toThrow()
  })

  it('rejects a repeated goal number', () => {
    const data = [valid[0], { ...valid[1], numero: 1 }]
    expect(() => validateGoles(data, clubes)).toThrow('Goal number 1 is repeated (position 2)')
  })

  it('rejects a gap in the goal numbers', () => {
    const data = [valid[0], { ...valid[1], numero: 3 }]
    expect(() => validateGoles(data, clubes)).toThrow('Expected goal number 2 at position 2, found 3')
  })

  it('rejects a list that does not start at 1', () => {
    expect(() => validateGoles([{ ...valid[0], numero: 2 }], clubes)).toThrow(
      'Expected goal number 1 at position 1, found 2',
    )
  })

  it('rejects a date earlier than the previous goal', () => {
    const data = [valid[0], { ...valid[1], fecha: '2002-10-06' }]
    expect(() => validateGoles(data, clubes)).toThrow(
      'Goal 2 has date 2002-10-06, earlier than goal 1 (2002-10-07)',
    )
  })

  it('rejects a date that is not an ISO calendar date', () => {
    expect(() => validateGoles([{ ...valid[0], fecha: '07/10/2002' }], clubes)).toThrow(
      'Goal 1 has an invalid date: 07/10/2002 (expected YYYY-MM-DD)',
    )
    expect(() => validateGoles([{ ...valid[0], fecha: '2002-02-30' }], clubes)).toThrow(
      'Goal 1 has an invalid date: 2002-02-30 (expected YYYY-MM-DD)',
    )
  })

  it.each(['numero', 'fecha', 'equipoId', 'rivalId'])('rejects a goal without %s', (field) => {
    const goal: Record<string, unknown> = { ...valid[0] }
    delete goal[field]
    expect(() => validateGoles([goal], clubes)).toThrow(`Goal at position 1 is missing "${field}"`)
  })

  it('rejects an empty team or opponent id', () => {
    expect(() => validateGoles([{ ...valid[0], rivalId: ' ' }], clubes)).toThrow(
      'Goal at position 1 is missing "rivalId"',
    )
  })

  it('rejects data that is not a list', () => {
    expect(() => validateGoles({ goles: valid }, clubes)).toThrow('Goal data must be an array')
  })

  it('rejects a team or opponent that is not in the club list', () => {
    expect(() => validateGoles([{ ...valid[0], equipoId: '418' }], clubes)).toThrow(
      'Goal 1 has an unknown equipoId: 418',
    )
    expect(() => validateGoles([{ ...valid[0], rivalId: '131' }], clubes)).toThrow(
      'Goal 1 has an unknown rivalId: 131',
    )
  })

  it('rejects a goal against its own team', () => {
    expect(() => validateGoles([{ ...valid[0], rivalId: '336' }], clubes)).toThrow(
      'Goal 1 has the same team and opponent: 336',
    )
  })
})

describe('validateClubes', () => {
  it('returns the clubs when the map is valid, with or without a crest', () => {
    expect(validateClubes(clubes)).toEqual(clubes)
  })

  it('rejects data that is not an object keyed by club id', () => {
    expect(() => validateClubes([clubes['336']])).toThrow('Club data must be an object keyed by club id')
    expect(() => validateClubes(null)).toThrow('Club data must be an object keyed by club id')
  })

  it('rejects a club without a name', () => {
    expect(() => validateClubes({ '336': { nombre: ' ', escudo: null } })).toThrow(
      'Club 336 is missing "nombre"',
    )
    expect(() => validateClubes({ '336': { escudo: null } })).toThrow('Club 336 is missing "nombre"')
  })

  it('rejects a crest outside /escudos/<id>.png', () => {
    expect(() => validateClubes({ '336': { nombre: 'Sporting CP', escudo: '/escudos/418.png' } })).toThrow(
      'Club 336 has an invalid crest: /escudos/418.png (expected /escudos/336.png or null)',
    )
    expect(() => validateClubes({ '336': { nombre: 'Sporting CP' } })).toThrow(
      'Club 336 has an invalid crest: undefined (expected /escudos/336.png or null)',
    )
  })
})
