import { validateClubes, validateGoles } from './gol.ts'
import clubData from './clubes.json'
import data from './goles.json'

// Every club or national team in the goals, keyed by Transfermarkt id, with its crest.
export const clubes = validateClubes(clubData)

// Every official goal, in chronological order. Validated on load, so a bad edit of
// goles.json or clubes.json fails loudly instead of rendering a broken portrait.
export const goles = validateGoles(data, clubes)
