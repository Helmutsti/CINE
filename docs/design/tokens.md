# Tokens

I componenti usano solo token semantici. I token vivono come variabili nella libreria Figma (collezioni **Primitivi**, nascosta alla pubblicazione; **Colore**, per ora con il solo modo Scuro; **Dimensioni**), più gli stili di testo, di colore (sfumature) e di effetto (elevazione). Nel codice: i semantici che esistono già portano il nome CSS di oggi nel campo WEB della variabile; gli altri nomi sono rinviati con il codice.

## Primitivi
Non si usano direttamente nei componenti. Collezione **Primitivi** (`VariableCollectionId:3:2`, modo *Valore*), nascosta alla pubblicazione, ambiti vuoti. Tavola dei campioni: pagina Token, nodo `3:21`. Origine: recupero R3a del 2026-10-08 (vedi `registro.md`).

### Colore
| Token | Valore | Origine |
|---|---|---|
| `grigio/950` | #0c0c0d | `--bg-player` |
| `grigio/925` | #0f1012 | `--bg`; assorbe `--on-light` (#101114) |
| `grigio/875` | #17181b | `--surface` |
| `grigio/850` | #1c1d21 | `--surface-raised` |
| `grigio/800` | #212329 | `--surface-art` |
| `grigio/750` | #2b2e35 | `--surface-active`; assorbe `--line` (#2c2e34) |
| `grigio/600` | #74777e | `--line-strong` (era #3a3d45): almeno 3:1 su tutte le superfici (R3a #65686f, poi schiarito in R3b) |
| `grigio/500` | #878991 | `--text-4` (era #85878f): ≥ 4,5:1 su tutte le superfici tranne `surface-active` (3,9) |
| `grigio/400` | #9a9ca4 | `--text-3` |
| `grigio/300` | #b9bbc2 | `--text-2` |
| `grigio/100` | #eceef2 | `--text` |
| `blu/500` | #4d97ff | `--accent` |
| `blu/800` | #0a4f97 | `--accent-deep` |
| `velo-chiaro/12` | #eceef2 al 12% | Granito `riferimento-14, 15, 16, 18` |
| `velo-chiaro/35` | #eceef2 al 35% | Granito `riferimento-8, 22, 23, 26` |
| `velo-chiaro/72` | #eceef2 al 72% | Granito `riferimento-25, 27` |
| `velo-scuro/55` | #0c0c0d al 55% | Granito `riferimento-21, 28, 29` |
| `vetro/72` | #17181b al 72% | Granito `riferimento-13, 17` |

Scartati: #f5f6f8, #141517 (solo nell'export), ambra #e2a03f (un'icona).

## Semantici · colore
Collezione **Colore** (`VariableCollectionId:5:2`), solo modo **Scuro** (eccezione registrata il 2026-10-08). Ogni token punta a un primitivo. Nome nel codice nel campo WEB della variabile. Tavola: pagina Token, nodo `5:26`.

