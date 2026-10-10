# Funzioni e flussi

Cosa deve permettere di fare l'interfaccia (funzioni) e il percorso per farlo (flussi). Vengono prima dei componenti e delle schermate: un componente nasce perché un flusso lo chiede. Superficie principale: TV con telecomando (frecce, OK, Indietro).

## Funzioni
Decise dall'utente il 2026-10-08 (vedi `registro.md`).

| # | Funzione | Gruppo |
|---|---|---|
| F1 | Riprendere un titolo interrotto | Guardare |
| F2 | Player: play/pausa, stop, successivo | Guardare |
| F3 | Player: sottotitoli, traccia audio, velocità di riproduzione | Guardare |
| F4 | Player: transcodifica | Guardare |
| F5 | Lanciare il trailer | Guardare |
| F6 | Ricerca con filtri | Trovare |
| F7 | Mostrare gli attori e i loro altri film | Trovare |
| F8 | Collezioni: una sezione per raggruppare i film | Trovare |
| F9 | Preferiti / La tua lista (una sola lista: "La mia lista") | Tenere |
| F10 | Cambiare profilo | Profili |
| F11 | Nascondere i contenuti 18+ su un profilo (PIN di 4 cifre per passare a un profilo senza blocco) | Profili |
| F12 | Aggiornare i metadati di film e serie | Libreria |

Home, sfogliare, schede, impostazioni e casi vuoti non sono funzioni: sono i luoghi dei flussi.

## Regole di navigazione
- **Indietro** torna sempre alla schermata precedente, con il fuoco sull'elemento da cui si era partiti.
- Dal contenuto, **↑** riporta il menu in alto (regola 2 della Sala).
- **Menu:** Cerca · Home · Film · Serie · Collezioni · La mia lista (5 sezioni più la ricerca). A destra l'immagine del profilo, che apre Cambia profilo e Impostazioni.

## Flussi
Approvati dall'utente il 2026-10-08.

| # | Flusso | Funzioni | Percorso |
|---|---|---|---|
| 0 | Avvio e profilo | F10, F11 | Apertura → Scelta del profilo (se più di uno) → Home. Cambio: menu → immagine del profilo → Cambia profilo → profilo. Da un profilo protetto a uno senza blocco: PIN |
| 1 | Riprendere | F1 | Home → prima riga "Riprendi" → OK sulla card → il player riparte dal punto. Dalla scheda: pulsante principale **Riprendi (mancano 34m)**; premendolo si apre la finestra «<titolo> è già iniziato. Ti mancano 34 minuti. Cosa vuoi fare?» con **Riprendi** e **Ricomincia** (cambiato il 2026-10-10: prima c'era il secondario Dall'inizio e nessuna finestra) |
| 2 | Guardare un film | F2, F5, F9, F12 | Home, Film o Collezione → card → **Scheda film** (Riproduci/Riprendi · Trailer · La mia lista · Altro) → Riproduci → Player |
| 3 | Guardare una serie | F1, F2 | Serie → card → **Scheda serie** (principale "Riprendi S2 E4" o "Guarda S1 E1"; stagioni in schede orizzontali, episodi sotto) → episodio → Player → a fine episodio **Prossimo episodio** con conto alla rovescia |
| 4 | Player | F2, F3, F4 | OK: pausa/play e comandi · ← →: indietro/avanti · **Successivo** (serie) · ↓: pannello opzioni (Sottotitoli · Audio · Velocità · Transcodifica) · Indietro: stop, salva il punto, torna alla scheda |
| 5 | Trailer | F5 | Scheda → Trailer → player del trailer → fine o Indietro → scheda |
| 6 | Ricerca con filtri | F6 | Menu → Cerca → tastiera a schermo a sinistra, risultati a destra aggiornati mentre si scrive; filtri sopra i risultati (Tipo · Genere · Anno · Attore) → OK → scheda. Nessun risultato: messaggio e "Togli i filtri" |
| 7 | Attori e altri film | F7 | Scheda → riga **Cast** → attore → **Pagina attore** (foto, titoli nella libreria) → titolo → scheda. Nella scheda anche la riga **Altri film** (stesso regista o collezione) |
| 8 | La mia lista | F9 | Aggiungi/togli dalla scheda (il pulsante diventa "Nella lista ✓"). Vedere: menu → La mia lista → griglia → scheda. Vuota: messaggio con suggerimento |
| 9 | Collezioni | F8 | Menu → Collezioni → griglia di collezioni → **Pagina collezione** (film in ordine) → scheda |
| 10 | Sfogliare Film e Serie | — | Menu → Film (o Serie) → ordine e filtri in alto → griglia → scheda |
| 11 | Aggiornare i metadati | F12 | Scheda → Altro → **Aggiorna metadati** → "Aggiorna" (automatico) o "Correggi titolo" (cerca, scegli, conferma) → scheda aggiornata. Tutta la libreria: Impostazioni → Libreria → Aggiorna tutto |
| 12 | Profili e 18+ | F10, F11 | Impostazioni → Profili → profilo → interruttore **Nascondi contenuti 18+** e PIN. Su quel profilo i titoli 18+ spariscono da Home, ricerca, sezioni e collezioni |
| 13 | Casi vuoti ed errori | — | Libreria vuota: messaggio e "Vai alle impostazioni della libreria" · Titolo non riproducibile: messaggio con "Prova la transcodifica" e "Torna alla scheda" |

## Schermate che ne derivano
Da codificare in `schermate.md` quando si disegnano: Scelta profilo · PIN · Home · Film · Serie · Collezioni · Pagina collezione · La mia lista · Cerca · Scheda film · Scheda serie · Pagina attore · Player (con pannello opzioni e Prossimo episodio) · Aggiorna metadati · Impostazioni (Libreria, Profili) · Stati vuoti ed errori.
