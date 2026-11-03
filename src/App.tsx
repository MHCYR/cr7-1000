import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useState } from 'react'
import { createGoalCardLayer } from './hud/cardWindow.ts'
import { GoalCards } from './hud/GoalCards.tsx'
import { es } from './i18n/es.ts'
import type { PortraitSettings } from './portrait/settings.ts'
import { GOAL_PIXELS } from './portrait/sample.ts'
import { Scene } from './scene/Scene.tsx'
import { TUNNEL, tunnelScroll } from './tunnel/tunnel.ts'

// Vite removes the import and the entire development module graph in production.
const DevControls = import.meta.env.DEV ? lazy(() => import('./dev/DevControls.tsx')) : null

function PortraitView({ settings, restart }: { settings?: PortraitSettings; restart?: number }) {
  // The scene moves the mounted card slots and slides their window every frame, outside React.
  const [cards] = useState(createGoalCardLayer)
  return (
    <>
      <div className="stage">
        <Canvas camera={{ position: [0, 0, TUNNEL.cameraStart], fov: 50 }} dpr={[1, 2]}>
          <color attach="background" args={['#0a0a0a']} />
          <Scene settings={settings} restart={restart} cards={cards} />
        </Canvas>
      </div>
      <GoalCards layer={cards} />
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
