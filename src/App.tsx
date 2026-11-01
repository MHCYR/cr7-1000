import { Canvas } from '@react-three/fiber'
import { lazy, Suspense } from 'react'
import { es } from './i18n/es.ts'
import type { PortraitSettings } from './portrait/settings.ts'
import { GOAL_PIXELS } from './portrait/sample.ts'
import { Scene } from './scene/Scene.tsx'
import { TUNNEL, tunnelScroll } from './tunnel/tunnel.ts'

// Vite removes the import and the entire development module graph in production.
const DevControls = import.meta.env.DEV ? lazy(() => import('./dev/DevControls.tsx')) : null

function PortraitView({ settings, restart }: { settings?: PortraitSettings; restart?: number }) {
  return (
    <>
      <div className="stage">
        <Canvas camera={{ position: [0, 0, TUNNEL.cameraStart], fov: 50 }} dpr={[1, 2]}>
          <color attach="background" args={['#0a0a0a']} />
          <Scene settings={settings} restart={restart} />
        </Canvas>
      </div>
      {/* The page scrolls one viewport for the flight to the tunnel, then the tunnel itself. */}
      <div style={{ height: `calc(200vh + ${tunnelScroll(GOAL_PIXELS)}px)` }} />
      <h1 className="hud">{es.siteTitle}</h1>
    </>
  )
}

export default function App() {
  return DevControls ? (
    <Suspense fallback={null}>
      <DevControls>{(settings, restart) => <PortraitView settings={settings} restart={restart} />}</DevControls>
    </Suspense>
  ) : <PortraitView />
}
