import { useFrame } from '@react-three/fiber'
import { type RefObject, useMemo, useRef } from 'react'
import type { ShaderMaterial } from 'three'
import { assemblyFragmentShader, assemblyVertexShader } from './assemblyShader.ts'

interface AssemblingPointsProps {
  /** Final xyz positions in the portrait. */
  positions: Float32Array
  /** xyz positions where the entry animation starts. */
  start: Float32Array
  delays: Float32Array
  /** sRGB triplets in [0, 1]. */
  colors: Float32Array
  /** Shared animation clock, in seconds. */
  clock: RefObject<number>
  /** Point side, in world units. */
  size: number
  /** Dark outline width, as a share of the point side. */
  outline?: number
  renderOrder?: number
}

/** One THREE.Points (one draw call) whose points fly from `start` to `positions`. */
export function AssemblingPoints({ positions, start, delays, colors, clock, size, outline = 0, renderOrder }: AssemblingPointsProps) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uViewportHeight: { value: 1 }, uSize: { value: size }, uOutline: { value: outline } }),
    [size, outline],
  )

  useFrame((state) => {
    if (!material.current) return
    material.current.uniforms.uTime.value = clock.current
    material.current.uniforms.uViewportHeight.value = state.size.height * state.viewport.dpr
  })

  return (
    // The bounding sphere only covers the final positions, so culling could hide scattered points.
    <points frustumCulled={false} renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aStart" args={[start, 3]} />
        <bufferAttribute attach="attributes-aDelay" args={[delays, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={assemblyVertexShader}
        fragmentShader={assemblyFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
