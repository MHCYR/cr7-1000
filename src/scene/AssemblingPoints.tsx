import { useFrame } from '@react-three/fiber'
import { type RefObject, useRef, useState } from 'react'
import { type Points, type ShaderMaterial, Vector2 } from 'three'
import { type FillZoom, type ScrollState, type TunnelFog, TUNNEL_FOG, fillOffset } from '../tunnel/tunnel.ts'
import type { AnimationClock } from './animationClock.ts'
import { assemblyFragmentShader, assemblyVertexShader } from './assemblyShader.ts'

/** Past the end of the scroll: the points never hand off. */
const NO_HAND_OFF = { start: 2, end: 3 } as const

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
  /** Shared, damped scroll state; its progress drives the tunnel. */
  scroll: RefObject<ScrollState>
  /** xyz tunnel positions in world units: with them the points fly to the tunnel, without them they come toward the camera. */
  tunnel?: Float32Array
  /** Distance fog for the goal walls. */
  fog?: TunnelFog
  /** Point size in the tunnel, as a multiple of its size in the portrait. */
  tunnelScale?: number
  /** Progress over which the points fade out in the tunnel, replaced by the goal cards; never, by default. */
  handOff?: { start: number; end: number }
  /** How the points come toward the camera when there is no tunnel. */
  zoom?: FillZoom
  /** Fly-out order of each point toward the camera, in [0, 1]; needed with `zoom`. */
  order?: Float32Array
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

/**
 * One THREE.Points (one draw call) whose points fly from `start` to `positions`, and on scroll
 * either to `tunnel` or toward the camera and past it.
 */
export function AssemblingPoints({ positions, start, delays, colors, sizes, clock, scroll, tunnel, fog = TUNNEL_FOG, tunnelScale = 1, handOff = NO_HAND_OFF, zoom, order, size, outline = 0, duration, initialOpacity, renderOrder }: AssemblingPointsProps) {
  const points = useRef<Points>(null)
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
    uProgress: { value: 0 },
    uZoomEnd: { value: 1 },
    uZoomDepth: { value: 0 },
    uFlyEnd: { value: 1 },
    uFlight: { value: 1 },
    uReach: { value: 0 },
    uFade: { value: 1 },
    uFogNear: { value: fog.near },
    uFogFar: { value: fog.far },
    uTunnelScale: { value: tunnelScale },
    uHandOff: { value: new Vector2(handOff.start, handOff.end) },
  }))
  // Fixed per mount: a tunnel is either given or not, so the shader compiles once.
  const [defines] = useState(() => (tunnel ? { TUNNEL: '' } : {}))

  useFrame((state) => {
    if (!material.current) return
    const values = material.current.uniforms
    values.uTime.value = clock.current.elapsed
    values.uDuration.value = duration
    values.uInitialOpacity.value = initialOpacity
    values.uSize.value = size
    values.uOutline.value = outline
    values.uViewportHeight.value = state.size.height * state.viewport.dpr
    values.uProgress.value = scroll.current.progress
    if (tunnel) {
      values.uFogNear.value = fog.near
      values.uFogFar.value = fog.far
      values.uTunnelScale.value = tunnelScale
      values.uHandOff.value.set(handOff.start, handOff.end)
      return
    }
    if (!zoom) return
    values.uZoomEnd.value = zoom.zoomEnd
    values.uZoomDepth.value = zoom.zoomDepth
    values.uFlyEnd.value = zoom.flyEnd
    values.uFlight.value = zoom.flight
    values.uReach.value = zoom.reach
    values.uFade.value = zoom.fade
    // Order 1 flies last: once it is at reach, fill pixels cost nothing while the camera is in the tunnel.
    if (points.current) points.current.visible = fillOffset(scroll.current.progress, 1, zoom) < zoom.reach
  })

  return (
    // The bounding sphere only covers the final positions, so culling could hide scattered points.
    <points ref={points} frustumCulled={false} renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aStart" args={[start, 3]} />
        <bufferAttribute attach="attributes-aDelay" args={[delays, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        {tunnel && <bufferAttribute attach="attributes-aTunnel" args={[tunnel, 3]} />}
        {order && <bufferAttribute attach="attributes-aOrder" args={[order, 1]} />}
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={assemblyVertexShader}
        fragmentShader={assemblyFragmentShader}
        uniforms={uniforms}
        defines={defines}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