| Token | → Primitivo (Scuro) | Codice | Ambito | Uso |
|---|---|---|---|---|
| `colore/sfondo/schermata` | grigio/925 | `--bg` | riempimenti | Fondo di ogni schermata |
| `colore/sfondo/player` | grigio/950 | `--bg-player` | riempimenti | Fondo del player |
| `colore/superficie/base` | grigio/875 | `--surface` | riempimenti | Menu laterale, pannelli |
| `colore/superficie/rialzata` | grigio/850 | `--surface-raised` | riempimenti | Pulsanti secondari, badge |
| `colore/superficie/artwork` | grigio/800 | `--surface-art` | riempimenti | Riquadri delle copertine vuoti |
| `colore/superficie/attiva` | grigio/750 | `--surface-active` | riempimenti | Voce attiva del menu |
| `colore/superficie/vetro` | vetro/72 | da decidere (R3e) | riempimenti | Menu e pulsanti sopra un'immagine |
| `colore/bordo/divisore` | grigio/750 | `--line` | contorni | Divisori (decorativi) |
| `colore/bordo/controllo` | grigio/600 | `--line-strong` | contorni | Contorno dei controlli |
| `colore/bordo/su-immagine` | velo-chiaro/12 | da decidere (R3e) | contorni | Contorni sopra un'immagine |
| `colore/testo/primario` | grigio/100 | `--text` | testo | Titoli, testo principale |
| `colore/testo/secondario` | grigio/300 | `--text-2` | testo | Sinossi, metadati |
| `colore/testo/terziario` | grigio/400 | `--text-3` | testo | Etichette, icone a riposo |
| `colore/testo/tenue` | grigio/500 | `--text-4` | testo | Numeri, dettagli minori; mai su `superficie/attiva` |
| `colore/testo/su-chiaro` | grigio/925 | `--on-light` | testo | Testo sul pulsante chiaro |
| `colore/testo/su-immagine` | velo-chiaro/72 | da decidere (R3e) | testo | Tempi del player, sottotitoli sopra le immagini |
| `colore/accento/base` | blu/500 | `--accent` | riempimenti, contorni | Selezione e avanzamento, nient'altro |
| `colore/accento/profondo` | blu/800 | `--accent-deep` | riempimenti | Fondo accento sotto testo chiaro |
| `colore/velo/traccia` | velo-chiaro/35 (era /12, schiarito il 2026-10-10) | da decidere (R3e) | riempimenti | Binario delle barre di avanzamento |
| `colore/velo/indicatore` | velo-chiaro/35 | da decidere (R3e) | riempimenti | Indicatori inattivi |
| `colore/velo/scrim` | velo-scuro/55 | da decidere (R3e) | riempimenti | Velo dietro i pannelli del player |
| `colore/focus/anello` | grigio/100 | `--focus-ring` (ombra composta nel codice) | contorni, effetti | Anello del focus |
| `colore/focus/anello-accento` | blu/500 | `--focus-ring-accent` (ombra composta) | contorni, effetti | Anello del focus su accento |
| `colore/controllo/chiaro` | grigio/100 | rinviato | riempimenti | Fondo del pulsante chiaro (azione principale), testo `testo/su-chiaro`. Aggiunto il 2026-10-08 (Sala) |
| `colore/ombra/sollevata` | velo-scuro/55 | rinviato | colore effetti | Ombra della card sollevata a fuoco. Aggiunto il 2026-10-08 (Sala) |

## Spazi
Ogni spazio ha un ruolo e il ruolo ha un solo valore. Più il legame è stretto, meno spazio c'è (guida §6.4).

Primitivi (R3d, 2026-10-08): `spazio/0, 4, 8, 12, 16, 24, 32, 48, 64, 96`. Gli spazi per ruolo (margini di elenco, pannello, finestra; gap per legame) nascono in R4 con i primi componenti, dall'inventario dei ruoli. Tavola: pagina Token, nodo `10:30`.

