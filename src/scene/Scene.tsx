import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { goles } from '../data/goles.ts'
import { ASSEMBLY_END, fillDelays, goalDelays, scatterStart } from '../portrait/assemble.ts'
import { loadPortrait } from '../portrait/load.ts'
import { goalColors } from '../portrait/palette.ts'
import { FILL_DENSITY, type Portrait } from '../portrait/sample.ts'
import { AssemblingPoints } from './AssemblingPoints.tsx'

/** Share of the viewport the portrait may fill. */
const FIT = { height: 0.88, width: 0.92 }
/** Point sides relative to a grid cell: fill pixels leave a small gap, goals stand out. */
const FILL_SIZE = 0.85
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

  const buffers = useMemo(
    () => ({
      fillStart: scatterStart(portrait.fill.positions, 1),
      fillDelays: fillDelays(portrait.fill.count, 2),
      goalStart: scatterStart(portrait.goals.positions, 3),
      goalDelays: goalDelays(portrait.goals.count),
      goalColors: goalColors(portrait.goals.count, goles.length),
    }),
    [portrait],
  )

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
        positions={portrait.fill.positions}
        start={buffers.fillStart}
        delays={buffers.fillDelays}
        colors={portrait.fill.colors}
        clock={clock}
        size={portrait.cellSize * scale * FILL_SIZE}
      />
      <AssemblingPoints
        positions={portrait.goals.positions}
        start={buffers.goalStart}
        delays={buffers.goalDelays}
        colors={buffers.goalColors}
        clock={clock}
        size={portrait.cellSize * scale * GOAL_SIZE}
        outline={GOAL_OUTLINE}
        renderOrder={1}
      />
    </group>
  )
}
