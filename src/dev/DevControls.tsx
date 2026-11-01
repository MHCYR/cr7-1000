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
      zoomEnd: { label: 'Fin del zoom (progreso)', value: defaults.zoom.end, min: 0.05, max: 1, step: 0.01 },
      zoomTravel: { label: 'Recorrido del relleno', value: defaults.zoom.travel, min: 0, max: 20, step: 0.1 },
      zoomFade: { label: 'Distancia de fundido', value: defaults.zoom.fade, min: 0.05, max: 5, step: 0.05 },
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
    zoom: { end: values.zoomEnd, travel: values.zoomTravel, fade: values.zoomFade },
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
