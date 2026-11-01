# CR7 · 1000

Fan page de código creativo: una nube de puntos 3D con la figura de Cristiano Ronaldo en la que cada gol oficial es un punto clicable, como contador hacia los 1000 goles.

## Goles

**Gol oficial**:
Gol de Cristiano Ronaldo en partido oficial con un club o con la selección de Portugal. Los amistosos de club no cuentan.
_Avoid_: gol, tanto (sin calificar)

**Número de gol**:
Posición cronológica de un gol oficial en la carrera de Cristiano, empezando en 1.
_Avoid_: id, índice

**Equipo**:
Club o selección con la que Cristiano marcó el gol.
_Avoid_: club, team

**Rival**:
Equipo contra el que se marcó el gol.
_Avoid_: oponente, contrario

**Escudo**:
Imagen que identifica a un equipo o rival; en las selecciones, el escudo de su federación, no la bandera.
_Avoid_: logo, crest

**Meta**:
El gol oficial número 1000.
_Avoid_: objetivo, hito

## La nube

**Nube**:
El conjunto de todos los puntos que forman la figura de Cristiano en 3D.
_Avoid_: point cloud, partículas

**Polvo**:
En el prototipo A, los puntos decorativos de la nube que solo dibujan la figura y no se pueden clicar.
_Avoid_: partículas de fondo, píxeles (en el prototipo A)

**Píxel de relleno**:
En el prototipo B, cada uno de los cuadros decorativos del retrato, de tamaño aleatorio, que solo dibujan la figura y no se pueden clicar. Cumple el papel del polvo del prototipo A.
_Avoid_: polvo (en el prototipo B), partículas

**Punto de gol**:
Uno de los 1000 puntos de la nube que representa un número de gol y se puede clicar.
_Avoid_: nodo, marcador

**Gol marcado**:
Punto de gol cuyo número de gol ya existe; se muestra encendido.
_Avoid_: punto activo

**Gol faltante**:
Punto de gol cuyo número todavía no se ha marcado; se muestra en gris.
_Avoid_: punto vacío, pendiente

**Gol extra**:
Gol oficial con número mayor que 1000; se muestra fuera de la figura.
_Avoid_: bonus, overflow

## Prototipos

**Prototipo A · Nube orbitable**:
Figura 3D de Cristiano hecha de polvo, con los puntos de gol encima, que el visitante gira libremente.
_Avoid_: versión Atelier

**Prototipo B · Retrato y túnel**:
Experiencia en dos actos: el retrato se arma al entrar y, al hacer scroll, sus píxeles se desprenden como goles en orden cronológico.
_Avoid_: versión Vadim

**Retrato**:
En el prototipo B, la imagen de Cristiano formada por una cuadrícula de píxeles donde cada píxel de gol es un punto de gol.
_Avoid_: portada, hero

**Túnel**:
En el prototipo B, el recorrido por scroll en el que la cámara pasa junto a los goles, del 1 al 1000.
_Avoid_: galería, carrusel
