import { createRandom } from '../lib/random.ts'
import type { Gol } from './gol.ts'

// Placeholder data for the prototypes: real teams and periods of the career with invented
// dates and opponents. Replaced by the real dataset once a prototype is chosen (docs/SPEC.md).

export const FAKE_GOAL_COUNT = 975
export const FAKE_SEED = 7

interface ClubPeriod {
  equipo: string
  from: string
  to: string
}

const CLUB_PERIODS: readonly ClubPeriod[] = [
  { equipo: 'Sporting CP', from: '2002-08-14', to: '2003-05-18' },
  { equipo: 'Manchester United', from: '2003-08-16', to: '2009-05-24' },
  { equipo: 'Real Madrid', from: '2009-08-29', to: '2018-05-26' },
  { equipo: 'Juventus', from: '2018-08-18', to: '2021-05-23' },
  { equipo: 'Manchester United', from: '2021-09-11', to: '2022-11-13' },
  { equipo: 'Al-Nassr', from: '2023-01-22', to: '2026-05-31' },
]

const PORTUGAL = 'Portugal'
const PORTUGAL_DEBUT = '2003-08-20'
const PORTUGAL_SHARE = 0.14

const RIVALS: Readonly<Record<string, readonly string[]>> = {
  'Sporting CP': ['Moreirense', 'Braga', 'Boavista', 'Benfica', 'Vitória de Guimarães'],
  'Manchester United': [
    'Arsenal', 'Chelsea', 'Liverpool', 'Tottenham', 'Newcastle',
    'Aston Villa', 'Everton', 'Fulham', 'West Ham', 'Bolton',
  ],
  'Real Madrid': [
    'Barcelona', 'Atlético de Madrid', 'Sevilla', 'Valencia', 'Getafe',
    'Málaga', 'Athletic Club', 'Real Sociedad', 'Celta de Vigo', 'Espanyol',
  ],
  Juventus: [
    'Inter', 'Milan', 'Napoli', 'Roma', 'Lazio',
    'Torino', 'Fiorentina', 'Atalanta', 'Sampdoria', 'Genoa',
  ],
  'Al-Nassr': [
    'Al-Hilal', 'Al-Ittihad', 'Al-Ahli', 'Al-Shabab', 'Al-Fateh',
    'Al-Taawoun', 'Al-Ettifaq', 'Damac',
  ],
  [PORTUGAL]: [
    'España', 'Suecia', 'Luxemburgo', 'Lituania', 'Andorra',
    'Hungría', 'Ghana', 'Suiza', 'Irlanda', 'Islas Feroe',
  ],
}

export const CAREER_TEAMS: readonly string[] = Object.keys(RIVALS)

const DAY_MS = 86_400_000
const toDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / DAY_MS
const toIso = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)

/** Generates `count` chronological fake goals; the same seed always yields the same list. */
export function generateFakeGoles(count = FAKE_GOAL_COUNT, seed = FAKE_SEED): Gol[] {
  const random = createRandom(seed)
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]

  const periods = CLUB_PERIODS.map((period) => ({
    ...period,
    first: toDay(period.from),
    days: toDay(period.to) - toDay(period.from) + 1,
  }))
  const totalDays = periods.reduce((sum, period) => sum + period.days, 0)

  // Dates are drawn uniformly over the days at a club, then sorted chronologically.
  const draws = Array.from({ length: count }, () => {
    let offset = Math.floor(random() * totalDays)
    const period = periods.find((candidate) => (offset -= candidate.days) < 0)!
    return { day: period.first + period.days + offset, club: period.equipo }
  }).sort((a, b) => a.day - b.day)

  return draws.map(({ day, club }, index) => {
    const fecha = toIso(day)
    const equipo = fecha >= PORTUGAL_DEBUT && random() < PORTUGAL_SHARE ? PORTUGAL : club
    return { numero: index + 1, fecha, equipo, rival: pick(RIVALS[equipo]) }
  })
}
