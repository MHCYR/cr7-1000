// GPU side of the entry animation and the tunnel. Mirrors assemblyOffset in
// src/portrait/assemble.ts, and fillOffset, nearFade and tunnelFade in src/tunnel/tunnel.ts, and the card hand-off in src/hud/cardLayout.ts: keep them in
// sync. With TUNNEL defined (goal pixels), uProgress flies each point from the portrait to
// aTunnel, in world units (src/tunnel/tunnel.ts); without it (fill pixels), uProgress brings
// the whole image toward the camera and then each point past it in aOrder, fading it out as it
// reaches the camera. Colors are written as sRGB on purpose (no color management), so the
// fill pixels show the exact colors of the photo and the goals the exact palette.

export const assemblyVertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute float aDelay;
  attribute float aSize;
  attribute vec3 aColor;
  #ifdef TUNNEL
  attribute vec3 aTunnel;
  #else
  // Fly-out order of a fill pixel, in [0, 1] (fillOrder).
  attribute float aOrder;
  #endif

  uniform float uTime;
  // Seconds one point takes to fly in, and its opacity while still scattered.
  uniform float uDuration;
  uniform float uInitialOpacity;
  uniform float uSize;
  uniform float uViewportHeight;
  // 0 with the portrait assembled, 1 with the goal pixels in the tunnel.
  uniform float uProgress;
  #ifdef TUNNEL
  uniform float uFogNear;
  uniform float uFogFar;
  // Goal pixel size in the tunnel, as a multiple of its size in the portrait.
  uniform float uTunnelScale;
  // Progress over which the goal cards take over from the goal pixels (CARD_REVEAL).
  uniform vec2 uHandOff;
  // Depth past which the goal pixels are back instead of the cards (CARD_DEPTH).
  uniform vec2 uCardDepth;
  #else
  // FILL_ZOOM: timings as shares of uProgress, lengths in world units.
  uniform float uZoomEnd;
  uniform float uZoomDepth;
  uniform float uFlyEnd;
  uniform float uFlight;
  uniform float uReach;
  uniform float uFade;
  #endif

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float local = clamp((uTime - aDelay) / max(uDuration, 0.0001), 0.0, 1.0);
    float offset = 1.0 - pow(1.0 - local, 3.0);

    vec4 worldPosition = modelMatrix * vec4(mix(aStart, position, offset), 1.0);
    #ifdef TUNNEL
    worldPosition.xyz = mix(worldPosition.xyz, aTunnel, smoothstep(0.0, 1.0, uProgress));
    #else
    float together = smoothstep(0.0, max(uZoomEnd, 0.0001), uProgress) * uZoomDepth;
    float flight = max(min(uFlight, uFlyEnd - uZoomEnd), 0.0001);
    float launch = uZoomEnd + aOrder * max(uFlyEnd - uZoomEnd - flight, 0.0);
    worldPosition.z += together + smoothstep(launch, launch + flight, uProgress) * (uReach - uZoomDepth);
    #endif
    vec4 viewPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * viewPosition;
    float depth = -viewPosition.z;
    // uSize * aSize is in world units: project it to pixels at this depth.
    gl_PointSize = uSize * aSize * projectionMatrix[1][1] * uViewportHeight * 0.5 / max(depth, 0.0001);

    vColor = aColor;
    // Faint like a starfield while scattered, solid once in the portrait.
    vAlpha = mix(uInitialOpacity, 1.0, offset);
    #ifdef TUNNEL
    vAlpha *= 1.0 - smoothstep(uFogNear, uFogFar, depth);
    // In the tunnel the goals closest to the camera are cards, drawn over the canvas
    // (src/hud/GoalCards.tsx); the farther ones stay pixels, with no gap between the two.
    vAlpha *= 1.0 - smoothstep(uHandOff.x, uHandOff.y, uProgress) * (1.0 - smoothstep(uCardDepth.x, uCardDepth.y, depth));
    gl_PointSize *= mix(1.0, uTunnelScale, smoothstep(0.0, 1.0, uProgress));
    #else
    vAlpha *= smoothstep(0.0, uFade, depth);
    #endif
    // A faded pixel need not cover the screen: skip its fragments.
    if (vAlpha <= 0.0) gl_PointSize = 0.0;
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
