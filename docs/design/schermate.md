# Schermate

Il disegno vive in Figma, nel file dei mockup (link in `AGENTS.md`). Qui c'è tutto ciò che è una decisione. Le esportazioni stanno in `immagini/`, con il nome del codice. Le schermate nascono dai flussi di `flussi.md` (approvate il 2026-10-08). Superficie principale: TV, 1920 × 1080.

| Codice | Schermata | Schema | Flussi | Stati da disegnare | Stato |
|---|---|---|---|---|---|
| SC-01 | Scelta profilo | F | 0 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=18-240) approvato per ora |
| SC-02 | PIN | F | 0, 12 | PIN sbagliato | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-64) approvato per ora |
| SC-03 | Home | A | 1, 2 | Sezioni: Hero · Hero con menu laterale aperto · Continua a guardare · Continua a guardare, carosello in fuoco · Collezioni (pillbar in fuoco) · Collezioni, pulsanti in fuoco · Collezioni, locandine in fuoco · La mia lista · La mia lista, card in fuoco · Intero catalogo (ordinamento in fuoco) · Intero catalogo, card in fuoco · La mia lista vuota (da disegnare) · Libreria vuota (da ridisegnare) | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=118-486) a sezioni, da approvare |
| SC-04 | Film | B | 10 | Filtri aperti | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=17-81) approvato per ora |
| SC-05 | Serie | B | 10 | Filtri aperti | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-142) approvato per ora |
| SC-06 | Collezioni | B | 9 | Nuova collezione (prima card, con il permesso) | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-382) approvato per ora |
| SC-07 | Pagina collezione | C | 9 | Collezione appena creata (Cerca, Suggeriti) · Menu Modifica aperto · Elimina | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=23-349) approvato per ora · **superata il 2026-10-16**: la Pagina collezione è la sezione Collezioni della Home (SC-03); il menu Modifica resta |
| SC-08 | La mia lista | B | 8 | Lista vuota | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=22-222) approvato per ora |
| SC-09 | Cerca | D | 6 | Nessun risultato · filtri attivi | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=18-70) approvato per ora |
| SC-10 | Scheda film | C | 2, 5, 7, 8, 11 | Titolo già iniziato · menu "Altro" aperto · Trama (Leggi altro) · Aggiungi a collezione | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=17-158) approvato per ora |
| SC-11 | Scheda serie | C | 3 | Stagione scelta | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=23-212) approvato per ora |
| SC-12 | Pagina attore | C | 7 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=23-311) approvato per ora |
| SC-13 | Player | E | 4, 5 | Menu (tasti a destra della barra) · Capitoli (↑) · titolo non riproducibile | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=57-98) approvato per ora |
| SC-14 | Player · Sottotitoli e Impostazioni | E | 4 | Sottotitoli · Impostazioni (Audio, Qualità, Velocità), righe di scelte sopra la barra | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=63-207) approvato per ora |
| SC-15 | Player · Prossimo episodio | E | 3 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=24-260) approvato per ora |
| SC-16 | Aggiorna metadati | F | 11 | Correggi titolo (elenco dei risultati) | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=25-459) approvato per ora |
| SC-17 | Impostazioni | F | 11, 12 | Libreria · Profili · profilo con 18+ e PIN | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=25-517) approvato per ora |
| SC-18 | Cambia immagini | F | 11 | Sfondo · Applico l'immagine… · Nessuna immagine trovata · Collezione, dai film | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=51-10) da approvare |
| SC-19 | Rinomina la collezione | D | 9 | — | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=83-307) da approvare |
| SC-20 | Titoli della collezione (Cerca) | D | 9 | Collezione vuota · ricerca | [Wireframe](https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9?node-id=83-447) da approvare |

I casi vuoti e gli errori sono stati della schermata in cui capitano, non schermate a sé.

## Schemi
| Schema | Struttura | Schermate |
|---|---|---|
| A · Vetrina | Pila di sezioni a tutta pagina (Hero · Continua a guardare · Collezioni · La mia lista · Intero catalogo), ciascuna con livelli interni; menu laterale a sinistra | SC-03 |
| B · Griglia | Menu, titolo della sezione, filtri e ordine, griglia di card | SC-04, SC-05, SC-06, SC-08 |
| C · Scheda | Immagine piena, informazioni e azioni a sinistra, righe sotto (Cast, Altri film, Episodi) | SC-07, SC-10, SC-11, SC-12 |
| D · Cerca | Tastiera a sinistra, filtri e risultati a destra | SC-09 |
| E · Player | Video a tutto schermo con livelli sopra: comandi, opzioni, prossimo episodio | SC-13, SC-14, SC-15 |
| F · Centrata o a pannelli | Scelte al centro (profili, PIN) o elenco a sinistra e dettaglio a destra | SC-01, SC-02, SC-16, SC-17, SC-18 |

Wireframe: file Mockup, pagina **Wireframe TV**, divisa in sezioni per area (dal 2026-10-16): in alto Avvio · Home · Sfogliare · Collezioni, sotto Schede · Player · Impostazioni. Nella sezione una riga per schermata, con gli stati affiancati a destra, e sotto ogni frame le note su fuoco e comandi. Il 2026-10-08 prima le 6 di riferimento (approvate), poi le altre 11 e tutti gli stati: 34 frame.