| Token | → Primitivo | Codice | Ruolo |
|---|---|---|---|
| `spazio/schermata/margine` | spazio/96 | `--gutter` | Margine orizzontale della schermata |
| `spazio/riga/gap` | spazio/48 | `--rail-gap` | Distanza fra le card di una riga e di una griglia. Era spazio/24: la card ingrandita a fuoco toccava le vicine (2026-10-10) |
| `spazio/controllo/verticale` | spazio/16 | rinviato | Padding sopra e sotto dei controlli alti una riga |
| `spazio/controllo/orizzontale` | spazio/32 | rinviato | Padding laterale dei controlli |
| `spazio/gap/icona` | spazio/12 | rinviato | Icona e testo che si leggono come una cosa sola |
| `spazio/menu/gap` | spazio/16 | rinviato | Distanza fra le voci del menu in alto. Era spazio/8: le pillole sembravano toccarsi (2026-10-10) |
| `spazio/menu/margine` | spazio/12 | rinviato | Margine interno della pillola del menu in alto (era 8; scelta C del 2026-10-10: pillola alta 84) |
| `spazio/voce/orizzontale` | spazio/24 | rinviato | Padding laterale della voce del menu |
| `spazio/card/testo` | spazio/12 | rinviato | Dall'immagine della card al titolo sotto |
| `spazio/card/meta` | spazio/4 | rinviato | Dal titolo della card alla riga meta |
| `spazio/badge/verticale` | spazio/4 | rinviato | Padding sopra e sotto dell'Etichetta tecnica |
| `spazio/badge/orizzontale` | spazio/8 | rinviato | Padding laterale dell'Etichetta tecnica |
| `spazio/card/interno` | spazio/16 | rinviato | Margine dentro l'immagine della card (barra, nome della collezione) |
| `spazio/interruttore/margine` | spazio/4 | rinviato | Dal bordo dell'Interruttore al pomello (CMP-15) |
| `spazio/elenco/margine` | spazio/16 | rinviato | Margine interno del Menu a tendina (CMP-17), ruolo Elenco (2026-10-10) |
| `spazio/elenco/gap` | spazio/8 | rinviato | Distanza fra le voci del Menu a tendina (CMP-17) (2026-10-10) |
| `spazio/tasto-player/grande` | spazio/24 | rinviato | Margine interno del tasto grande del player: 24 + icona 36 + 24 = 84 (2026-10-11) |
| `spazio/tasto-player/piccolo` | spazio/12 | rinviato | Margine interno dei tasti piccoli del player: 12 + icona 24 + 12 = 48 (2026-10-11) |
| `spazio/azioni/gap` | spazio/16 | `--sp-16` | Fra i pulsanti di una fila di azioni (scheda, finestre, tasti del player) e fra le parti della riga sotto il titolo (2026-10-11) |
| `spazio/scelte/gap` | spazio/12 | rinviato | Fra le pillole Scelta (CMP-11) di una fila (2026-10-11) |
| `spazio/gruppo/gap` | spazio/8 | `--sp-gruppo-gap` | Fra le voci del Gruppo di pulsanti (CMP-18), 2026-10-16 |
| `spazio/gruppo/margine` | spazio/4 | `--sp-gruppo-margine` | Dal bordo del Gruppo di pulsanti alle voci (CMP-18), 2026-10-16 |
| `spazio/scelte/righe` | spazio/24 | `--sp-24` | Fra le righe di scelte del player (Sottotitoli, Impostazioni) (2026-10-11) |
| `spazio/scelte/etichetta` | spazio/32 | rinviato | Dall'etichetta di una riga di scelte alle sue pillole (2026-10-11) |
| `spazio/pannello/margine` | spazio/64 | `--sp-64` | Margine interno dei pannelli laterali (trama) (2026-10-11) |
| `spazio/pannello/gap` | spazio/24 | `--sp-24` | Fra i blocchi di un pannello laterale (2026-10-11) |
| `spazio/finestra/margine` | spazio/48 | `--sp-48` | Margine interno delle finestre (2026-10-11) |
| `spazio/finestra/gap` | spazio/16 | `--sp-16` | Fra titolo, testo e contenuto di una finestra (2026-10-11) |
| `spazio/testo/gap` | spazio/12 | rinviato | Fra blocchi di testo vicini (i crediti della trama) (2026-10-11) |
| `spazio/tavola/margine` · `/gap` · `/nota` | spazio/64 · 32 · 8 | — | Solo nelle schede dei wireframe del Mockup (documentazione): margine della scheda, distanza fra titolo, schermata e nota, righe della nota (2026-10-11) |

## Semantici · dimensioni e movimento
Primitivi: `misura/1,5, 2, 3, 28, 32, 40, 60, 72, 96, 104, 160, 200` (1,5, 2 e 28 aggiunti il 2026-10-08; 32, 40, 72, 96, 160 e 200 il 2026-10-09); `raggio/10, 12, 14, 16, 20, 999` (16 aggiunto il 2026-10-09). Scartati da Granito i raggi 16, 22, 34 e i raggi a mano (30, 28,5, 24,5…, che erano pillole).

