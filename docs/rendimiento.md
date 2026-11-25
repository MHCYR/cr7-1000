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
