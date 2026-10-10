# Schermate

Il disegno vive in Figma, nel file dei mockup (link in `AGENTS.md`). Qui c'è tutto ciò che è una decisione. Le esportazioni stanno in `immagini/`, con il nome del codice. Le schermate nascono dai flussi di `flussi.md` (approvate il 2026-10-08). Superficie principale: TV, 1920 × 1080.

| Codice | Schermata | Schema | Flussi | Stati da disegnare | Stato |
|---|---|---|---|---|---|
| SC-01 | Scelta profilo | F | 0 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=18-240) approvato per ora |
| SC-02 | PIN | F | 0, 12 | PIN sbagliato | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-64) approvato per ora |
| SC-03 | Home | A | 1, 2 | Libreria vuota · menu del profilo aperto | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=16-77) approvato per ora |
| SC-04 | Film | B | 10 | Filtri aperti | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=17-81) approvato per ora |
| SC-05 | Serie | B | 10 | Filtri aperti | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-142) approvato per ora |
| SC-06 | Collezioni | B | 9 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-382) approvato per ora |
| SC-07 | Pagina collezione | C | 9 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=23-349) approvato per ora |
| SC-08 | La mia lista | B | 8 | Lista vuota | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-222) approvato per ora |
| SC-09 | Cerca | D | 6 | Nessun risultato · filtri attivi | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=18-70) approvato per ora |
| SC-10 | Scheda film | C | 2, 5, 7, 8, 11 | Titolo già iniziato · menu "Altro" aperto | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=17-158) approvato per ora |
| SC-11 | Scheda serie | C | 3 | Stagione scelta | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=23-212) approvato per ora |
| SC-12 | Pagina attore | C | 7 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=23-311) approvato per ora |
| SC-13 | Player | E | 4, 5 | Comandi nascosti / visibili · titolo non riproducibile | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=18-208) approvato per ora |
| SC-14 | Player · opzioni | E | 4 | Sottotitoli · Audio · Velocità · Transcodifica | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=24-145) approvato per ora |
| SC-15 | Player · Prossimo episodio | E | 3 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=24-260) approvato per ora |
| SC-16 | Aggiorna metadati | F | 11 | Correggi titolo (elenco dei risultati) | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=25-459) approvato per ora |
| SC-17 | Impostazioni | F | 11, 12 | Libreria · Profili · profilo con 18+ e PIN | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=25-517) approvato per ora |
| SC-18 | Cambia immagini | F | 11 | Sfondo · Applico l'immagine… · Nessuna immagine trovata | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=51-10) da approvare |

I casi vuoti e gli errori sono stati della schermata in cui capitano, non schermate a sé.

## Schemi
| Schema | Struttura | Schermate |
|---|---|---|
| A · Vetrina | Immagine a tutto schermo, titolo in evidenza, righe sotto | SC-03 |
| B · Griglia | Menu, titolo della sezione, filtri e ordine, griglia di card | SC-04, SC-05, SC-06, SC-08 |
| C · Scheda | Immagine piena, informazioni e azioni a sinistra, righe sotto (Cast, Altri film, Episodi) | SC-07, SC-10, SC-11, SC-12 |
| D · Cerca | Tastiera a sinistra, filtri e risultati a destra | SC-09 |
| E · Player | Video a tutto schermo con livelli sopra: comandi, opzioni, prossimo episodio | SC-13, SC-14, SC-15 |
| F · Centrata o a pannelli | Scelte al centro (profili, PIN) o elenco a sinistra e dettaglio a destra | SC-01, SC-02, SC-16, SC-17, SC-18 |

Wireframe: file Mockup, pagina **Wireframe TV**: una riga per schermata, con gli stati affiancati a destra, e sotto ogni frame le note su fuoco e comandi. Il 2026-10-08 prima le 6 di riferimento (approvate), poi le altre 11 e tutti gli stati: 34 frame.
