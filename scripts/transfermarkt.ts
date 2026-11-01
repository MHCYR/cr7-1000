// Pure transforms from Transfermarkt's JSON API (tmapi.transfermarkt.technology) to the goal
// and club data in src/data/. The network side lives in scripts/fetch-goles.ts.
import { createHash } from 'node:crypto'
import { escudoPath, type Clubes, type Gol } from '../src/data/gol.ts'

export const CRISTIANO_ID = '8198'
/** Portugal's senior national team; other Portugal ids are youth or Olympic teams. */
export const PORTUGAL_ID = '3300'
/** Competition id Transfermarkt uses for friendlies, club and national alike. */
const FRIENDLY = 'FS'

/** The fields of a `/player/{id}/performance-game` entry that the transform reads. */
export interface PerformanceEntry {
  gameInformation: {
    competitionId: string
    isNationalGame: boolean
    date: { dateTimeUTC: string }
  }
  clubsInformation: {
    club: { clubId: string }
    opponent: { clubId: string }
  }
  statistics: {
    goalStatistics: { goalsScoredTotal: number | null }
  }
}

/** The fields of a `/clubs?ids[]=` entry that the transform reads. */
export interface ClubEntry {
  id: string
  name: string
}

// Official goals (GLOSSARY.md): every competitive club match and every senior Portugal
// match, friendlies included, since international friendlies are official.
function isOfficial({ gameInformation, clubsInformation }: PerformanceEntry): boolean {
  if (gameInformation.isNationalGame) return clubsInformation.club.clubId === PORTUGAL_ID
  return gameInformation.competitionId !== FRIENDLY
}

/** Expands each match into one goal per goal scored, numbered chronologically from 1. */
export function golesFromPerformance(entries: readonly PerformanceEntry[]): Gol[] {
  // Transfermarkt lists the most recent match first; ISO UTC strings sort chronologically.
  const matches = entries
    .filter((entry) => (entry.statistics.goalStatistics.goalsScoredTotal ?? 0) > 0 && isOfficial(entry))
    .toSorted((a, b) => a.gameInformation.date.dateTimeUTC.localeCompare(b.gameInformation.date.dateTimeUTC))

  return matches.flatMap((entry) =>
    Array.from({ length: entry.statistics.goalStatistics.goalsScoredTotal ?? 0 }, () => ({
      fecha: entry.gameInformation.date.dateTimeUTC.slice(0, 10),
      equipoId: entry.clubsInformation.club.clubId,
      rivalId: entry.clubsInformation.opponent.clubId,
    })),
  ).map((goal, index) => ({ numero: index + 1, ...goal }))
}

const byNumericId = (a: string, b: string) => Number(a) - Number(b) || a.localeCompare(b)

/** Groups club ids whose crests are byte-identical, ordered numerically. */
export function duplicateCrests(crests: readonly { id: string; bytes: Uint8Array }[]): string[][] {
  const groups = new Map<string, string[]>()
  for (const { id, bytes } of crests) {
    const hash = createHash('sha256').update(bytes).digest('hex')
    const group = groups.get(hash)
    if (group) group.push(id)
    else groups.set(hash, [id])
  }
  return [...groups.values()]
    .filter((group) => group.length >= 2)
    .map((group) => group.sort(byNumericId))
    .sort((a, b) => byNumericId(a[0]!, b[0]!))
}

/** Every club that appears in the goals, as team or opponent, once and sorted by id. */
export function clubIdsOf(goles: readonly Gol[]): string[] {
  return [...new Set(goles.flatMap((goal) => [goal.equipoId, goal.rivalId]))].sort(byNumericId)
}

/** Builds the club list, sorted by id; a club gets a crest path only if its crest was downloaded. */
export function clubesFrom(clubs: readonly ClubEntry[], withCrest: ReadonlySet<string>): Clubes {
  const sorted = clubs.toSorted((a, b) => byNumericId(a.id, b.id))
  return Object.fromEntries(
    sorted.map(({ id, name }) => [id, { nombre: name, escudo: withCrest.has(id) ? escudoPath(id) : null }]),
  )
}
