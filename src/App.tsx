import { Canvas } from '@react-three/fiber'
import { es } from './i18n/es.ts'
import { Scene } from './scene/Scene.tsx'

export default function App() {
  return (
    <>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#0a0a0a']} />
        <Scene />
      </Canvas>
      <h1 className="hud">{es.siteTitle}</h1>
    </>
  )
}
