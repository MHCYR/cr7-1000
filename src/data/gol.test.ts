import { describe, expect, it } from 'vitest'
import { validateGoles } from './gol.ts'

const valid = [
  { numero: 1, fecha: '2002-10-07', equipo: 'Sporting CP', rival: 'Moreirense' },
  { numero: 2, fecha: '2002-10-07', equipo: 'Sporting CP', rival: 'Moreirense' },
  { numero: 3, fecha: '2003-08-27', equipo: 'Manchester United', rival: 'Bolton' },
]

describe('validateGoles', () => {
  it('returns the goals when the list is valid', () => {
    expect(validateGoles(valid)).toEqual(valid)
  })

  it('accepts several goals on the same date', () => {
    expect(() => validateGoles(valid.slice(0, 2))).not.toThrow()
  })

  it('rejects a repeated goal number', () => {
    const data = [valid[0], { ...valid[1], numero: 1 }]
    expect(() => validateGoles(data)).toThrow('Goal number 1 is repeated (position 2)')
  })

  it('rejects a gap in the goal numbers', () => {
    const data = [valid[0], { ...valid[1], numero: 3 }]
    expect(() => validateGoles(data)).toThrow('Expected goal number 2 at position 2, found 3')
  })

  it('rejects a list that does not start at 1', () => {
    expect(() => validateGoles([{ ...valid[0], numero: 2 }])).toThrow(
      'Expected goal number 1 at position 1, found 2',
    )
  })

  it('rejects a date earlier than the previous goal', () => {
    const data = [valid[0], { ...valid[1], fecha: '2002-10-06' }]
    expect(() => validateGoles(data)).toThrow(
      'Goal 2 has date 2002-10-06, earlier than goal 1 (2002-10-07)',
    )
  })

  it('rejects a date that is not an ISO calendar date', () => {
    expect(() => validateGoles([{ ...valid[0], fecha: '07/10/2002' }])).toThrow(
      'Goal 1 has an invalid date: 07/10/2002 (expected YYYY-MM-DD)',
    )
    expect(() => validateGoles([{ ...valid[0], fecha: '2002-02-30' }])).toThrow(
      'Goal 1 has an invalid date: 2002-02-30 (expected YYYY-MM-DD)',
    )
  })

  it.each(['numero', 'fecha', 'equipo', 'rival'])('rejects a goal without %s', (field) => {
    const goal: Record<string, unknown> = { ...valid[0] }
    delete goal[field]
    expect(() => validateGoles([goal])).toThrow(`Goal at position 1 is missing "${field}"`)
  })

  it('rejects an empty team or opponent', () => {
    expect(() => validateGoles([{ ...valid[0], rival: ' ' }])).toThrow(
      'Goal at position 1 is missing "rival"',
    )
  })

  it('rejects data that is not a list', () => {
    expect(() => validateGoles({ goles: valid })).toThrow('Goal data must be an array')
  })
})
