import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { goles } from '../data/goles.ts'
import { assemblyEnd } from '../portrait/assemble.ts'
import { PORTRAIT_URL, loadImagePixels } from '../portrait/load.ts'
import { goalColors } from '../portrait/palette.ts'
import { type Portrait, samplePortrait } from '../portrait/sample.ts'
import { type PortraitSettings, buildBuffers, defaultSettings, samplingOptions } from '../portrait/settings.ts'
import { AssemblingPoints } from './AssemblingPoints.tsx'
import { createClock, restartClock, tickClock } from './animationClock.ts'

/** Goal pixel side relative to a grid cell: goals stand out from the fill pixels. */
const GOAL_SIZE = 2.4
/** Goal pixel outline, as a share of its side. */
const GOAL_OUTLINE = 0.16

/** One object for every render, so a Scene without settings never sees them change. */
const DEFAULT_SETTINGS = defaultSettings()

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface SceneProps {
  /** Every number that shapes the portrait; the defaults draw the portrait as it always was. */
  settings?: PortraitSettings
  /** Changing it plays the entry animation again from the start, without rebuilding anything. */
  restart?: number
}

/**
 * Act one of prototype B: the portrait of fill and goal pixels, built on entry. Each change of
 * the settings does the least work it needs: the photo is decoded once, sampled again only
 * for the sampling settings and the seed, and its buffers are rebuilt only for the settings
 * that shape them. Duration, initial opacity and fit just update the shader and the scale.
 */
export function Scene({ settings = DEFAULT_SETTINGS, restart = 0 }: SceneProps) {
  const [image, setImage] = useState<ImageData | null>(null)
  const { fillCount, edgeBand, seed } = samplingOptions(settings)

  useEffect(() => {
    let cancelled = false
    loadImagePixels(PORTRAIT_URL)
      .then((pixels) => cancelled || setImage(pixels))
      .catch((error: unknown) => console.error('Could not load the portrait', error))
    return () => {
      cancelled = true
    }
  }, [])

  const sampled = useMemo(() => {
    if (!image) return null
    try {
      return samplePortrait(image, { fillCount, edgeBand, seed })
    } catch (error) {
      console.error('Could not sample the portrait', error)
      return null
    }
  }, [image, fillCount, edgeBand, seed])

  // Keeps the last portrait on screen when a setting leaves the figure too few cells.
  const [shown, setShown] = useState<Portrait | null>(null)
  if (sampled && sampled !== shown) setShown(sampled)
  const portrait = sampled ?? shown

  return portrait && <PortraitCloud portrait={portrait} settings={settings} restart={restart} />
}

function PortraitCloud({ portrait, settings, restart }: { portrait: Portrait; settings: PortraitSettings; restart: number }) {
  const viewport = useThree((state) => state.viewport)
  const { fit, assembly, initialOpacity } = settings
  const scale = Math.min(viewport.height * fit.height, (viewport.width * fit.width) / portrait.aspect)
  const end = assemblyEnd(assembly)

  // Each buffer setting is listed on its own: the settings object changes on every edit.
  const { fillStagger, goalsStart, goalsStagger } = assembly
  const { x, y, z } = settings.scatter
  const { size, dispersion, shrink } = settings.fill
  const buffers = useMemo(
    () =>
      buildBuffers(portrait, {
        assembly: { fillStagger, goalsStart, goalsStagger },
        scatter: { x, y, z },
        fill: { size: { min: size.min, max: size.max }, dispersion, shrink },
        seed: settings.seed,
      }),
    [portrait, fillStagger, goalsStart, goalsStagger, x, y, z, size.min, size.max, dispersion, shrink, settings.seed],
  )
  const goals = useMemo(
    () => ({ colors: goalColors(portrait.goals.count, goles.length), sizes: new Float32Array(portrait.goals.count).fill(1) }),
    [portrait.goals.count],
  )

  // Shared by the fill and the goal pixels; restarting only moves it back to second 0.
  const clock = useRef(createClock())
  const reducedMotion = useRef(prefersReducedMotion())
  const restarted = useRef(restart)

  useFrame((state) => {
    if (restarted.current !== restart) {
      restarted.current = restart
      reducedMotion.current = prefersReducedMotion()
      restartClock(clock.current, end, reducedMotion.current)
    }
    tickClock(clock.current, state.clock.elapsedTime, end, reducedMotion.current)
  })

  return (
    <group scale={scale}>
      <AssemblingPoints
        positions={buffers.fillPositions}
        start={buffers.fillStart}
        delays={buffers.fillDelays}
        colors={portrait.fill.colors}
        sizes={buffers.fillSizes}
        clock={clock}
        size={portrait.cellSize * scale}
        duration={assembly.duration}
        initialOpacity={initialOpacity}
      />
      <AssemblingPoints
        positions={portrait.goals.positions}
        start={buffers.goalStart}
        delays={buffers.goalDelays}
        colors={goals.colors}
        sizes={goals.sizes}
        clock={clock}
        size={portrait.cellSize * scale * GOAL_SIZE}
        outline={GOAL_OUTLINE}
        duration={assembly.duration}
        initialOpacity={initialOpacity}
        renderOrder={1}
      />
    </group>
  )
}
