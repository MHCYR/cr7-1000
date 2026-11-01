import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { duplicateCrests } from './transfermarkt.ts'

const crestDir = new URL('../public/escudos/', import.meta.url)
const files = readdirSync(crestDir)

describe('public/escudos', () => {
  it('only holds WebP crests named by club id', () => {
    expect(files.filter((file) => !/^\d+\.webp$/.test(file))).toEqual([])
  })

  it('has no crest repeated under two club ids', () => {
    const crests = files.map((file) => ({ id: file.replace('.webp', ''), bytes: readFileSync(new URL(file, crestDir)) }))
    expect(duplicateCrests(crests)).toEqual([])
  })
})
