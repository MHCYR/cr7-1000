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

## Datos de goles

Los goles oficiales están en `src/data/goles.json`, un gol por línea con `numero`, `fecha` (`YYYY-MM-DD`), `equipo` y `rival`. Se validan al cargar la página y en `pnpm test`: los números van seguidos desde 1, sin repetirse, y las fechas nunca retroceden.

Por ahora son **975 goles falsos** para los prototipos: equipos y etapas reales de la carrera, con fechas y rivales inventados. Para regenerarlos (siempre salen iguales, porque usan una semilla fija):

```bash
pnpm data:fake # reescribe src/data/goles.json
```

## Foto placeholder

El retrato se genera a partir de `public/cr7_portrait.png`. Esa foto es **solo local**: está en `.gitignore` y no se publica. Antes de publicar se elige una foto con licencia (ver [docs/SPEC.md](docs/SPEC.md)).
