# Cineteca · prototipo TV

Prototipo dell'interfaccia TV (1920 × 1080) con dati finti, fedele alla libreria Figma (`AGENTS.md`).
Si usa con la tastiera come telecomando: frecce, Invio = OK, Esc o Backspace = Indietro. PIN dei profili: 1234.

```
npm install
npm run dev
```

## Immagini e video
Le locandine, gli sfondi, le foto del cast e il video del player **non sono nel repository** (circa 70 MB, in parte con diritti).
Si riscaricano con gli script in `strumenti/` (Python 3.11, con Pillow per `costruisci.py`):

```
python -I strumenti/raccogli.py grezzo.json          # titoli, trame, cast (Wikipedia, Wikidata, TVmaze)
python -I strumenti/trame.py grezzo.json             # completa le trame
python -I strumenti/costruisci.py grezzo.json public/media src/catalogo.json   # scarica e ridimensiona le immagini
python -I strumenti/illustrazioni.py public/media/illustrazioni                # illustrazioni di Generi e Mood
```

Il video del player (`public/media/video.mp4`) è *Caminandes: Llama Drama* (Blender Foundation, CC BY), dal server di prova di Jellyfin.
Le illustrazioni e le foto dei profili sono già nel repository.
