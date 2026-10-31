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
pnpm preview   # sirve el build de dist/
```

## Foto placeholder

El retrato se genera a partir de `public/cr7_portrait.png`. Esa foto es **solo local**: está en `.gitignore` y no se publica. Antes de publicar se elige una foto con licencia (ver [docs/SPEC.md](docs/SPEC.md)).
