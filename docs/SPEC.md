# CR7 · 1000 — Spec (fase 1: antes de los prototipos)

Vocabulario en [GLOSSARY.md](../GLOSSARY.md). Decisiones con contexto en [docs/adr](./adr).

## Decidido

### Contenido
- Cuenta solo el **gol oficial**: club + Portugal, sin amistosos de club. Hoy son ~975 (julio de 2026).
- Datos por gol: **número de gol, fecha, equipo, rival**. Nada más.
- Datos en un **JSON estático** dentro del repo ([ADR 0002](./adr/0002-datos-en-json-estatico.md)). Club: dataset de Kaggle/Hugging Face. Portugal: compilado aparte. Los goles nuevos se agregan editando el JSON a mano y haciendo push.
- La página contempla desde el inicio el estado **post-1000**: todos los puntos encendidos, celebración y goles extra fuera de la figura.

### Visual
- **Nube híbrida**: polvo decorativo + 1000 puntos de gol ([ADR 0001](./adr/0001-nube-hibrida-polvo-y-puntos-de-gol.md)).
- Forma: **foto + mapa de profundidad** generado con IA (Depth Anything V2). En el prototipo B el retrato es 2D y no necesita mapa de profundidad. Al principio se usa una foto **placeholder solo local**; antes de publicar se elige una con licencia o un arte propio.
- Paleta: el polvo toma los **colores de la foto**; los goles marcados van en **dorado**; los goles faltantes, en **gris con un anillo pulsante**.
- Orden de los puntos de gol: **cronológico**, de los pies a la cabeza (o el orden del túnel en el prototipo B).
- Clic en un gol: **la cámara vuela hasta él y se abre una ficha** con los 4 datos.
- Interfaz extra: **línea de tiempo** (en el prototipo B es el propio scroll).
- Entrada: **la imagen se construye al entrar**, como en vadimcarazan.com.

### Plataforma
- **Node 26 LTS** (fijado en `.node-version`) y npm. Siempre se instalan las versiones LTS o estables más recientes.
- Vite + React + **React Three Fiber** + drei ([ADR 0003](./adr/0003-react-three-fiber.md)); GSAP o drei para las animaciones de cámara.
- **Primero desktop**, también funcional en móvil (unos 20k puntos de polvo en móvil).
- Español, con los textos separados del código (listo para i18n).
- Deploy en **Vercel**.

## Fase de prototipos

Se construyen los dos, sin límite de tiempo, con datos falsos de 975 goles y la foto placeholder. **Se empieza por el prototipo B**, que pide menos esfuerzo inicial: no necesita mapa de profundidad, el túnel es un solo eje de scroll y a Cristiano se le reconoce con más facilidad en 2D.

- **Prototipo A · Nube orbitable**: figura 3D, puntos de gol encima, órbita libre y slider de línea de tiempo.
- **Prototipo B · Retrato y túnel**: el retrato en píxeles se arma al entrar; al hacer scroll, cada píxel de gol se desprende en orden cronológico y muestra su número en grande junto con fecha, equipo y rival; los goles faltantes van al final, en gris.

### Prototipo B en detalle

Referencia: [vadimcarazan.com](https://vadimcarazan.com/).

- **Retrato con nube híbrida** ([ADR 0001](./adr/0001-nube-hibrida-polvo-y-puntos-de-gol.md)): una cuadrícula densa de **polvo**, con los colores de la foto, dibuja la cara; los **1000 píxeles de gol** van repartidos dentro de ella en orden cronológico, de los pies a la cabeza. Con solo 1000 píxeles el retrato quedaría en unos 32×32 y a Cristiano no se le reconocería.
- **Túnel**: cada píxel de gol tiene dos posiciones, la del retrato y la del túnel (`z = -número de gol × separación`, con X/Y al azar). Un único progreso (0→1) interpola entre las dos. Al hacer scroll solo los píxeles de gol vuelan al túnel; el polvo se desvanece.
- **Scroll**: el scroll mueve la cámara en Z. El gol actual es el más cercano a la cámara (`round(z / separación)`).
- **Indicador**: una capa HTML muestra el número del gol actual en grande, junto con fecha, equipo y rival, y un contador de progreso (por ejemplo, `16 de 1000 goles`).
- **Goles faltantes**: van al final del túnel, en gris con el anillo pulsante.

Orden de construcción:
1. Base: Vite + React Three Fiber, JSON falso con 975 goles y muestreo de la foto placeholder.
2. Retrato: polvo + píxeles de gol y la animación de armado al entrar.
3. Túnel: posiciones en Z, scroll → cámara e indicador HTML.
4. Goles faltantes al final del túnel.

Criterios para elegir:
1. A Cristiano se le reconoce.
2. Recorrer o explorar los 1000 goles es disfrutable.
3. Impresión / efecto "wow".

## Pendiente (después de elegir el prototipo)
- Contenido y diseño de la ficha del gol.
- Dónde y cómo se muestran los goles extra.
- Coreografía del estado post-1000.
- Foto definitiva y su licencia.
