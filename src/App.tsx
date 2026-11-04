import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useState } from 'react'
import { createGoalCardLayer } from './hud/cardWindow.ts'
import { GoalCards } from './hud/GoalCards.tsx'
import { GoalIndicator } from './hud/GoalIndicator.tsx'
import { createIndicatorLink } from './hud/goalIndicator.ts'
import { es } from './i18n/es.ts'
import type { PortraitSettings } from './portrait/settings.ts'
import { GOAL_PIXELS } from './portrait/sample.ts'
import { Scene } from './scene/Scene.tsx'
import { TUNNEL, scrollHeight } from './tunnel/tunnel.ts'

// Vite removes the import and the entire development module graph in production.
const DevControls = import.meta.env.DEV ? lazy(() => import('./dev/DevControls.tsx')) : null

function PortraitView({ settings, restart }: { settings?: PortraitSettings; restart?: number }) {
  // The scene moves the mounted card slots and slides their window every frame, outside React.
  const [cards] = useState(createGoalCardLayer)
  // The scene sets the current goal every frame; the indicator rerenders once per goal.
  const [indicator] = useState(createIndicatorLink)
  return (
    <>
      <div className="stage">
        <Canvas camera={{ position: [0, 0, TUNNEL.cameraStart], fov: 50 }} dpr={[1, 2]}>
          <color attach="background" args={['#0a0a0a']} />
          <Scene settings={settings} restart={restart} cards={cards} indicator={indicator} />
        </Canvas>
      </div>
      <GoalCards layer={cards} />
      <GoalIndicator link={indicator} />
      {/* The page scrolls the entry (TUNNEL.entry of the whole scroll), then the tunnel itself. */}
      <div style={{ height: `calc(100vh + ${scrollHeight(GOAL_PIXELS)}px)` }} />
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
