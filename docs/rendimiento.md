# Medición base de rendimiento

Commit base `041aef9` (issue #31).

## Cómo repetir la medición

Con las dependencias del proyecto instaladas, ejecuta `pnpm perf` desde el
worktree. Si falta Chromium, instálalo una vez con
`pnpm exec playwright install chromium`. Playwright 1.65.1 usa Chromium 1255.

El comando compila el build de producción y lo sirve con Vite Preview en
`127.0.0.1:5174`, con puerto estricto. Abre Chrome headless con Playwright,
aplica una ralentización de CPU de 4× por CDP y comprueba que el renderizador
sea SwiftShader (render por software). Los resultados sirven para comparar
antes y después en la misma máquina y con la misma versión de Chrome. El
rendimiento absoluto en dispositivos con GPU se mide por separado.

Cada perfil abre un contexto nuevo con movimiento normal y una semilla fija
para reproducir la selección aleatoria del retrato.

| Perfil | Viewport (px CSS) | DPR emulado | Táctil |
| --- | ---: | ---: | --- |
| Desktop | 1440×900 | 1 | No |
| Móvil emulado | 390×844 | 3 | Sí |

- **Entrada del retrato.** Muestrea 4 segundos en la parte superior de la
  página a partir del primer ciclo de animación posterior al primer dibujo
  de puntos WebGL.
- **Túnel.** Salta al 5 % del scroll, espera 1 segundo y recorre linealmente
  el resto de la página durante 10 segundos según el reloj del navegador.
  El script comprueba que el scroll llega al final.

El script recoge los intervalos entre llamadas consecutivas a
`requestAnimationFrame`. Calcula los FPS medios como el número de intervalos
dividido por la suma de sus duraciones en segundos. Usa rango más próximo
para p50 y p95. Imprime una tabla Markdown con los resultados, junto con el
commit, la versión de Chrome, el entorno, el retrato seleccionado y la
resolución efectiva del canvas. Conserva el protocolo para la medición final
del issue #36.

## Resultado base

Medido el 25 nov 2026 sobre el commit `041aef9`, antes de cualquier cambio de móvil.

- Chrome 159.0.8154.6 headless, CPU 4× más lenta.
- Render por software: ANGLE con SwiftShader (Vulkan 1.3.0).
- macOS 27.2.0 arm64, Apple M6.
- Retrato: `/cristiano/2006.webp` en los dos perfiles. Scroll máximo: 26050 px.

| Perfil | Fase | Frames | FPS medio | p50 (ms) | p95 (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| Desktop | Entrada del retrato | 207 | 51.54 | 16.70 | 33.30 |
| Desktop | Túnel | 221 | 21.99 | 50.00 | 66.60 |
| Móvil emulado | Entrada del retrato | 204 | 50.79 | 16.70 | 33.30 |
| Móvil emulado | Túnel | 389 | 38.84 | 33.20 | 33.40 |

Canvas efectivo: 1440×900 en desktop y 780×1688 en móvil emulado. El móvil
emula DPR 3, pero hoy el canvas se limita a DPR 2.

Con render por software, el costo crece con los píxeles del canvas. Por eso el
túnel en desktop, con más píxeles, va más lento que en el móvil emulado. Los
números solo sirven para comparar el antes y el después en este mismo entorno.

## Resultado final

Medido el 26 nov 2026 sobre el commit `885f6ea`, después de los cambios de móvil de #7 (#32, #33, #34 y #27).

- Chrome 159.0.8154.6 headless, CPU 4× más lenta.
- Render por software: ANGLE (Google, Vulkan 1.3.0, SwiftShader).
- macOS 27.2.0 arm64, Apple M6.
- Retrato: `/cristiano/2006.webp` en los dos perfiles. Scroll máximo: 26050 px.

| Perfil | Fase | Frames | FPS medio | p50 (ms) | p95 (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| Desktop | Entrada del retrato | 217 | 54.03 | 16.70 | 33.30 |
| Desktop | Túnel | 248 | 24.76 | 33.40 | 50.10 |
| Móvil emulado | Entrada del retrato | 237 | 59.01 | 16.70 | 16.80 |
| Móvil emulado | Túnel | 482 | 48.12 | 16.70 | 33.40 |

Canvas efectivo: 1440×900 en desktop y 585×1266 en móvil emulado. El móvil
emula DPR 3, pero ahora el canvas se limita a DPR 1.5 (antes 2).

## Antes y después

| Perfil | Fase | FPS medio antes | FPS medio después | Δ FPS | p95 antes (ms) | p95 después (ms) | Δ p95 (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | Entrada del retrato | 51.54 | 54.03 | +4.83 % | 33.30 | 33.30 | 0.00 |
| Desktop | Túnel | 21.99 | 24.76 | +12.60 % | 66.60 | 50.10 | -16.50 |
| Móvil emulado | Entrada del retrato | 50.79 | 59.01 | +16.18 % | 33.30 | 16.80 | -16.50 |
| Móvil emulado | Túnel | 38.84 | 48.12 | +23.89 % | 33.40 | 33.40 | 0.00 |

El móvil emulado mejora de forma clara: el canvas pasa de 780×1688 a 585×1266
(DPR 1.5 en vez de 2, ~740k píxeles por frame en vez de ~1.3M) y el retrato
usa 20k puntos de relleno en vez de 50k, así que hay menos vértices que
sombrear. El túnel gana ~24 % de FPS y la entrada ~16 %, y el p95 de la
entrada cae 16.5 ms. El desktop también sube (entrada +4.8 %, túnel +12.6 %),
aunque ningún cambio lo tocaba: la densidad y el DPR máximo son solo de móvil
y su canvas sigue en 1440×900. Esa mejora es probablemente ruido de la
medición, no un efecto real. Las cards con resumen (#27) añaden más DOM por
card en móvil, pero no impiden la mejora del túnel.

Los números son con render por software (SwiftShader); falta confirmarlos en
un móvil real con GPU.
