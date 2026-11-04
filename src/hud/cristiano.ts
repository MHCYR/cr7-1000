// What the indicator says about Cristiano at the current goal (#5): his photo of that year, his
// age that day and the club he played for then, with its crest. Pure, so it is tested without a
// browser.

import type { Clubes, Gol } from '../data/gol.ts'
import { es } from '../i18n/es.ts'
import { type CardClub, GOAL_TARGET, cardClub } from './goalCard.ts'

/** Cristiano Ronaldo's date of birth, ISO calendar date. */
export const BIRTH_DATE = '1985-02-05'

/**
 * Club stints in chronological order: each one starts on its signing date and lasts until the
 * next. A null club is a time without one: between leaving Manchester United and signing for
 * Al-Nassr he only played the 2022 World Cup with Portugal (goal 819).
 */
export const CAREER: readonly { clubId: string | null; from: string }[] = [
  { clubId: '336', from: '2002-08-01' }, // Sporting CP
  { clubId: '985', from: '2003-08-12' }, // Manchester United
  { clubId: '418', from: '2009-07-01' }, // Real Madrid
  { clubId: '506', from: '2018-07-10' }, // Juventus
  { clubId: '985', from: '2021-08-31' }, // Manchester United
  { clubId: null, from: '2022-11-22' }, // Without a club
  { clubId: '18544', from: '2022-12-30' }, // Al-Nassr
]

/** Id of the club Cristiano played for on `date` (YYYY-MM-DD), or null without one. */
export function clubOn(date: string, career: typeof CAREER = CAREER): string | null {
  let club: string | null = null
  for (const stint of career) {
    if (stint.from > date) break
    club = stint.clubId
  }
  return club
}

/**
 * Photo of Cristiano for each year, served from public/: `/cristiano/<year>.webp`, 400×400.
 * Empty for now: a year without a photo shows a placeholder until one is added here.
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
  | { numero: number; scored: true; photo: CristianoPhoto; edad: string; club: CardClub | null }
  | { numero: number; scored: false; remaining: string }

/**
 * What the indicator shows at goal `numero`: Cristiano that day, with his club even when the
 * goal is for Portugal, or how many goals are left.
 */
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
    edad: es.indicator.ageValue(ageOn(gol.fecha)),
    club: clubOrNone(clubOn(gol.fecha), clubes),
  }
}

function clubOrNone(id: string | null, clubes: Clubes): CardClub | null {
  return id === null ? null : cardClub(clubes[id])
}
