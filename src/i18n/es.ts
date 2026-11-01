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
} as const