| Token | → Primitivo | Codice | Uso |
|---|---|---|---|
| `misura/menu-laterale` | misura/104 | `--sidebar-w` | Larghezza del menu laterale chiuso |
| `misura/icona` | misura/28 | rinviato | Dimensione delle icone (set Icona/) |
| `misura/focus/distanza` | spazio/4 | rinviato | Distanza fra il bordo di fuoco e l'elemento a fuoco |
| `misura/bordo/spessore` | misura/1,5 | rinviato | Contorni sottili dei controlli (pulsante Secondario e Solo icona) |
| `misura/icona-slot` | misura/60 | `--icon-slot` | Spazio di un'icona nel menu; altezza delle voci del menu e del pulsante Solo icona |
| `misura/focus/spessore` | misura/2 | dentro `--focus-ring` (oggi 3 nel codice: rinviato) | Spessore del bordo di fuoco. Era misura/3; 2 px dal 2026-10-08 (regola 3 della Sala) |
| `misura/tasto` | misura/72 | rinviato | Altezza del Tasto (CMP-12) |
| `misura/campo` | misura/72 | rinviato | Altezza del Campo di testo (CMP-14) |
| `misura/pin` | misura/96 | rinviato | Lato della Casella del PIN (CMP-13) |
| `misura/punto` | spazio/16 | rinviato | Punto della cifra inserita nella Casella del PIN (CMP-13) |
| `misura/cursore` | misura/2 | rinviato | Spessore del cursore del Campo di testo (CMP-14); l'altezza è `misura/icona` |
| `misura/interruttore/larghezza` | misura/72 | rinviato | Larghezza dell'Interruttore (CMP-15) |
| `misura/interruttore/altezza` | misura/40 | rinviato | Altezza dell'Interruttore (CMP-15) |
| `misura/interruttore/pomello` | misura/32 | rinviato | Diametro del pomello dell'Interruttore (CMP-15) |
| `misura/voce` | misura/72 | rinviato | Altezza minima della Voce di elenco (CMP-16) e altezza della sua locandina |
| `misura/avatar/piccolo` | misura/48 (primitivo nuovo) | rinviato | Lato dell'Avatar piccolo, la foto nel menu in alto (scelta C, 2026-10-10) |
| `misura/avatar/ritratto` | misura/240 (primitivo nuovo) | `--avatar-ritratto` | Larghezza dell'Avatar Ritratto, Chi guarda? (SC-01), 2026-10-16 |
| `misura/avatar/ritratto/altezza` | misura/360 (primitivo nuovo) | rinviato (nel codice `aspect-ratio: 2 / 3`) | Altezza dell'Avatar Ritratto, 1,5 × la larghezza, 2026-10-16 |
| `misura/avatar` | misura/160 | rinviato | Lato dell'Avatar del profilo grande (CMP-08). Era misura/200, troppo grande (2026-10-10) |
| `misura/cast` | misura/160 | rinviato | Lato della foto della Persona del cast (CMP-09) |
| `misura/avanzamento` | spazio/4 | rinviato | Spessore della barra di avanzamento (CMP-07) |
| `misura/icona/grande` | misura/36 (primitivo nuovo) | rinviato | Icona del tasto grande del player (pausa / play) (2026-10-11) |
| `misura/icona/piccola` | misura/24 (primitivo nuovo) | rinviato | Icona dei tasti piccoli del player (2026-10-11) |
| `raggio/card/fuoco` | raggio/16 | rinviato | Bordo di fuoco della card: `raggio/card` 12 + `misura/focus/distanza` 4, parallelo alla card |
| `raggio/pillola` | raggio/999 | `--r-pill` | Controlli alti una riga |
| `raggio/badge` | raggio/10 | `--r-badge` | Badge |
| `raggio/card` | raggio/12 | `--r-card` | Card, evidenziazioni |
| `raggio/pannello` | raggio/14 | `--r-panel` | Pannelli |
| `raggio/finestra` | raggio/20 | da decidere (R3e) | Finestre e pannelli grandi; con margine 8 il raggio interno è 12 = `raggio/card` |

