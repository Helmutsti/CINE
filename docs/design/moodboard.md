# Moodboard

Il moodboard e le direzioni vivono nel file Figma della libreria: pagine **Moodboard** e **Direzioni** (link in `AGENTS.md`).

## Parole chiave del brand
*Proposta dell'agente, da confermare:* **essenziale · cinematografica · immersiva**.

Indicazioni dell'utente (2026-10-08): mood Disney+, Apple TV, Netflix; soprattutto menu minimi e semplici; "bello da vedere"; la direzione di Granito non dispiace, si lavora su alternative.

## Tono di voce
[Come parla l'interfaccia, in due righe.]

| Sì | No |
|---|---|
| [esempio] | [esempio] |

## Direzioni valutate
| Direzione | Riferimenti | Pro | Contro |
|---|---|---|---|
| ~~A · Granito, ma vivo~~ (scartata il 2026-10-08) | Disney+ · [frame](https://www.figma.com/design/eYNqEwanEOjEg1AvAuvqaE?node-id=17-2) | La più vicina a Granito; barra di icone già nota; fuoco ad anello, il più leggibile a distanza | La meno nuova |
| B · Sala | Apple TV · [frame](https://www.figma.com/design/eYNqEwanEOjEg1AvAuvqaE?node-id=18-2) | La più immersiva; menu di sole parole in alto | Serve una buona immagine per ogni titolo; il fuoco con la sola ombra si vede poco sul fondo scuro |
| C · Locandina | Netflix · [frame](https://www.figma.com/design/eYNqEwanEOjEg1AvAuvqaE?node-id=19-2) | Menu invisibile finché non serve; la card a fuoco porta già le informazioni | La più complessa da muovere col telecomando (le card cambiano larghezza) |

Vincoli comuni: tema scuro, Instrument Sans, solo token della Libreria, niente sfocature (hardware datato), fuoco leggibile da 3 metri. Le immagini delle tavole sono generate e servono solo come prova (`immagini/prove/`).

**Direzione scelta:** B · Sala (2026-10-08, scelta dell'utente; vedi `registro.md`).

## Regole visive della direzione
Regole decise dopo la scelta della direzione. Diventano token in `tokens.md`.

| # | Regola | Si applica a |
|---|---|---|
| 1 | L'immagine del titolo in evidenza riempie lo schermo; il testo sta in basso a sinistra, sopra una sfumatura | Home, schede film e serie |
| 2 | Il menu è una pillola di sole parole in alto al centro, al massimo 5 voci più la ricerca; sparisce scendendo alle righe e torna con ↑ | Tutte le schermate principali |
| 3 | Fuoco: l'elemento si solleva (+10%) e prende un bordo chiaro di 2 px; gli altri restano pieni, senza velo. Voci del menu: la voce a fuoco diventa una pillola chiara (2026-10-08) | Card, pulsanti, voci del menu |
| 4 | Il titolo compare solo sotto la card a fuoco; le altre mostrano solo l'immagine | Righe di card |
| 5 | Nessuna sfocatura: il vetro è un colore semitrasparente pieno | Menu, pulsanti sopra le immagini |
| 6 | L'accento blu serve solo per avanzamento e selezione | Tutto |

Tavola: pagina Moodboard, nodo `21:2`. Le direzioni scartate A e C sono nella pagina Prove.
