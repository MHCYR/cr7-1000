import { useFrame } from '@react-three/fiber'
import { type RefObject, useRef, useState } from 'react'
import type { ShaderMaterial } from 'three'
import type { AnimationClock } from './animationClock.ts'
import { assemblyFragmentShader, assemblyVertexShader } from './assemblyShader.ts'

interface AssemblingPointsProps {
  /** Final xyz positions in the portrait. */
  positions: Float32Array
  /** xyz positions where the entry animation starts. */
  start: Float32Array
  delays: Float32Array
  /** sRGB triplets in [0, 1]. */
  colors: Float32Array
  /** Per-point side, as a multiple of `size`. */
  sizes: Float32Array
  /** Shared animation clock. */
  clock: RefObject<AnimationClock>
  /** Base point side, in world units. */
  size: number
  /** Dark outline width, as a share of the point side. */
  outline?: number
  /** Seconds one point takes to fly in. */
  duration: number
  /** Opacity of a point while it is still scattered. */
  initialOpacity: number
  renderOrder?: number
}

/** One THREE.Points (one draw call) whose points fly from `start` to `positions`. */
export function AssemblingPoints({ positions, start, delays, colors, sizes, clock, size, outline = 0, duration, initialOpacity, renderOrder }: AssemblingPointsProps) {
  const material = useRef<ShaderMaterial>(null)
  // One object for the life of the component: the dev controls only change its values, so
  // the material is never rebuilt or recompiled.
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uDuration: { value: duration },
    uInitialOpacity: { value: initialOpacity },
    uViewportHeight: { value: 1 },
    uSize: { value: size },
    uOutline: { value: outline },
  }))

  useFrame((state) => {
    if (!material.current) return
    const values = material.current.uniforms
    values.uTime.value = clock.current.elapsed
    values.uDuration.value = duration
    values.uInitialOpacity.value = initialOpacity
    values.uSize.value = size
    values.uOutline.value = outline
    values.uViewportHeight.value = state.size.height * state.viewport.dpr
  })

  return (
    // The bounding sphere only covers the final positions, so culling could hide scattered points.
    <points frustumCulled={false} renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aStart" args={[start, 3]} />
        <bufferAttribute attach="attributes-aDelay" args={[delays, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
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