### Movimento
Figma non ha variabili per scala e durata: i valori vivono qui e nelle tavole, nel codice quando lo si riprende.

| Token | Valore | Uso |
|---|---|---|
| `movimento/fuoco/scala` | 1,10 | Ingrandimento dell'elemento a fuoco (regola 3 della Sala) |
| `movimento/fuoco/durata` | 150 ms | Passaggio del fuoco da un elemento all'altro |
| `movimento/fuoco/attenuata` | 0,55 | Luminosità delle immagini vicine a quella in fuoco (`--fuoco-attenuata`), 2026-10-16 |
| `movimento/gruppo/durata` | 380 ms | Il fondo del Gruppo di pulsanti scivola alla nuova voce (`--gruppo-durata`), 2026-10-16 (era 300: poco evidente) |
| `movimento/gruppo/curva` | cubic-bezier(0,34; 1,35; 0,64; 1) | Arriva con un piccolo rimbalzo (`--gruppo-curva`), 2026-10-16 |

Altre durate si definiscono quando servono, in R4.

## Tipografia
Scala per la TV "B" (2026-10-10): nessun testo sotto 20, i testi piccoli in Medium. Primitivi nuovi `corpo/28` e `corpo/40`; `corpo/14, 16, 17, 19, 21` non più usati.

Stili di testo per ruolo. Nessun testo senza stile. Famiglia unica **Instrument Sans**, pesi Regular (400) e Medium (500). Tavola: pagina Token, nodo `9:51`. Decisa in R3c, 2026-10-08.

Variabili:
- **Primitivi:** `corpo/14, 16, 17, 18, 19, 20, 21, 22, 24, 26, 32, 56, 68, 104`; `peso/regolare` 400, `peso/medio` 500; `famiglia/instrument-sans`.
- **Dimensioni** (`VariableCollectionId:9:2`): `testo/famiglia` (`--font`), `testo/peso/regolare`, `testo/peso/medio`, `testo/corpo/<ruolo>`, che puntano ai primitivi. Corpo, famiglia e peso degli stili sono collegati a queste variabili. Interlinea e spaziatura sono in percentuale e Figma non le collega a variabili: vivono nello stile.

| Stile | Corpo | Peso | Interlinea | Spaziatura | Codice | Uso |
|---|---|---|---|---|---|---|
| `Titolo/Scheda` | 104 | Regular | 95% | −5% | `--t-display` | Titolo nella scheda film/serie |
| `Titolo/In evidenza` | 68 | Regular | 100% | −4,5% | `--t-hero` | Titolo in evidenza in Home |
| `Titolo/Pagina` | 56 | Regular | 100% | −4% | da decidere (R3e) | Titolo di ogni pagina |
| `Titolo/Sezione` | 40 | Medium | 120% | −2,5% | `--t-h2` | Titolo di sezione |
| `Titolo/Riga` | 32 | Medium | 120% | 0 | `--t-h3` | Titolo di una riga di card |
| `Testo/Sinossi` | 28 | Regular | 155% | 0 | `--t-lead` | Trama nella scheda |
| `Controllo/Pulsante` | 26 | Medium | 120% | 0 | `--t-lg` | Testo dei pulsanti |
| `Card/Titolo` | 26 | Medium | 120% | 0 | `--t-md` | Titolo delle card |
| `Etichetta` | 24 | Medium | 120% | 0 | da decidere (R3e) | Tasti, etichette, nomi del cast |
| `Card/Titolo piccolo` | 24 | Medium | 120% | −1,5% | da decidere (R3e) | Titoli nei risultati di ricerca |
| `Meta` | 24 | Regular | 130% | 0 | `--t-sm` | Metadati, "Mostra tutto" |
| `Meta/Card` | 22 | Regular | 130% | 0 | `--t-base` | Metadati nelle card (assorbe il 16 di Granito) |
| `Occhiello` | 20 | Medium | 120% | +12%, MAIUSCOLO | da decidere (R3e) | Occhielli |
| `Didascalia` | 22 | Medium | 130% | 0 | `--t-xs` | Didascalie, testi dei riquadri immagine |

