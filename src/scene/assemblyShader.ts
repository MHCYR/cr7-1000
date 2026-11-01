// GPU side of the entry animation. Mirrors assemblyOffset in src/portrait/assemble.ts:
// keep both in sync. Colors are written as sRGB on purpose (no color management), so the
// fill pixels show the exact colors of the photo and the goals the exact palette.

export const assemblyVertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute float aDelay;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uTime;
  // Seconds one point takes to fly in, and its opacity while still scattered.
  uniform float uDuration;
  uniform float uInitialOpacity;
  uniform float uSize;
  uniform float uViewportHeight;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float local = clamp((uTime - aDelay) / max(uDuration, 0.0001), 0.0, 1.0);
    float offset = 1.0 - pow(1.0 - local, 3.0);

    vec4 viewPosition = modelViewMatrix * vec4(mix(aStart, position, offset), 1.0);
    gl_Position = projectionMatrix * viewPosition;
    // uSize * aSize is in world units: project it to pixels at this depth.
    gl_PointSize = uSize * aSize * projectionMatrix[1][1] * uViewportHeight * 0.5 / -viewPosition.z;

    vColor = aColor;
    // Faint like a starfield while scattered, solid once in the portrait.
    vAlpha = mix(uInitialOpacity, 1.0, offset);
  }
`

export const assemblyFragmentShader = /* glsl */ `
  // Width of the dark outline, as a share of the point side (0 for none).
  uniform float uOutline;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // The outline keeps goal pixels apart from fill pixels of a similar color.
    vec2 edge = min(gl_PointCoord, 1.0 - gl_PointCoord);
    float outline = step(min(edge.x, edge.y), uOutline);
    gl_FragColor = vec4(mix(vColor, vColor * 0.2, outline), vAlpha);
  }
`
