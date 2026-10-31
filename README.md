# CR7 · 1000

Fan page de código creativo: la figura de Cristiano Ronaldo hecha de puntos, donde cada gol oficial es un punto, como contador hacia los 1000 goles.

- Qué se construye y por qué: [docs/SPEC.md](docs/SPEC.md)
- Vocabulario: [GLOSSARY.md](GLOSSARY.md)
- Decisiones: [docs/adr](docs/adr)

## Requisitos

- Node 26 LTS (fijado en `.node-version`; con `fnm`, ejecuta `fnm use`)
- npm (incluido con Node)

## Comandos

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo
npm run build    # comprobación de tipos + build de producción en dist/
npm run lint     # oxlint
npm run preview  # sirve el build de dist/
```

## Foto placeholder

El retrato se genera a partir de `public/cr7_portrait.png`. Esa foto es **solo local**: está en `.gitignore` y no se publica. Antes de publicar se elige una foto con licencia (ver [docs/SPEC.md](docs/SPEC.md)).