Nel codice `--t-sm` (18) è più grande di `--t-base` (17): i nomi CSS si rivedono in R3e.

## Ombre ed elevazione
| Stile | Valore | Uso |
|---|---|---|
| `Elevazione/Sollevata` (stile effetto) | Ombra 0 / 24, sfocatura 48, colore `colore/ombra/sollevata` | Card sollevata a fuoco |
| `Elevazione/Barra` (stile effetto) | Contorno d'ombra 1,5 + due ombre 0 / 2, sfocatura 12, colore `colore/ombra/sollevata` | Sotto la Barra di avanzamento, per staccarla dalle immagini chiare (2026-10-10) |

## Sfumature
Stili di colore: le variabili non possono essere sfumature. Il colore è `grigio/925` scritto nello stile, perché Figma azzera la trasparenza se la fermata è legata alla variabile.

| Stile | Valore | Uso |
|---|---|---|
| `Sfumatura/Immagine in basso` | grigio/925 da 0% (al 35%) a 100% (al 92%), verso il basso | Sopra le immagini a tutto schermo |
| `Sfumatura/Immagine a sinistra` | grigio/925 da 75% a 0%, verso destra | Dietro il testo del titolo in evidenza |
| `Sfumatura/Immagine in alto` | grigio/925 da 60% a 0%, verso il basso | Dietro il menu in alto, sopra le immagini |
| `Sfumatura/Avanzamento` | grigio/950 da 0% (a metà) a 85% (in fondo), verso il basso | Sotto la barra di avanzamento della card, perché si veda sulle immagini chiare. Aggiunto il 2026-10-10 |
| `Sfumatura/Card` | grigio/950 da 0% (a metà) a 70% (in fondo), verso il basso | Sotto il testo scritto sull'immagine di una card (nome della Collezione): la card non si fonde con lo sfondo. Aggiunto il 2026-10-09 |

## Scala z-index
| Livello | Token | Uso |
|---|---|---|
| 0 | | Contenuto base |

Da definire in R4, con i primi componenti sovrapposti (menu, pannelli del player).

## Fondi dei controlli sulle superfici
Un fondo di controllo non è mai uguale a una superficie su cui può comparire, in nessun tema.

Si compila in R4, componente per componente.

## Verifica contrasti
Almeno WCAG AA: 4,5:1 per il testo, 3:1 per icone e contorni.

Calcolati da script sui valori risolti (2026-10-08). ✕ = sotto soglia.

| Superficie (Scuro) | testo/primario | testo/secondario | testo/terziario | testo/tenue | accento/base | bordo/controllo |
|---|---|---|---|---|---|---|
| sfondo/schermata | 16,39 | 9,93 | 6,95 | 5,45 | 6,51 | 4,24 |
| sfondo/player | 16,83 | 10,20 | 7,14 | 5,60 | 6,69 | 4,36 |
| superficie/base | 15,28 | 9,26 | 6,48 | 5,09 | 6,08 | 3,96 |
| superficie/rialzata | 14,50 | 8,78 | 6,15 | 4,83 | 5,76 | 3,75 |
| superficie/artwork | 13,52 | 8,19 | 5,73 | 4,50 | 5,37 | 3,50 |
| superficie/attiva | 11,70 | 7,09 | 4,96 | 3,89 ✕ | 4,65 | 3,03 |

Testo chiaro su `accento/profondo`: 7,01. Su `accento/base`: 2,52 ✕ (non usare).
