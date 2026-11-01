import { describe, expect, it } from 'vitest'
import { clubesFrom, clubIdsOf, golesFromPerformance, type PerformanceEntry } from './transfermarkt.ts'

interface Match {
  date: string
  club: string
  opponent: string
  goals: number | null
  competition?: string
  national?: boolean
}

// The fields of a performance-game entry the transform reads, as Transfermarkt returns them.
const entry = ({ date, club, opponent, goals, competition = 'ES1', national = false }: Match): PerformanceEntry => ({
  gameInformation: { competitionId: competition, isNationalGame: national, date: { dateTimeUTC: date } },
  clubsInformation: { club: { clubId: club }, opponent: { clubId: opponent } },
  statistics: { goalStatistics: { goalsScoredTotal: goals } },
})

describe('golesFromPerformance', () => {
  it('numbers the goals chronologically, oldest first, one goal per entry', () => {
    const matches = [
      entry({ date: '2010-02-21T20:00:00+00:00', club: '418', opponent: '681', goals: 2 }),
      entry({ date: '2002-10-07T19:00:00+00:00', club: '336', opponent: '979', goals: 1 }),
    ]
    expect(golesFromPerformance(matches)).toEqual([
      { numero: 1, fecha: '2002-10-07', equipoId: '336', rivalId: '979' },
      { numero: 2, fecha: '2010-02-21', equipoId: '418', rivalId: '681' },
      { numero: 3, fecha: '2010-02-21', equipoId: '418', rivalId: '681' },
    ])
  })

  it('keeps senior Portugal goals, friendlies included, and drops youth and Olympic national teams', () => {
    const matches = [
      entry({ date: '2004-06-12T16:00:00+00:00', club: '3300', opponent: '3304', goals: 1, competition: 'EURO', national: true }),
      entry({ date: '2004-08-18T18:00:00+00:00', club: '3300', opponent: '3437', goals: 1, competition: 'FS', national: true }),
      entry({ date: '2002-10-11T15:00:00+00:00', club: '16374', opponent: '3437', goals: 2, competition: 'U21Q', national: true }),
      entry({ date: '2004-08-12T15:00:00+00:00', club: '53807', opponent: '3449', goals: 1, competition: 'OLYM', national: true }),
    ]
    expect(golesFromPerformance(matches)).toEqual([
      { numero: 1, fecha: '2004-06-12', equipoId: '3300', rivalId: '3304' },
      { numero: 2, fecha: '2004-08-18', equipoId: '3300', rivalId: '3437' },
    ])
  })

  it('drops club friendlies and matches without goals', () => {
    const matches = [
      entry({ date: '2009-07-20T18:00:00+00:00', club: '418', opponent: '27', goals: 2, competition: 'FS' }),
      entry({ date: '2009-08-29T20:00:00+00:00', club: '418', opponent: '897', goals: 0 }),
      entry({ date: '2009-09-12T20:00:00+00:00', club: '418', opponent: '1050', goals: null }),
    ]
    expect(golesFromPerformance(matches)).toEqual([])
  })

  it('takes the date from the UTC kickoff', () => {
    const matches = [entry({ date: '2026-10-29T23:30:00+00:00', club: '18544', opponent: '91427', goals: 1, competition: 'SA1' })]
    expect(golesFromPerformance(matches)[0].fecha).toBe('2026-10-29')
  })
})

describe('clubIdsOf', () => {
  it('lists every team and opponent once, sorted', () => {
    const goles = [
      { numero: 1, fecha: '2002-10-07', equipoId: '336', rivalId: '979' },
      { numero: 2, fecha: '2003-08-27', equipoId: '985', rivalId: '336' },
      { numero: 3, fecha: '2003-09-01', equipoId: '985', rivalId: '979' },
    ]
    expect(clubIdsOf(goles)).toEqual(['336', '979', '985'])
  })
})

describe('clubesFrom', () => {
  it('maps each club to its name and its crest path when the crest was downloaded', () => {
    const clubs = [
      { id: '985', name: 'Manchester United' },
      { id: '336', name: 'Sporting CP' },
    ]
    expect(clubesFrom(clubs, new Set(['336']))).toEqual({
      '336': { nombre: 'Sporting CP', escudo: '/escudos/336.png' },
      '985': { nombre: 'Manchester United', escudo: null },
    })
  })
})
