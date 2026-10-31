// An official goal (gol oficial): club or Portugal, club friendlies excluded. See GLOSSARY.md.
export interface Gol {
  /** Número de gol: chronological position in Cristiano's career, starting at 1. */
  numero: number
  /** Match date, ISO calendar date (YYYY-MM-DD). */
  fecha: string
  /** Club or national team Cristiano scored for. */
  equipo: string
  /** Team the goal was scored against. */
  rival: string
}

const FIELDS = ['numero', 'fecha', 'equipo', 'rival'] as const
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

/**
 * Checks hand-edited goal data and returns it typed: numbers consecutive from 1,
 * no repeats, non-decreasing ISO dates and the four fields present.
 * Throws an Error describing the first problem found.
 */
export function validateGoles(data: unknown): Gol[] {
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

    seen.add(goal.numero)
    previous = goal
  })

  return data as Gol[]
}
