import { describe, expect, it } from 'vitest'
import { clubes, goles } from './goles.ts'

const PORTUGAL_ID = '3300'
// Files in public/ are served from the site root: public/escudos/336.webp is /escudos/336.webp.
const crestFiles = new Set(
  Object.keys(import.meta.glob('/public/escudos/*.webp')).map((path) => path.replace(/^\/public/, '')),
)

describe('goles', () => {
  it('loads the real goals and they pass validation', () => {
    // Real data grows over time; 978 is the count when it was first generated.
    expect(goles.length).toBeGreaterThanOrEqual(978)
  })

  it('starts with the first goal for Sporting CP', () => {
    expect(goles[0]).toMatchObject({ numero: 1, fecha: '2002-10-07' })
    expect(clubes[goles[0].equipoId].nombre).toBe('Sporting CP')
  })

  it('only scores for the five career clubs and, among national teams, senior Portugal', () => {
    const nationalIds = new Set(goles.map((goal) => goal.equipoId).filter((id) => id !== PORTUGAL_ID))
    expect([...nationalIds].map((id) => clubes[id].nombre).sort()).toEqual(
      ['Al-Nassr FC', 'Juventus FC', 'Manchester United', 'Real Madrid', 'Sporting CP'].sort(),
    )
  })
})

describe('clubes', () => {
  it('lists exactly the clubs used by the goals', () => {
    const used = new Set(goles.flatMap((goal) => [goal.equipoId, goal.rivalId]))
    expect(new Set(Object.keys(clubes))).toEqual(used)
  })

  it('has every crest it points to in public/', () => {
    const crests = Object.values(clubes).flatMap((club) => (club.escudo === null ? [] : [club.escudo]))
    expect(crests.filter((crest) => !crestFiles.has(crest))).toEqual([])
  })
})
