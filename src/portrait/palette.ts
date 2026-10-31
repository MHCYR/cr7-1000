// Goal pixel palette (docs/SPEC.md): scored goals in gold, missing goals in grey.
// Colors are sRGB triplets in [0, 1], rounded to float32 so they match the GPU buffers.

function rgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff].map((channel) => Math.fround(channel / 255)) as [
    number,
    number,
    number,
  ]
}

/** Gol marcado. */
export const GOLD = rgb(0xd4af37)
/** Gol faltante; the pulsing ring arrives in #6. */
export const GREY = rgb(0x9a9a9a)

/** Colors of the goal pixels in chronological order: goal number i + 1 is gold once scored. */
export function goalColors(goalCount: number, scoredCount: number): Float32Array {
  const colors = new Float32Array(goalCount * 3)
  for (let i = 0; i < goalCount; i++) colors.set(i < scoredCount ? GOLD : GREY, i * 3)
  return colors
}
