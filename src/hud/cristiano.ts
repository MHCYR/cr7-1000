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

/** Years with a photo of Cristiano in public/cristiano/: from his first goal to today. */
export const PHOTO_YEARS = { first: 2002, last: 2026 } as const

/**
 * Photo of Cristiano for each year, served from public/: `/cristiano/<year>.webp`, 800×800 for a
 * 400×400 frame. A year missing here shows a placeholder.
 */
export const PHOTOS: Readonly<Record<number, string>> = Object.fromEntries(
  Array.from({ length: PHOTO_YEARS.last - PHOTO_YEARS.first + 1 }, (_, i) => {
    const year = PHOTO_YEARS.first + i
    return [year, `/cristiano/${year}.webp`]
  }),
)

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

/** The first goal of each year with goals, in order: where the photo changes. */
export interface YearStart {
  year: number
  /** Number of its first goal. */
  start: number
}

export function yearStarts(goles: Gol[]): YearStart[] {
  const starts: YearStart[] = []
  for (const gol of goles) {
    const year = Number(gol.fecha.slice(0, 4))
    if (starts.at(-1)?.year !== year) starts.push({ year, start: gol.numero })
  }
  return starts
}

/** Goals of scroll over which one year's photo hands over to the next, centered on its first goal. */
export const PHOTO_BLEND_GOALS = 6

/** Two photos at once: `from` with opacity 1 - t under `to` with opacity t. Same year when steady. */
export interface PhotoBlend {
  from: number
  to: number
  t: number
}

/**
 * The photos at `position`, a goal number that moves continuously with the scroll: around the
 * first goal of each year the photo of the year before fades out while the new one fades in,
 * over PHOTO_BLEND_GOALS goals or half the way to the next change, whichever is shorter. Tied to
 * the scroll, not to time, so it stops halfway when the scroll does, and fast scrolling never
 * piles up photos: there are never more than two.
 */
export function photoBlend(position: number, starts: readonly YearStart[], window: number = PHOTO_BLEND_GOALS): PhotoBlend {
  const steady = (year: number): PhotoBlend => ({ from: year, to: year, t: 1 })
  if (starts.length === 0) return steady(0)
  for (let k = 1; k < starts.length; k++) {
    const change = starts[k].start
    const next = k + 1 < starts.length ? starts[k + 1].start - change : window
    const half = Math.min(window, change - starts[k - 1].start, next) / 2
    if (position < change - half) return steady(starts[k - 1].year)
    if (position < change + half) return { from: starts[k - 1].year, to: starts[k].year, t: (position - (change - half)) / (2 * half) }
  }
  return steady(starts[starts.length - 1].year)
}
