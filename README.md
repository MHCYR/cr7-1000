# CR7 · 1000

Fan page de código creativo: la figura de Cristiano Ronaldo hecha de puntos, donde cada gol oficial es un punto, como contador hacia los 1000 goles.

- Qué se construye y por qué: [docs/SPEC.md](docs/SPEC.md)
- Vocabulario: [GLOSSARY.md](GLOSSARY.md)
- Decisiones: [docs/adr](docs/adr)

## Requisitos

- Node 26 LTS (fijado en `.node-version`; con `fnm`, ejecuta `fnm use`)
- pnpm 12 (fijado en `packageManager` de `package.json`)

## Comandos

```bash
pnpm install   # instala dependencias
pnpm dev       # servidor de desarrollo
pnpm build     # comprobación de tipos + build de producción en dist/
pnpm lint      # oxlint
pnpm test      # tests con Vitest
pnpm preview   # sirve el build de dist/
```

## Ajustar el retrato en desarrollo

Con `pnpm dev` aparece un panel Leva con tres grupos: **Animación**, **Píxeles de relleno y bordes** y **Encuadre y semillas**. Los valores iniciales salen de `PORTRAIT_DEFAULTS` en `src/portrait/settings.ts`; el panel no guarda configuraciones y una recarga completa restaura esos valores.

| Cambio | Trabajo que realiza |
|---|---|
| Duración, opacidad inicial y ocupación del viewport | Actualiza uniforms o escala, sin regenerar puntos |
| Escalonados, arranque de goles, dispersión inicial, tamaños, dispersión y encogimiento del borde | Recalcula buffers sin leer otra vez la foto |
| Densidad, franja de borde y semilla general | Ejecuta `samplePortrait` con los píxeles de la foto ya decodificada; la semilla también cambia los buffers aleatorios |

**Reiniciar animación** reproduce el armado desde t = 0, sin recargar la foto ni el contexto WebGL. Si está activada la preferencia de movimiento reducido del sistema, el retrato permanece armado. Para apreciar cambios en el vuelo o la opacidad inicial después del armado, pulsa este botón.

**Copiar valores** copia una declaración TypeScript completa. Sustituye únicamente la declaración `export const PORTRAIT_DEFAULTS: PortraitSettings = { ... }` en `src/portrait/settings.ts` por el texto copiado para adoptar el mismo retrato como configuración del código. Se incluyen todos los parámetros y la semilla. El panel confirma la copia o avisa si el navegador deniega el portapapeles; usa localhost o HTTPS.

Leva es una dependencia de desarrollo y se importa dinámicamente solo bajo `import.meta.env.DEV`. `pnpm build` y `pnpm preview` no incluyen ni muestran el panel. Los tamaños, bordes y colores de los píxeles de gol, el umbral de transparencia y la ruta de la foto no se exponen.

## Túnel

El scroll de la página mueve la escena; la cámara no se controla de otra forma. El primer viewport de scroll lleva el progreso de 0 a 1: los píxeles de gol vuelan del retrato al túnel y los píxeles de relleno se desvanecen. El resto del scroll mueve la cámara en Z desde el retrato hasta el gol 1000. Al volver arriba, el retrato se rearma.

En el túnel, el gol número n está en `z = -n × separación`, con X/Y al azar (semilla fija) en un anillo alrededor del eje de la cámara, para que la cámara pase junto a los goles. El gol actual es `round(-z / separación)` de la cámara: 0 antes de entrar al túnel y nunca más que el último gol. Las constantes (`separation`, `radius`, `cameraStart` y `pixelsPerGoal`) están en `TUNNEL`, en `src/tunnel/tunnel.ts`; la interpolación ocurre en el shader, sin rerenders de React por frame.

## Datos de goles

Los goles oficiales están en `src/data/goles.json`, un gol por línea con `numero`, `fecha` (`YYYY-MM-DD`), `equipoId` y `rivalId`. Los ids son los de Transfermarkt y apuntan a `src/data/clubes.json`, que guarda para cada club o selección su `nombre` y su `escudo` (`/escudos/<id>.webp`, servido desde `public/escudos/`, o `null` si no tiene). Se validan al cargar la página y en `pnpm test`: los números van seguidos desde 1, sin repetirse, las fechas nunca retroceden y cada id existe en la lista de clubes.

Los datos salen de la API JSON de Transfermarkt ([ADR 0002](docs/adr/0002-datos-en-json-estatico.md)). Para actualizarlos, por ejemplo después de un gol nuevo:

```bash
pnpm data:real # reescribe goles.json y clubes.json, y descarga los escudos que falten
```

El script necesita red e ImageMagick 7 (`magick` en el PATH) y solo escribe los JSON si los datos nuevos pasan la validación. Convierte cada escudo nuevo a WebP con calidad 90 y falla si dos clubes comparten un escudo idéntico byte a byte. Los escudos WebP ya descargados no se vuelven a pedir. Para renovar uno, borra su archivo de `public/escudos/` y ejecuta el script otra vez. Los nombres llegan en inglés, tal como los publica Transfermarkt. La fecha de cada gol es la fecha UTC del inicio del partido.

## Foto placeholder

El retrato se genera a partir de `public/cr7_portrait.png`. Esa foto es **solo local**: está en `.gitignore` y no se publica. Los tests y el build no la necesitan, porque el muestreo (`src/portrait/sample.ts`) se prueba con imágenes sintéticas. Antes de publicar se elige una foto con licencia (ver [docs/SPEC.md](docs/SPEC.md)).
