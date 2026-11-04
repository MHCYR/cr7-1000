// What the indicator says about Cristiano at the current goal (#5): his photo of that year, the
// date, his age that day and the team he scored for, with its crest. Pure, so it is tested
// without a browser.

import type { Clubes, Gol } from '../data/gol.ts'
import { es } from '../i18n/es.ts'
import { type CardClub, GOAL_TARGET, cardClub, formatFecha } from './goalCard.ts'

/** Cristiano Ronaldo's date of birth, ISO calendar date. */
export const BIRTH_DATE = '1985-02-05'

/**
 * Photo of Cristiano for each year, served from public/: `/cristiano/<year>.webp`. Empty for now:
 * a year without a photo shows a placeholder until one is added here.
 */
export const PHOTOS: Readonly<Record<number, string>> = {}

/** Whole years between `birth` and `date`, both YYYY-MM-DD. */
export function ageOn(date: string, birth: string = BIRTH_DATE): number {
  const [y, m, d] = date.split('-').map(Number)
  const [by, bm, bd] = birth.split('-').map(Number)
  const hadBirthday = m > bm || (m === bm && d >= bd)
  return y - by - (hadBirthday ? 0 : 1)
}

export interface CristianoPhoto {
  year: number
  /** Image path, or null while the year has no photo: the indicator draws a placeholder. */
  src: string | null
  alt: string
}

export type CristianoData =
  | { numero: number; scored: true; photo: CristianoPhoto; fecha: string; edad: string; equipo: CardClub }
  | { numero: number; scored: false; remaining: string }

/** What the indicator shows at goal `numero`: Cristiano that day, or how many goals are left. */
export function cristianoData(
  numero: number,
  goles: Gol[],
  clubes: Clubes,
  photos: Readonly<Record<number, string>> = PHOTOS,
  target: number = GOAL_TARGET,
): CristianoData {
  const gol = goles[numero - 1]
  if (!gol) return { numero, scored: false, remaining: es.goalCard.remaining(Math.max(target - goles.length, 0)) }

  const year = Number(gol.fecha.slice(0, 4))
  return {
    numero,
    scored: true,
    photo: { year, src: photos[year] ?? null, alt: es.indicator.photoAlt(year) },
    fecha: formatFecha(gol.fecha),
    edad: es.indicator.ageValue(ageOn(gol.fecha)),
    equipo: cardClub(clubes[gol.equipoId]),
  }
}
