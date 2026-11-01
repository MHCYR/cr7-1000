import { LevaPanel, folder, useControls, useCreateStore } from 'leva'
import { type ReactNode, useState } from 'react'
import { type PortraitSettings, SEED_MAX, defaultSettings, serializeSettings } from '../portrait/settings.ts'
import './controls.css'

const defaults = defaultSettings()

interface DevControlsProps {
  children: (settings: PortraitSettings, restart: number) => ReactNode
}

/** Local to this mount: no global store, URL state or browser storage. */
export default function DevControls({ children }: DevControlsProps) {
  const store = useCreateStore()
  const [restart, setRestart] = useState(0)
  const [copyStatus, setCopyStatus] = useState('')
  const values = useControls({
    'Animación': folder({
      duration: { label: 'Duración del vuelo (s)', value: defaults.assembly.duration, min: 0.05, max: 10, step: 0.05 },
      fillStagger: { label: 'Escalonado relleno (s)', value: defaults.assembly.fillStagger, min: 0, max: 5, step: 0.05 },
      goalsStart: { label: 'Arranque goles (s)', value: defaults.assembly.goalsStart, min: 0, max: 5, step: 0.05 },
      goalsStagger: { label: 'Escalonado goles (s)', value: defaults.assembly.goalsStagger, min: 0, max: 5, step: 0.05 },
      initialOpacity: { label: 'Opacidad inicial', value: defaults.initialOpacity, min: 0, max: 1, step: 0.01 },
      scatterX: { label: 'Dispersión inicial X', value: defaults.scatter.x, min: 0, max: 10, step: 0.1 },
      scatterY: { label: 'Dispersión inicial Y', value: defaults.scatter.y, min: 0, max: 10, step: 0.1 },
      scatterZ: { label: 'Dispersión inicial Z', value: defaults.scatter.z, min: 0, max: 10, step: 0.1 },
    }),
    'Píxeles de relleno y bordes': folder({
      density: { label: 'Densidad de relleno', value: defaults.sampling.density, min: 1000, max: 100000, step: 500 },
      fillSize: { label: 'Tamaño mín. / máx.', value: [defaults.fill.size.min, defaults.fill.size.max] as [number, number], min: 0.1, max: 5 },
      edgeBand: { label: 'Franja de borde (celdas)', value: defaults.sampling.edgeBand, min: 0, max: 32, step: 1 },
      dispersion: { label: 'Dispersión borde', value: defaults.fill.dispersion, min: 0, max: 20, step: 0.1 },
      shrink: { label: 'Encogimiento borde', value: defaults.fill.shrink, min: 0, max: 1, step: 0.01 },
    }),
    'Entrada al túnel': folder({
      zoomEnd: { label: 'Fin del zoom conjunto', value: defaults.zoom.zoomEnd, min: 0.01, max: 1, step: 0.01 },
      zoomDepth: { label: 'Acercamiento conjunto', value: defaults.zoom.zoomDepth, min: 0, max: 10, step: 0.1 },
      flyEnd: { label: 'Fin del uno a uno', value: defaults.zoom.flyEnd, min: 0.01, max: 1, step: 0.01 },
      flight: { label: 'Vuelo de un píxel', value: defaults.zoom.flight, min: 0.01, max: 1, step: 0.01 },
      reach: { label: 'Recorrido total', value: defaults.zoom.reach, min: 0, max: 20, step: 0.1 },
      jitter: { label: 'Azar del orden', value: defaults.zoom.jitter, min: 0, max: 1, step: 0.01 },
      zoomFade: { label: 'Distancia de fundido', value: defaults.zoom.fade, min: 0.05, max: 5, step: 0.05 },
    }),
    'Túnel de goles': folder({
      radiusMin: { label: 'Radio mín.', value: defaults.tunnel.radiusMin, min: 0.1, max: 10, step: 0.1 },
      radiusMax: { label: 'Radio máx.', value: defaults.tunnel.radiusMax, min: 0.1, max: 10, step: 0.1 },
      fogNear: { label: 'Niebla cerca', value: defaults.tunnel.fogNear, min: 0, max: 100, step: 0.5 },
      fogFar: { label: 'Niebla lejos', value: defaults.tunnel.fogFar, min: 0.5, max: 100, step: 0.5 },
      goalScale: { label: 'Tamaño de gol en el túnel', value: defaults.tunnel.goalScale, min: 0.5, max: 10, step: 0.1 },
    }),
    'Encuadre y semillas': folder({
      fitHeight: { label: 'Ocupación alto', value: defaults.fit.height, min: 0.1, max: 1, step: 0.01 },
      fitWidth: { label: 'Ocupación ancho', value: defaults.fit.width, min: 0.1, max: 1, step: 0.01 },
      seed: { label: 'Semilla general', value: defaults.seed, min: 0, max: SEED_MAX, step: 1 },
    }),
  }, { store })

  const settings: PortraitSettings = {
    assembly: { duration: values.duration, fillStagger: values.fillStagger, goalsStart: values.goalsStart, goalsStagger: values.goalsStagger },
    scatter: { x: values.scatterX, y: values.scatterY, z: values.scatterZ },
    fill: { size: { min: values.fillSize[0], max: values.fillSize[1] }, dispersion: values.dispersion, shrink: values.shrink },
    sampling: { density: values.density, edgeBand: values.edgeBand },
    fit: { height: values.fitHeight, width: values.fitWidth },
    initialOpacity: values.initialOpacity,
    zoom: {
      zoomEnd: values.zoomEnd,
      zoomDepth: values.zoomDepth,
      flyEnd: values.flyEnd,
      flight: values.flight,
      reach: values.reach,
      fade: values.zoomFade,
      jitter: values.jitter,
    },
    tunnel: { radiusMin: values.radiusMin, radiusMax: values.radiusMax, fogNear: values.fogNear, fogFar: values.fogFar, goalScale: values.goalScale },
    seed: values.seed,
  }

  async function copyValues() {
    try {
      await navigator.clipboard.writeText(serializeSettings(settings))
      setCopyStatus('Valores copiados. Pega la declaración en PORTRAIT_DEFAULTS, en src/portrait/settings.ts.')
    } catch {
      setCopyStatus('No se pudo copiar. Comprueba el permiso del portapapeles y usa localhost o HTTPS.')
    }
  }

  return (
    <>
      {children(settings, restart)}
      <aside className="portrait-controls" aria-label="Controles de desarrollo del retrato">
        <LevaPanel store={store} fill titleBar={{ title: 'Retrato · desarrollo' }} />
        <div className="portrait-controls-actions">
          <button type="button" onClick={() => setRestart((value) => value + 1)}>Reiniciar animación</button>
          <button type="button" onClick={copyValues}>Copiar valores</button>
          <output role="status">{copyStatus}</output>
        </div>
      </aside>
    </>
  )
}
