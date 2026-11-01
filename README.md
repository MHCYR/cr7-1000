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

Con `pnpm dev` aparece un panel Leva con cuatro grupos: **Animación**, **Píxeles de relleno y bordes**, **Entrada al túnel** y **Encuadre y semillas**. Los valores iniciales salen de `PORTRAIT_DEFAULTS` en `src/portrait/settings.ts`; el panel no guarda configuraciones y una recarga completa restaura esos valores.

| Cambio | Trabajo que realiza |
|---|---|
| Duración, opacidad inicial, ocupación del viewport y tiempos y distancias de la entrada al túnel | Actualiza uniforms o escala, sin regenerar puntos |
| Escalonados, arranque de goles, dispersión inicial, tamaños, dispersión y encogimiento del borde, azar del orden | Recalcula buffers sin leer otra vez la foto |
| Densidad, franja de borde y semilla general | Ejecuta `samplePortrait` con los píxeles de la foto ya decodificada; la semilla también cambia los buffers aleatorios |

**Reiniciar animación** reproduce el armado desde t = 0, sin recargar la foto ni el contexto WebGL. Si está activada la preferencia de movimiento reducido del sistema, el retrato permanece armado. Para apreciar cambios en el vuelo o la opacidad inicial después del armado, pulsa este botón.

**Copiar valores** copia una declaración TypeScript completa. Sustituye únicamente la declaración `export const PORTRAIT_DEFAULTS: PortraitSettings = { ... }` en `src/portrait/settings.ts` por el texto copiado para adoptar el mismo retrato como configuración del código. Se incluyen todos los parámetros y la semilla. El panel confirma la copia o avisa si el navegador deniega el portapapeles; usa localhost o HTTPS.

Leva es una dependencia de desarrollo y se importa dinámicamente solo bajo `import.meta.env.DEV`. `pnpm build` y `pnpm preview` no incluyen ni muestran el panel. Los tamaños, bordes y colores de los píxeles de gol, el umbral de transparencia y la ruta de la foto no se exponen.

## Túnel

El scroll de la página mueve la escena; la cámara no se controla de otra forma. El primer viewport de scroll lleva el progreso de 0 a 1: los píxeles de gol vuelan del retrato al túnel mientras la cámara entra en la imagen. El resto del scroll mueve la cámara en Z desde el retrato hasta el gol 1000. Al volver arriba, el retrato se rearma.

Para entrar en la imagen, el relleno se mueve en dos pasos mientras la cámara sigue quieta. Primero toda la imagen avanza junta hacia la cámara (+Z) hasta `zoomEnd`, y la perspectiva la agranda desde el centro de la pantalla. Después cada píxel de relleno vuela por su cuenta, pasa junto a la cámara y desaparece detrás de ella, como si la imagen tuviera profundidad: sale primero el centro (la cara) y al final los bordes, según un orden fijo por píxel (`fillOrder`: la distancia al centro con un poco de azar de semilla fija). Cada píxel se desvanece al acercarse a la cámara. Todo el relleno pasa la cámara antes de `flyEnd`, así que los goles terminan de alinearse con el relleno ya fuera de la vista. `FILL_ZOOM`, en `src/tunnel/tunnel.ts`, fija esos tiempos (`zoomEnd`, `flyEnd` y `flight`, como fracción del progreso), las distancias (`zoomDepth`, `reach` y `fade`) y el azar del orden (`jitter`); se ajustan en el grupo **Entrada al túnel** del panel. Cambiar el azar del orden recalcula un buffer; el resto solo actualiza uniforms.

En el túnel, el gol número n está en `z = -n × separación`, con X/Y al azar (semilla fija) en un anillo alrededor del eje de la cámara, para que la cámara pase junto a los goles. El gol actual es `round(-z / separación)` de la cámara: 0 antes de entrar al túnel y nunca más que el último gol. Las constantes (`separation`, `radius`, `cameraStart` y `pixelsPerGoal`) están en `TUNNEL`, en `src/tunnel/tunnel.ts`; la interpolación ocurre en el shader, sin rerenders de React por frame.

## Datos de goles

Los goles oficiales están en `src/data/goles.json`, un gol por línea con `numero`, `fecha` (`YYYY-MM-DD`), `equipo` y `rival`. Se validan al cargar la página y en `pnpm test`: los números van seguidos desde 1, sin repetirse, y las fechas nunca retroceden.

Por ahora son **975 goles falsos** para los prototipos: equipos y etapas reales de la carrera, con fechas y rivales inventados. Para regenerarlos (siempre salen iguales, porque usan una semilla fija):

```bash
pnpm data:fake # reescribe src/data/goles.json
```

## Foto placeholder

El retrato se genera a partir de `public/cr7_portrait.png`. Esa foto es **solo local**: está en `.gitignore` y no se publica. Los tests y el build no la necesitan, porque el muestreo (`src/portrait/sample.ts`) se prueba con imágenes sintéticas. Antes de publicar se elige una foto con licencia (ver [docs/SPEC.md](docs/SPEC.md)).
