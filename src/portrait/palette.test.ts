import { describe, expect, it } from 'vitest'
import { GOLD, GREY, goalColors } from './palette.ts'

function colorOf(colors: Float32Array, numero: number): number[] {
  return Array.from(colors.slice((numero - 1) * 3, numero * 3))
}

describe('goalColors', () => {
  it('paints scored goals gold and missing goals grey', () => {
    const colors = goalColors(1000, 975)

    expect(colors).toHaveLength(3000)
    for (let numero = 1; numero <= 975; numero++) expect(colorOf(colors, numero)).toEqual(GOLD)
    for (let numero = 976; numero <= 1000; numero++) expect(colorOf(colors, numero)).toEqual(GREY)
  })

  it('paints every goal gold once all of them are scored', () => {
    const colors = goalColors(1000, 1003)

    for (let numero = 1; numero <= 1000; numero++) expect(colorOf(colors, numero)).toEqual(GOLD)
  })

  it('uses colors that tell scored from missing goals apart', () => {
    expect(GOLD).not.toEqual(GREY)
  })
})
