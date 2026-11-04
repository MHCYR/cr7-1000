// Spanish UI copy, kept out of components so other languages can be added later.
export const es = {
  siteTitle: 'CR7 · 1000',
  goalCard: {
    /** Sticker of a scored goal, lowercase like a marker tag. */
    scored: 'gol oficial',
    /** Sticker of a missing goal. */
    missing: 'por marcar',
    versus: 'vs',
    date: 'Fecha',
    /** Empty crest tile of a missing goal. */
    unknownCrest: '?',
    crestAlt: (club: string) => `Escudo de ${club}`,
    scoredLabel: (numero: number, equipo: string, rival: string, fecha: string) =>
      `Gol ${numero}, ${equipo} contra ${rival}, ${fecha}`,
    missingLabel: (numero: number) => `Gol ${numero}, por marcar`,
    remaining: (count: number) => (count === 1 ? 'Falta 1 gol para la meta' : `Faltan ${count} goles para la meta`),
  },
  indicator: {
    /** Name of the indicator region for assistive technology. */
    region: 'Gol actual',
    age: 'Edad',
    club: 'Equipo',
    /** Club row of a goal scored while he had no club (2022 World Cup). */
    noClub: 'Sin club',
    ageValue: (years: number) => `${years} años`,
    photoAlt: (year: number) => `Cristiano Ronaldo en ${year}`,
    /** Placeholder of a year without a photo yet. */
    photoPending: 'Foto',
  },
  counter: {
    /** Words between the numbers of «978 de 1000 goles», muted in the counter. */
    of: 'de',
    goals: 'goles',
    label: (scored: number, target: number) => `${scored} de ${target} goles`,
  },
} as const
