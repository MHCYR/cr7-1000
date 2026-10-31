# Datos de goles en un JSON estático, sin API

No existe una API gratuita con el detalle de los ~975 goles oficiales; las de pago solo cubren temporadas recientes y obligarían a tener un backend para esconder la key. Los goles se compilan una sola vez en un JSON dentro del repo (club: dataset de Kaggle/Hugging Face; Portugal: a mano) y cada gol nuevo se agrega a mano, a razón de uno por semana más o menos. El sitio es 100 % estático.

Cada gol guarda solo: número de gol, fecha, equipo y rival.
