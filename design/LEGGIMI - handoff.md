# Cineteca — pacchetto di consegna

## Cosa c'è dentro

- `Cineteca - Granito.dc.html` — la board principale (tema scuro, linguaggio proprio): 8 schermate TV 1920×1080, home e player mobile, popup di ripresa.
- `Cineteca - Schermate mancanti.dc.html` — turno 5: le 10 schermate che completano il flusso (Film e Serie a catalogo, Mostra tutto, prossimo episodio, pannelli audio/sottotitoli/capitoli del player, libreria vuota, nessun risultato, errore di riproduzione, Impostazioni). Riusa la stessa sidebar e lo stesso linguaggio visivo della board principale.
- `Sidebar.dc.html` — componente condiviso: la colonna icone a 104px, riusata da entrambe le board tramite `<dc-import>`.
- `photos/` — i fotogrammi di esempio richiamati dalle board (non inclusi in questo export: vedi nota sotto).
- `image-slot.js` — il segnaposto immagine trascinabile usato dalle board.
- `support.js` — il runtime dei Design Component. **Non modificare e non rimuovere**: senza questo file le board non si aprono.
- `_ds/` — i tre sistemi visivi legati al progetto (Classical, Modernist, Organic), non più usati dalla board attuale ma tenuti come confronto storico.

## Come riaprirlo su un altro account

1. Crea un progetto nuovo su Claude Design e carica **l'intero contenuto di questa cartella** mantenendo la struttura (`_ds/` e `photos/` incluse, con gli stessi nomi).
2. Apri `Cineteca - Granito.dc.html`.
3. La vista a tavola (pan e zoom su tutte le schermate insieme) è già impostata dentro il file: ogni board dichiara `<meta name="design_doc_mode" content="canvas">` nell'intestazione. Se il progetto mostrasse una schermata alla volta, verifica che quel meta sia presente e che `support.js` sia nella cartella radice, accanto ai file `.dc.html`.

## Note

- I percorsi sono tutti relativi alla radice del progetto: se sposti i file in una sottocartella, aggiorna i riferimenti a `support.js`, `image-slot.js`, `photos/` e `_ds/`.
- **I fotogrammi in `photos/` non sono inclusi in questo export su GitHub**: sono immagini binarie grandi (~2.6 MB l'una) che gli strumenti usati per l'esportazione non trasferiscono. Scaricali direttamente da Claude Design se servono, oppure trascina immagini vere sopra i segnaposto.
- Le locandine e le miniature grigie sono volutamente vuote: sono i punti in cui entrano gli artwork reali del catalogo.
- Nessun logo su licenza (Dolby, DTS, HDR10+) è incluso: le caratteristiche tecniche sono dichiarate con pittogrammi propri e marchi denominativi in testo.
- I tre sistemi in `_ds/` contengono solo i token e il readme di ciascun sistema, non le pagine dimostrative complete (foundations/components/templates): quelle restano solo dentro il progetto Claude Design originale.
