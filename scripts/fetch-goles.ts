// Regenerates src/data/goles.json, src/data/clubes.json and public/escudos/ from
// Transfermarkt's JSON API: `pnpm data:real`. Run by hand; the site never calls the API.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { validateClubes, validateGoles } from '../src/data/gol.ts'
import {
  CRISTIANO_ID,
  clubesFrom,
  clubIdsOf,
  duplicateCrests,
  golesFromPerformance,
  type ClubEntry,
  type PerformanceEntry,
} from './transfermarkt.ts'

const API = 'https://tmapi.transfermarkt.technology'
// The `big` size is 180 px; for national teams this route gives the federation crest, not the flag.
const crestUrl = (id: string) => `https://img.a.transfermarkt.technology/wappen/big/${id}.png`
// Batch routes accept more ids, but transfermarkt-api stays at 100 per request.
const BATCH_SIZE = 100

const root = new URL('../', import.meta.url)
const crestDir = new URL('public/escudos/', root)

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'cr7-1000 data script' },
  })
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status} ${response.statusText}`)
  const body = (await response.json()) as { success: boolean; message: string; data: T }
  if (!body.success) throw new Error(`GET ${path} failed: ${body.message}`)
  return body.data
}

async function fetchClubs(ids: readonly string[]): Promise<ClubEntry[]> {
  const clubs: ClubEntry[] = []
  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const query = ids.slice(start, start + BATCH_SIZE).map((id) => `ids[]=${id}`).join('&')
    clubs.push(...(await getJson<ClubEntry[]>(`/clubs?${query}`)))
  }
  const missing = ids.filter((id) => !clubs.some((club) => club.id === id))
  if (missing.length > 0) throw new Error(`Transfermarkt returned no club for ids: ${missing.join(', ')}`)
  return clubs
}

// Downloads the crests that are not on disk yet and returns the ids that have one.
async function downloadCrests(ids: readonly string[]): Promise<Set<string>> {
  mkdirSync(crestDir, { recursive: true })
  const withCrest = new Set<string>()
  for (const id of ids) {
    const file = new URL(`${id}.webp`, crestDir)
    if (!existsSync(file)) {
      const response = await fetch(crestUrl(id))
      if (!response.ok) {
        console.warn(`No crest for club ${id} (${response.status}); it gets escudo: null`)
        continue
      }
      const input = Buffer.from(await response.arrayBuffer())
      const converted = spawnSync('magick', [
        'png:-', '-quality', '90', '-define', 'webp:method=6', '-define', 'webp:alpha-quality=100', 'webp:-',
      ], { input, maxBuffer: 16 * 1024 * 1024 })
      if (converted.error) {
        if ('code' in converted.error && converted.error.code === 'ENOENT') {
          throw new Error('ImageMagick 7 is required: magick must be on PATH')
        }
        throw new Error(`Could not convert crest ${id}: ${converted.error.message}`)
      }
      if (converted.status !== 0) {
        throw new Error(`ImageMagick failed converting crest ${id} (exit ${converted.status}): ${converted.stderr.toString().trim()}`)
      }
      writeFileSync(file, converted.stdout)
    }
    withCrest.add(id)
  }
  return withCrest
}

// One entry per line keeps diffs readable.
const jsonLines = (entries: readonly string[], open: string, close: string) =>
  `${open}\n${entries.map((entry) => `  ${entry}`).join(',\n')}\n${close}\n`

const performance = await getJson<{ performance: PerformanceEntry[] }>(`/player/${CRISTIANO_ID}/performance-game`)
const goles = golesFromPerformance(performance.performance)
const ids = clubIdsOf(goles)
const clubs = await fetchClubs(ids)
const withCrest = await downloadCrests(ids)
const repeated = duplicateCrests([...withCrest].map((id) => ({
  id,
  bytes: readFileSync(new URL(`${id}.webp`, crestDir)),
})))
if (repeated.length > 0) {
  throw new Error(`Repeated crests: ${repeated.map((group) => group.join('=')).join(', ')}`)
}
const clubes = validateClubes(clubesFrom(clubs, withCrest))
// Validate before writing, so a surprising API answer leaves the committed data untouched.
validateGoles(goles, clubes)

writeFileSync(new URL('src/data/goles.json', root), jsonLines(goles.map((goal) => JSON.stringify(goal)), '[', ']'))
writeFileSync(
  new URL('src/data/clubes.json', root),
  jsonLines(Object.entries(clubes).map(([id, club]) => `${JSON.stringify(id)}: ${JSON.stringify(club)}`), '{', '}'),
)
const crestCount = Object.values(clubes).filter((club) => club.escudo !== null).length
console.log(`Wrote ${goles.length} goals and ${ids.length} clubs (${crestCount} with crest)`)
