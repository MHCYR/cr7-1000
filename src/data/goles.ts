import { validateGoles } from './gol.ts'
import data from './goles.json'

// Every official goal, in chronological order. Validated on load, so a bad hand edit
// of goles.json fails loudly instead of rendering a broken portrait.
export const goles = validateGoles(data)
