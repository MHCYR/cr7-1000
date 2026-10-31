import { describe, expect, it } from 'vitest'
import { CAREER_TEAMS, generateFakeGoles } from './fake-goles.ts'
import { validateGoles } from './gol.ts'
import { goles } from './goles.ts'

describe('goles', () => {
  it('loads the 975 fake goals and they pass validation', () => {
    expect(goles).toHaveLength(975)
    expect(() => validateGoles(goles)).not.toThrow()
  })

  it('matches what `pnpm data:fake` regenerates', () => {
    expect(generateFakeGoles()).toEqual(goles)
  })
})

describe('generateFakeGoles', () => {
  it('is reproducible for the same seed and changes with another seed', () => {
    expect(generateFakeGoles(50, 1)).toEqual(generateFakeGoles(50, 1))
    expect(generateFakeGoles(50, 2)).not.toEqual(generateFakeGoles(50, 1))
  })

  it('only uses teams from the career and never scores against itself', () => {
    for (const goal of generateFakeGoles()) {
      expect(CAREER_TEAMS).toContain(goal.equipo)
      expect(goal.rival).not.toBe(goal.equipo)
    }
  })

  it('assigns each club goal to the club Cristiano played for on that date', () => {
    const atJuventus = generateFakeGoles().filter((goal) => goal.equipo === 'Juventus')
    expect(atJuventus.length).toBeGreaterThan(0)
    for (const goal of atJuventus) {
      expect(goal.fecha >= '2018-08-18' && goal.fecha <= '2021-05-23').toBe(true)
    }
  })
})
