// GPU side of the entry animation and the tunnel. Mirrors assemblyOffset in
// src/portrait/assemble.ts: keep both in sync. With TUNNEL defined (goal pixels), uProgress flies
// each point from the portrait to aTunnel, in world units (src/tunnel/tunnel.ts); without it
// (fill pixels), uProgress fades the points out. Colors are written as sRGB on purpose (no color management), so the
// fill pixels show the exact colors of the photo and the goals the exact palette.

export const assemblyVertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute float aDelay;
  attribute float aSize;
  attribute vec3 aColor;
  #ifdef TUNNEL
  attribute vec3 aTunnel;
  #endif

  uniform float uTime;
  // Seconds one point takes to fly in, and its opacity while still scattered.
  uniform float uDuration;
  uniform float uInitialOpacity;
  uniform float uSize;
  uniform float uViewportHeight;
  // 0 with the portrait assembled, 1 with the goal pixels in the tunnel.
  uniform float uProgress;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float local = clamp((uTime - aDelay) / max(uDuration, 0.0001), 0.0, 1.0);
    float offset = 1.0 - pow(1.0 - local, 3.0);

    vec4 worldPosition = modelMatrix * vec4(mix(aStart, position, offset), 1.0);
    float progress = smoothstep(0.0, 1.0, uProgress);
    #ifdef TUNNEL
    worldPosition.xyz = mix(worldPosition.xyz, aTunnel, progress);
    #endif
    vec4 viewPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * viewPosition;
    // uSize * aSize is in world units: project it to pixels at this depth.
    gl_PointSize = uSize * aSize * projectionMatrix[1][1] * uViewportHeight * 0.5 / -viewPosition.z;

    vColor = aColor;
    // Faint like a starfield while scattered, solid once in the portrait.
    vAlpha = mix(uInitialOpacity, 1.0, offset);
    #ifndef TUNNEL
    vAlpha *= 1.0 - progress;
    #endif
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
