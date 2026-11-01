# Design system · CR7 · 1000

Fuente del design system del proyecto (issue #19). Claude Design lo consulta para que todo lo que genere sea coherente.

- Design system navegable, con tokens y previews: [CR7 · 1000 HUD](https://claude.ai/artifact/1WGC69g46nJvG2G9Y6Qzwx). Para un agente: `project/README.md` (este texto), `project/tokens.json` y `project/components/bundle.css`.
- Diseño de la card del gol: [Card del gol](https://claude.ai/artifact/KHA2jfxbMmvK9sbQ3aP4Jc). La versión elegida es `project/CardCompact.dc.html`; `project/CardFull.dc.html` es la alternativa descartada.

Los dos enlaces son privados: hay que abrirlos con la misma cuenta o compartirlos antes.

El design system de CR7 · 1000 define la interfaz que vive sobre el retrato y el túnel. Por ahora cubre la card del gol: cada uno de los goles del túnel, con su estado de gol marcado y de gol faltante (#6). Todo lo que se diseñe para la interfaz parte de este documento.

## Principios

**La regla central: el contenedor es de vidrio y el contenido es de muro.** El glassmorphism se usa solo en el contenedor (`.hud-glass`). Todo lo que va dentro (número, rótulos, datos, pegatinas y contador) es neo-brutalista con voz urbana: grafiti, rotulación de metro y pegatinas de calle, en la línea del hip-hop.

Los dos estilos chocan: el vidrio es suave, translúcido y difuminado, y el neo-brutalismo es plano, duro y de alto contraste. Para que convivan, cada uno se queda en su capa y no se mezclan propiedades:

1. **El vidrio solo separa la card del túnel.** No lleva información. Tiene un fondo `glass-fill`, un `glass-blur`, un borde `glass-border` de `border-glass` y la única curva del sistema, `radius-glass`. Funde los goles que pasan por detrás en manchas, así el contenido siempre se lee sobre un suelo calmado.
2. **El contenido nunca es translúcido ni difuminado.** Todo lo de dentro va en colores planos y opacos (`chalk`, `ink`, `spray`, `metro`, `concrete`), con esquinas rectas (`radius-brutal`), bordes gruesos (`border-brutal`) y sombras duras sin difuminado (`shadow-hard-*`).
3. **El número es una pieza de grafiti.** `goal-number-xl` en Bungee, en `chalk`, con una extrusión dura en dos pasos: 3px en `ink` y 6px en `metro`, como las letras 3D de un throw-up. Todo lo demás es más pequeño y está a su servicio.
4. **El naranja es el gol.** `spray` es el color de los goles marcados en la card y en el túnel; `concrete` el de los goles faltantes. `metro` solo da volumen (sombras y extrusión), nunca significa nada por sí solo.
5. **Las pegatinas van torcidas, el resto recto.** Las etiquetas de estado son pegatinas: texto `tag` (Sedgwick Ave Display, en minúsculas, como un tag a rotulador) sobre un bloque plano, giradas `sticker-tilt`. Número, datos y contador van siempre rectos, para que se lean al hacer scroll.
6. **El túnel manda.** En reposo cada card es una placa pequeña con el número; los datos solo aparecen en la card que se abre. Así cientos de cards a la vista siguen leyéndose como paredes de goles.

## Tokens

### Glass (contenedor)

| Token | Valor | Uso |
|---|---|---|
| `glass-fill` | `rgba(12,12,11,0.6)` | Fondo. 0.6 es el mínimo para que el texto se lea con un gol naranja detrás. |
| `glass-blur` | `blur(20px) saturate(140%)` | `backdrop-filter` en desktop. |
| `glass-blur-m` | `blur(14px) saturate(140%)` | `backdrop-filter` en móvil. |
| `glass-border` · `border-glass` | `rgba(255,255,255,0.16)` · `1px` | Borde sutil. |
| `shadow-glass` | brillo inset arriba y sombra suave abajo | La única sombra difuminada del sistema. |
| `radius-glass` · `radius-glass-m` | `22px` · `18px` | Esquinas en desktop y en móvil. |

### Neo-brutalismo urbano (contenido)

| Token | Valor | Uso |
|---|---|---|
| `border-brutal` | `3px` | Bordes de pegatinas y de la barra del contador, siempre en `ink` (punteado en `concrete` si el gol falta). |
| `radius-brutal` | `0` | Todo el contenido. |
| `shadow-hard-metro` | `4px 4px 0 0 #2f6bff` | Pegatina `spray` y barra del contador. |
| `shadow-hard-spray` | `4px 4px 0 0 #ff5b1f` | Pegatina `chalk`. |
| `shadow-hard-concrete` | `3px 3px 0 0 #3a3a37` | Pegatina Por marcar. |
| Extrusión del número | `3px 3px 0` `ink` + `6px 6px 0` `metro` | `2px` + `4px` en móvil. Sin extrusión si el gol falta. |
| `sticker-tilt` | `-3deg` | Giro de las pegatinas. |

Sobre un fondo negro una sombra dura negra no se ve, así que las sombras duras van en `metro`, `spray` o `concrete-deep`. El paso en `ink` de la extrusión del número solo separa la cara `chalk` del azul.

### Comunes

**Colores** (un solo tema, oscuro a propósito: el túnel es negro):

| Token | Valor | Uso |
|---|---|---|
| `wall` | `#0a0a0a` | El muro: fondo de la página y del canvas. |
| `chalk` | `#ffffff` | Texto principal y relleno de pegatinas claras. |
| `chalk-muted` | `#c9c9c4` | Rótulos y texto secundario. |
| `ink` | `#0b0b0a` | Texto y bordes sobre `chalk`, `spray` y `concrete`. |
| `spray` · `spray-deep` | `#ff5b1f` · `#7a2608` | Gol marcado; fondo vacío de la barra. |
| `metro` | `#2f6bff` | Sombras duras y extrusión. Nunca texto. |
| `concrete` · `concrete-deep` | `#8c8c86` · `#3a3a37` | Gol faltante y su sombra. |
| `focus` | `#ffffff` | Anillo de foco sólido de 2px con 2px de separación. |

Naranja y azul se distinguen también con daltonismo, y el estado nunca depende solo del color: cada pegatina lleva su texto.

**Tipografía** (Google Fonts):

| Estilo | Familia | Tamaño / interlineado / peso | Uso |
|---|---|---|---|
| `goal-number-xl` | Bungee | 104px / 0.9 / 400 | Número en desktop. |
| `goal-number-m` | Bungee | 64px / 0.9 / 400 | Número en móvil. |
| `goal-number-missing` | Bungee Outline | 104px (64px en móvil) | Número de un gol faltante: solo el contorno, sin pintar. |
| `tag` · `tag-m` | Sedgwick Ave Display | 20px/22px · 17px/20px | Texto de las pegatinas, en minúsculas. |
| `data` · `data-m` | Rubik | 17px/22px · 15px/20px, 700 | Equipo, rival y fecha (cifras tabulares). |
| `label` | Rubik | 12px/16px, 800, +0.1em, mayúsculas | FECHA, EQUIPO, RIVAL. |
| `counter` | Bungee | 15px/18px, +0.02em | Contador de progreso. |

Bungee es ancha: a 104px los cuatro dígitos de «1000» caben en una card de 380px con `space-6` de padding. No se escribe «#» delante del número. Sedgwick Ave Display solo va en las pegatinas: es un tag, no un texto de lectura.

**Espaciado:** `space-1` 4px, `space-2` 8px, `space-3` 12px, `space-4` 16px, `space-6` 24px, `space-8` 32px. El padding del vidrio es `space-6` en desktop y `space-4` en móvil.

## Componentes

### GoalCard: la card del gol

Cada gol del túnel es una card de vidrio en lugar de un punto. Dirección elegida: **solo el número en reposo, todos los datos al pasar el cursor** (versión B del canvas [Card del gol](https://claude.ai/artifact/KHA2jfxbMmvK9sbQ3aP4Jc), componente `project/CardCompact.dc.html`).

**En reposo** (160px de ancho, padding 14px arriba, 16px a los lados y abajo):

- Número en Bungee a 44px, en `chalk`, con extrusión `2px 2px 0` `ink` + `4px 4px 0` `metro`.
- Arriba a la derecha, la marca de estado: un cuadro `spray` de 14×14 con borde `ink` de `border-brutal` y sombra `2px 2px 0` `metro` si el gol está marcado, o el anillo pulsante en `concrete` (12×12) si falta.
- Nada más: ni escudos, ni fecha, ni pegatina.

**Abierta** (al pasar el cursor o al recibir el foco con el teclado): la card se ensancha a 272px en 0.18s (`ease-out`) y el contenido nuevo entra con un fundido de 6px hacia abajo. De arriba abajo:

1. **Número y pegatina:** el número se queda donde estaba, igual de grande; la marca de estado se convierte en la pegatina «gol oficial» (`spray`, sombra `metro`) o «por marcar» (`wall`, borde punteado `concrete`, con el anillo), en `tag-m` y girada `sticker-tilt`.
2. **Escudos:** el escudo del equipo de CR7 a la izquierda y el del rival a la derecha, con «vs» en `tag` (24px) entre los dos. Cada escudo va en una baldosa de 64×64 con fondo `chalk`, borde `ink` de `border-brutal` y sombra dura: `spray` la del equipo de CR7, `metro` la del rival. Debajo de cada uno, el nombre del equipo en `label`.
3. **Fecha:** rótulo FECHA en `label` y la fecha en `data` («29 may 2026», con `Intl.DateTimeFormat('es')`), separados de los escudos por una línea `chalk` de `border-brutal`.

**Gol faltante:** el número va en `goal-number-missing` (Bungee Outline, en `concrete`, sin extrusión). Abierta, las baldosas de escudo son huecos de `wall` con borde punteado `concrete` y un «?», y la fecha se sustituye por «Faltan N goles para la meta» en `chalk-muted`, sobre una línea punteada. Sin equipo, rival ni fecha.

**Escudos:** el diseño usa marcadores de posición con las iniciales del equipo. Las imágenes reales van dentro de la baldosa blanca, centradas y contenidas (`object-fit: contain`) con 8px de aire, y llevan `alt` con el nombre del equipo («Escudo de Al-Nassr»). Los escudos son marcas registradas: hace falta elegir una fuente de imágenes con licencia antes de publicar.

### Alternativa descartada

La versión A del canvas (`project/CardFull.dc.html`) mostraba siempre todos los datos en una card de 272px. Se descartó porque, con cientos de goles a la vista, tapa el túnel.

## Comportamiento en el túnel

- **Tamaño de referencia:** las medidas de arriba son para una card a la distancia de lectura (la más cercana a la cámara). Las cards más lejanas se ven más pequeñas por la perspectiva y desaparecen en la niebla, como los puntos de hoy.
- **Cards y puntos:** solo los 48 goles más cercanos a la cámara son cards; los de más allá, hasta el fondo de la niebla, siguen siendo puntos, y en el borde las cards se funden en puntos. Solo las 12 cards más cercanas, y la abierta, desenfocan el túnel con `glass-blur`: cientos de capas con desenfoque harían el scroll lento.
- **Hover:** solo se abre una card a la vez. Al salir el cursor vuelve al reposo. Abrir una card no mueve a las demás.
- **Foco:** cada card es enfocable (`tabindex="0"`), se abre con el foco igual que con el hover y muestra un anillo `focus` de 2px con 2px de separación. Su `aria-label` resume el gol: «Gol 975, Al-Nassr contra Al-Taawoun, 29 may 2026» o «Gol 988, por marcar».
- **Táctil:** sin hover, la card se abre con un toque y se cierra al tocar fuera o al abrir otra.
- **Al recorrer el túnel:** una card abierta que deja de ser card (queda detrás de la cámara, o vuelve a ser punto al retroceder) se cierra, y no se vuelve a abrir sola.
- **Movimiento reducido:** sin el ensanche animado, sin el fundido y con el anillo fijo.
- **Color de los goles:** la paleta de `src/portrait/palette.ts` (`GOLD`, `GREY`) pasa a `spray` y `concrete`, para que el retrato y el túnel hablen el mismo idioma que la card.

## Contraste

El túnel es negro, pero los goles naranjas pasan por detrás de la card. El contraste se mantiene en tres niveles:

1. **El vidrio pone el suelo.** Con `glass-fill` a 0.6 y `glass-blur`, el peor caso (un gol `spray` justo detrás) queda en una luminancia de 0.05. Sobre eso, `chalk` da unos 10:1 y `chalk-muted` 6:1. Sobre el túnel real, casi negro, los dos superan 12:1.
2. **El texto pequeño va en `chalk` o `chalk-muted`, nunca en `spray`, `metro` ni `concrete`.** El naranja y el gris aparecen como relleno (con `ink` encima: 6.3:1 sobre `spray`) o en el número, que mide 64px o más y necesita 3:1. `metro` nunca lleva texto: ni `chalk` ni `ink` llegan a 4.5:1 sobre él.
3. **Los rellenos son opacos.** Las pegatinas y la barra no dependen de lo que pasa detrás.

`concrete` sobre el peor caso de vidrio queda en 3.1:1. Por eso el gris solo se usa en el número grande y en bordes, nunca en texto de lectura.

## Qué hacer

- Usar `.hud-glass` solo como contenedor más externo de cada card.
- Dar al contenido colores planos, esquinas rectas, bordes de `border-brutal` y sombras duras.
- Tomar el color del estado del punto de gol: `spray` si está marcado, `concrete` si falta.
- Escribir las pegatinas en minúsculas y en `tag`; los rótulos, en mayúsculas y en `label`.
- Escribir todos los textos en `src/i18n/es.ts` y formatear la fecha con `Intl.DateTimeFormat('es')`, por ejemplo «29 may 2026».
- Usar cifras tabulares en el número y en la fecha.

## Qué evitar

- Blur, transparencia o degradados en el contenido. El vidrio es solo para el contenedor.
- Esquinas redondeadas dentro de la card.
- Sombras difuminadas en el contenido, y sombras duras en negro sobre el fondo oscuro.
- Fuentes de spray con goteo o texturas (Rubik Spray Paint, Wet Paint) en el número: se dejan de leer al hacer scroll.
- Sedgwick Ave Display fuera de las pegatinas, o en mayúsculas.
- Girar el número, los datos o el contador.
- Vidrio dentro de vidrio, o vidrio sin contenido.
- Texto de menos de 24px en `spray` o `concrete`, y cualquier texto en `metro`.
- Bajar `glass-fill` de 0.6 o `glass-blur` de 14px.
- Otros acentos de color, iconos decorativos o emoji.
- Abrir más de una card a la vez, o mostrar datos en reposo.
