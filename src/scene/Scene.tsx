const PLACEHOLDER_POINTS = 1000

function randomPositions(count: number): Float32Array {
  const values = new Float32Array(count * 3)
  for (let i = 0; i < values.length; i++) {
    values[i] = (Math.random() - 0.5) * 4
  }
  return values
}

// Generated once at module load so renders stay pure.
const positions = randomPositions(PLACEHOLDER_POINTS)

// Temporary smoke-test cloud: proves the WebGL pipeline until the portrait replaces it.
export function Scene() {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d4af37" size={0.03} sizeAttenuation />
    </points>
  )
}
