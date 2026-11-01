// An official goal (gol oficial): club or Portugal, club friendlies excluded. See GLOSSARY.md.
export interface Gol {
  /** Número de gol: chronological position in Cristiano's career, starting at 1. */
  numero: number
  /** Match date, ISO calendar date (YYYY-MM-DD). */
  fecha: string
  /** Transfermarkt id of the club or national team Cristiano scored for; a key of the club list. */
  equipoId: string
  /** Transfermarkt id of the team the goal was scored against; a key of the club list. */
  rivalId: string
}

// A club or national team that appears in the goals, as equipo or rival.
export interface Club {
  /** Name as Transfermarkt publishes it. */
  nombre: string
  /** Path of the crest served from public/, `/escudos/<id>.png`, or null when there is none. */
  escudo: string | null
}

/** Clubs keyed by Transfermarkt id. */
export type Clubes = Record<string, Club>

const FIELDS = ['numero', 'fecha', 'equipoId', 'rivalId'] as const
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  // Rejects dates that Date silently rolls over, such as 2002-02-30.
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isPresent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== ''
  return typeof value === 'number' && Number.isInteger(value)
}

/** Crest path a club with this id must use. */
export const escudoPath = (id: string) => `/escudos/${id}.png`

/**
 * Checks the club list and returns it typed: an object keyed by club id, every club
 * with a name and a crest at its own `/escudos/<id>.png` or null.
 * Throws an Error describing the first problem found.
 */
export function validateClubes(data: unknown): Clubes {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Club data must be an object keyed by club id')
  }

  for (const [id, club] of Object.entries(data as Record<string, Record<string, unknown>>)) {
    if (club === null || typeof club !== 'object' || !isPresent(club.nombre)) {
      throw new Error(`Club ${id} is missing "nombre"`)
    }
    if (club.escudo !== null && club.escudo !== escudoPath(id)) {
      throw new Error(`Club ${id} has an invalid crest: ${club.escudo} (expected ${escudoPath(id)} or null)`)
    }
  }

  return data as Clubes
}

/**
 * Checks goal data against the club list and returns it typed: numbers consecutive from 1,
 * no repeats, non-decreasing ISO dates, the four fields present and both ids in the club list.
 * Throws an Error describing the first problem found.
 */
export function validateGoles(data: unknown, clubes: Clubes): Gol[] {
  if (!Array.isArray(data)) throw new Error('Goal data must be an array')

  const seen = new Set<number>()
  let previous: Gol | undefined

  data.forEach((item: Record<string, unknown>, index) => {
    const position = index + 1
    for (const field of FIELDS) {
      if (item === null || typeof item !== 'object' || !isPresent(item[field])) {
        throw new Error(`Goal at position ${position} is missing "${field}"`)
      }
    }
    const goal = item as unknown as Gol

    if (seen.has(goal.numero)) {
      throw new Error(`Goal number ${goal.numero} is repeated (position ${position})`)
    }
    if (goal.numero !== position) {
      throw new Error(`Expected goal number ${position} at position ${position}, found ${goal.numero}`)
    }
    if (!isCalendarDate(goal.fecha)) {
      throw new Error(`Goal ${goal.numero} has an invalid date: ${goal.fecha} (expected YYYY-MM-DD)`)
    }
    if (previous && goal.fecha < previous.fecha) {
      throw new Error(
        `Goal ${goal.numero} has date ${goal.fecha}, earlier than goal ${previous.numero} (${previous.fecha})`,
      )
    }

    for (const field of ['equipoId', 'rivalId'] as const) {
      if (!Object.hasOwn(clubes, goal[field])) {
        throw new Error(`Goal ${goal.numero} has an unknown ${field}: ${goal[field]}`)
      }
    }
    if (goal.equipoId === goal.rivalId) {
      throw new Error(`Goal ${goal.numero} has the same team and opponent: ${goal.equipoId}`)
    }

    seen.add(goal.numero)
    previous = goal
  })

  return data as Gol[]
}
