// Regenerates src/data/goles.json with the fake goals: `pnpm data:fake`.
import { writeFileSync } from 'node:fs'
import { generateFakeGoles } from '../src/data/fake-goles.ts'

const goles = generateFakeGoles()
const target = new URL('../src/data/goles.json', import.meta.url)

// One goal per line keeps hand edits and diffs readable.
writeFileSync(target, `[\n${goles.map((goal) => `  ${JSON.stringify(goal)}`).join(',\n')}\n]\n`)
console.log(`Wrote ${goles.length} fake goals to src/data/goles.json`)
