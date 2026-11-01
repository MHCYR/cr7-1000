# Datos de goles en un JSON estático, generado desde Transfermarkt

No existe una API pública y gratuita con el detalle de los ~975 goles oficiales; las de pago solo cubren temporadas recientes y obligarían a tener un backend para esconder la key. Por eso el sitio es 100 % estático: los goles viven en un JSON dentro del repo y la página nunca llama a una API.

Ese JSON lo genera un script local (`pnpm data:real`) a partir de la API JSON interna de Transfermarkt (`tmapi.transfermarkt.technology`), la misma que usa su web y que [transfermarkt-api](https://github.com/diegogalocha/transfermarkt-api-v4) envuelve. Una sola petición devuelve todos los partidos de Cristiano con sus goles, club y rival; otra, por lotes, los nombres de los clubes. El script descarga también los escudos y los convierte con ImageMagick a WebP (calidad 90) en `public/escudos/`, para no depender del CDN de Transfermarkt. Rechaza escudos idénticos byte a byte entre clubes antes de escribir los JSON. Los goles nuevos se incorporan ejecutando el script otra vez, no editando el JSON a mano.

Cada gol guarda solo: número de gol, fecha, id del equipo e id del rival. Nombre y escudo de cada club están en una lista aparte (`clubes.json`), para no repetirlos en cientos de goles.

## Consecuencias

- La API de Transfermarkt no está documentada y puede cambiar sin aviso. Si cambia, el script falla sin tocar los datos y el sitio sigue funcionando con los últimos goles generados.
- La instancia pública de transfermarkt-api (`transfermarkt-api.fly.dev`) está bloqueada por Transfermarkt (403 en octubre de 2026); el script llama a Transfermarkt directamente. Una actualización automática con GitHub Actions queda pendiente hasta comprobar que Transfermarkt no bloquea esas IP.
- Los datos y los escudos son de Transfermarkt y de cada club: antes de publicar hay que revisar sus términos.

## Alternativas descartadas

- **Dataset de Kaggle/Hugging Face + Portugal a mano**: el plan original. Exige compilar y cruzar dos fuentes y agregar cada gol nuevo a mano.
- **Llamar a la API desde el navegador**: rompe el sitio estático, y depende de que Transfermarkt responda en cada visita.
