import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { goles } from '../data/goles.ts'
import { ASSEMBLY_END, fillDelays, goalDelays, scatterStart } from '../portrait/assemble.ts'
import { disperseEdges, fillSizes, thinFill } from '../portrait/fill.ts'
import { loadPortrait } from '../portrait/load.ts'
import { goalColors } from '../portrait/palette.ts'
import { FILL_DENSITY, type Portrait } from '../portrait/sample.ts'
import { AssemblingPoints } from './AssemblingPoints.tsx'

/** Share of the viewport the portrait may fill. */
const FIT = { height: 0.88, width: 0.92 }
/** Goal pixel side relative to a grid cell: goals stand out from the fill pixels. */
const GOAL_SIZE = 2.4
/** Goal pixel outline, as a share of its side. */
const GOAL_OUTLINE = 0.16

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Act one of prototype B: the portrait of fill and goal pixels, built on entry. */
export function Scene() {
  const [portrait, setPortrait] = useState<Portrait | null>(null)

  useEffect(() => {
    let cancelled = false
    // Choosing the density per device is #7; desktop for now.
    loadPortrait({ fillCount: FILL_DENSITY.desktop })
      .then((loaded) => cancelled || setPortrait(loaded))
      .catch((error: unknown) => console.error('Could not load the portrait', error))
    return () => {
      cancelled = true
    }
  }, [])

  return portrait && <PortraitCloud portrait={portrait} />
}

function PortraitCloud({ portrait }: { portrait: Portrait }) {
  const viewport = useThree((state) => state.viewport)
  const scale = Math.min(viewport.height * FIT.height, (viewport.width * FIT.width) / portrait.aspect)

  const buffers = useMemo(() => {
    const fill = thinFill(portrait.fill, portrait.cellSize, 6)
    const fillPositions = disperseEdges(fill.positions, fill.edge, portrait.cellSize, 4)
    return {
      fillPositions,
      fillColors: fill.colors,
      fillStart: scatterStart(fillPositions, 1),
      fillDelays: fillDelays(fill.count, 2),
      fillSizes: fillSizes(fill.edge, 5),
      goalStart: scatterStart(portrait.goals.positions, 3),
      goalDelays: goalDelays(portrait.goals.count),
      goalColors: goalColors(portrait.goals.count, goles.length),
      goalSizes: new Float32Array(portrait.goals.count).fill(1),
    }
  }, [portrait])

  // Seconds into the entry animation, shared by the fill and the goal pixels.
  const clock = useRef(0)
  const startedAt = useRef<number | null>(null)

  useFrame((state) => {
    if (clock.current >= ASSEMBLY_END) return
    // Plays once from the first frame; with reduced motion the portrait appears already built.
    startedAt.current ??= state.clock.elapsedTime - (prefersReducedMotion() ? ASSEMBLY_END : 0)
    clock.current = Math.min(state.clock.elapsedTime - startedAt.current, ASSEMBLY_END)
  })

  return (
    <group scale={scale}>
      <AssemblingPoints
        positions={buffers.fillPositions}
        start={buffers.fillStart}
        delays={buffers.fillDelays}
        colors={buffers.fillColors}
        sizes={buffers.fillSizes}
        clock={clock}
        size={portrait.cellSize * scale}
      />
      <AssemblingPoints
        positions={portrait.goals.positions}
        start={buffers.goalStart}
        delays={buffers.goalDelays}
        colors={buffers.goalColors}
        sizes={buffers.goalSizes}
        clock={clock}
        size={portrait.cellSize * scale * GOAL_SIZE}
        outline={GOAL_OUTLINE}
        renderOrder={1}
      />
    </group>
  )
}
