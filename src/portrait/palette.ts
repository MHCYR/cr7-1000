// Goal pixel palette (DESIGN.md): scored goals in spray, missing goals in concrete, the same
// colors as the goal card. Colors are sRGB triplets in [0, 1], rounded to float32 so they
// match the GPU buffers.

function rgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff].map((channel) => Math.fround(channel / 255)) as [
    number,
    number,
    number,
  ]
}

/** Gol marcado: `spray`. */
export const SPRAY = rgb(0xff5b1f)
/** Gol faltante: `concrete`; the pulsing ring arrives in #6. */
export const CONCRETE = rgb(0x8c8c86)

/** Colors of the goal pixels in chronological order: goal number i + 1 is spray once scored. */
export function goalColors(goalCount: number, scoredCount: number): Float32Array {
  const colors = new Float32Array(goalCount * 3)
  for (let i = 0; i < goalCount; i++) colors.set(i < scoredCount ? SPRAY : CONCRETE, i * 3)
  return colors
}
