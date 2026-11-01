// What a goal card says (DESIGN.md, GoalCard): number, state and, once opened, both crests and
// the date of a scored goal, or how many goals are left for a missing one. Pure, so the copy is
// tested without a browser.

import type { Club, Clubes, Gol } from '../data/gol.ts'
import { es } from '../i18n/es.ts'
import { GOAL_PIXELS } from '../portrait/sample.ts'

/** The goal the page counts toward. */
export const GOAL_TARGET = GOAL_PIXELS

const DATE_FORMAT = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** A match date (YYYY-MM-DD) in Spanish, as «29 may 2026». */
export function formatFecha(fecha: string): string {
  return DATE_FORMAT.format(new Date(`${fecha}T00:00:00Z`))
}

/** Up to two initials of a club name, the crest placeholder when it has no image. */
export function crestInitials(nombre: string): string {
  return nombre
    .split(/[\s-]+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export interface CardClub {
  nombre: string
  escudo: string | null
  /** Alternative text of its crest. */
  alt: string
  initials: string
}

export type GoalCardData =
  | { numero: number; scored: true; label: string; equipo: CardClub; rival: CardClub; fecha: string }
  | { numero: number; scored: false; label: string; remaining: string }

function cardClub({ nombre, escudo }: Club): CardClub {
  return { nombre, escudo, alt: es.goalCard.crestAlt(nombre), initials: crestInitials(nombre) }
}

/** The card of goal `numero`: scored when it is in `goles`, missing otherwise. */
export function goalCardData(numero: number, goles: Gol[], clubes: Clubes, target: number = GOAL_TARGET): GoalCardData {
  const gol = goles[numero - 1]
  if (!gol) {
    return {
      numero,
      scored: false,
      label: es.goalCard.missingLabel(numero),
      remaining: es.goalCard.remaining(Math.max(target - goles.length, 0)),
    }
  }
  const equipo = cardClub(clubes[gol.equipoId])
  const rival = cardClub(clubes[gol.rivalId])
  const fecha = formatFecha(gol.fecha)
  return {
    numero,
    scored: true,
    label: es.goalCard.scoredLabel(numero, equipo.nombre, rival.nombre, fecha),
    equipo,
    rival,
    fecha,
  }
}
