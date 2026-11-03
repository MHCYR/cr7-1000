import { useEffect, useState } from 'react'
import { GOAL_PIXELS } from '../portrait/sample.ts'
import { type ScrollReadout as Readout, scrollReadout } from '../tunnel/tunnel.ts'

const PHASE_LABEL = { entry: 'Entrada al túnel', tunnel: 'Túnel' } as const

function read(): Readout {
  return scrollReadout(window.scrollY, window.innerHeight, GOAL_PIXELS)
}

/**
 * Where the page scroll is on the animation timeline, so a moment can be named ("entrada 40 %").
 * It shows the scroll itself; the scene follows it with a short damping.
 */
export function ScrollReadout() {
  const [readout, setReadout] = useState(read)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setReadout(read()))
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const { phase, phasePercent, goal, globalPercent } = readout
  return (
    <output className="scroll-readout" aria-label="Progreso del scroll">
      <span className="scroll-readout-phase">
        {PHASE_LABEL[phase]}
        {phase === 'tunnel' && ` · gol ${goal > 0 ? goal : '—'}`}
      </span>
      <span className="scroll-readout-percent">{phasePercent.toFixed(1)} %</span>
      <span className="scroll-readout-global">global {globalPercent.toFixed(1)} %</span>
    </output>
  )
}
