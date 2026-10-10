# Componenti

I componenti vivono nella libreria Figma: pagina **Componenti base** e pagina **Componenti composti**, con la sezione **Parti interne** (link in `AGENTS.md`). Ogni componente usa solo token semantici e ha un'anteprima in modo scuro.

| Codice | Componente | Tipo | Stato |
|---|---|---|---|
| — | Icona/ (cerca, play, piu, info, impostazioni, spunta, cancella, freccia-giu, pausa, matita) | base | Disegnato (2026-10-08; pausa e matita 2026-10-10), da approvare |
| CMP-01 | Pulsante | base | Disegnato (2026-10-08), da approvare |
| CMP-02 | Voce del menu | parte interna | Disegnato (2026-10-08), da approvare |
| CMP-03 | Menu in alto | composto | Aggiornato (2026-10-10): voci Cerca · Home · Film · Serie · Collezioni · La mia lista e la foto del profilo dentro la pillola |
| CMP-04 | Card (Orizzontale, Locandina, Episodio, Collezione) | base | Approvato (2026-10-09) |
| CMP-05 | Riga di card | composto | Da disegnare |
| CMP-06 | Titolo in evidenza | composto | Da disegnare |
| CMP-07 | Barra di avanzamento | base | Approvato (2026-10-09) |
| CMP-08 | Avatar del profilo (Piccolo, Grande) | base | Approvato (2026-10-09) |
| CMP-09 | Persona del cast | base | Approvato (2026-10-09) |
| CMP-10 | Etichetta tecnica | base | Approvato (2026-10-09) |
| CMP-11 | Scelta | base | Approvato (2026-10-09) |
| CMP-12 | Tasto (Testo, Icona) | base | Approvato (2026-10-09) |
| CMP-13 | Casella del PIN | base | Approvato (2026-10-09) |
| CMP-14 | Campo di testo | base | Approvato (2026-10-09) |
| CMP-15 | Interruttore | base | Disegnato (2026-10-09), da approvare |
| CMP-16 | Voce di elenco (Semplice, Con dettaglio, Con locandina, Con interruttore) | base | Disegnato (2026-10-09), da approvare |
| CMP-17 | Menu a tendina (con la parte interna Intestazione del menu) | composto | Disegnato (2026-10-10), da approvare |

Inventario dai wireframe (approvato il 2026-10-09), ancora da disegnare. Composti: Intestazione di sezione, Tastiera a schermo e tastierino del PIN, Finestra, Comandi del player e pannello opzioni, Riquadro Prossimo episodio, Stato vuoto. Da rivedere: CMP-03 (voci Collezioni e La mia lista, immagine del profilo al posto dell'ingranaggio).

### Parti interne
- CMP-02 Voce del menu (pagina Componenti composti, sezione Parti interne): pezzo del CMP-03 Menu in alto.

### Spazi dei contenitori
| Ruolo | Token | Valore | Dove |
|---|---|---|---|
| Controllo alto una riga | `spazio/controllo/verticale` · `spazio/controllo/orizzontale` | 16 · 32 | Pulsante |
| Icona e testo | `spazio/gap/icona` | 12 | Pulsante |
| Voce del menu | altezza `misura/icona-slot` · `spazio/voce/orizzontale` | 60 · 24 | Voce del menu |
| Fra le voci del menu | `spazio/menu/gap` | 16 | Menu in alto (le voci non si toccano) |
| Margine della pillola del menu | `spazio/menu/margine` | 8 | Menu in alto |
| Dall'immagine al titolo sotto | `spazio/card/testo` | 12 | Card |
| Dal titolo alla riga meta | `spazio/card/meta` | 4 | Card |
| Margine dentro l'immagine | `spazio/card/interno` | 16 | Card (barra, nome della collezione) |
| Etichetta tecnica | `spazio/badge/verticale` · `spazio/badge/orizzontale` | 4 · 8 | Etichetta tecnica |
| Voce di elenco | altezza minima `misura/voce` · `spazio/controllo/verticale` · `spazio/voce/orizzontale` | 72 · 16 · 24 | Voce di elenco; gap `spazio/gap/icona`, fra le due righe `spazio/card/meta` |
| Pomello nel binario | `spazio/interruttore/margine` | 4 | Interruttore |

### Superfici su cui compare ogni componente
| Componente | Immagine a tutto schermo | sfondo/schermata | superficie/base | Fondi propri |
|---|---|---|---|---|
| Pulsante Principale | ✓ | ✓ | ✓ | `controllo/chiaro` |
| Pulsante Secondario, Solo icona | ✓ | ✓ (con il contorno) | ✓ (con il contorno) | `superficie/vetro` + contorno `bordo/su-immagine` |

---

## Icona/
**Tipo:** base · **Figma:** pagina Componenti base, sezione Icone (`24:14` cerca, `24:18` play, `24:22` piu, `24:29` info, `24:36` impostazioni, `46:54` spunta, `47:59` cancella, `50:65` freccia-giu)

Un set di componenti per icona, variante `Dimensione=28` (`misura/icona`). `Icona/pausa` (`59:60`, 2026-10-10): due barre arrotondate, tratto 5, sul modello di play; serve al pulsante play/pausa del player. `Icona/matita` (`60:63`, 2026-10-10): il pulsante delle azioni sul titolo nella scheda (apre Aggiorna metadati), al posto di "···". Un solo tracciato per icona, chiamato `tratto`, con il colore legato a una variabile (di base `colore/testo/primario`). Il colore si cambia sul `tratto`; quando si scambia l'icona il colore resta. Tratto 2 px a 28; `play` è un triangolo pieno arrotondato; `impostazioni` è un ingranaggio con i denti (il primo disegno, un cerchio con 8 raggi, si leggeva come un sole).

---

## CMP-01 – Pulsante
**Tipo:** base · **Usato in:** nessuna schermata ancora · **Figma:** pagina Componenti base, set `25:45`

**Aggiornamento 2026-10-10:** proprietà **Icona dopo** (scambio, di base `Icona/freccia-giu`) e **Mostra icona dopo** (spenta di base) nei tipi con testo: servono a "Ordina e filtra ⌄". Nuovi stati del Secondario: **Acceso** e **Acceso focus** (fondo `superficie/attiva`): il pulsante dei filtri quando un filtro è attivo.

**Scopo:** avviare un'azione con il telecomando.
**Quando usarlo:** azioni del titolo in evidenza e delle schede (Riproduci, La mia lista, Dettagli), Impostazioni.
**Quando non usarlo:** per navigare fra sezioni (si usa la Voce del menu); per aprire un titolo (si usa la Card).

### Varianti e dimensioni
- **Tipo:** Principale (fondo `controllo/chiaro`, testo `testo/su-chiaro`; una sola per schermata), Secondario (fondo `superficie/vetro`, contorno `bordo/su-immagine` di `misura/bordo/spessore`, testo `testo/primario`), Solo icona (tondo 60, stesso fondo e contorno; icona di base "play", si sceglie dall'istanza), **Solo icona chiaro** (2026-10-10: tondo 60, fondo `controllo/chiaro`, icona `testo/su-chiaro`, senza contorno; Disabilitato come il Solo icona; usato per play/pausa del player). "La mia lista" è un Solo icona con `piu` o `spunta` (come Disney+).
- Una sola dimensione: alto 60 (16 + icona 28 + 16).
- **Proprietà:** Testo, Icona (scambio, preferite le 5 icone), Mostra icona.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover | Come Focus (solo web) |
| Focus | Bordo `colore/focus/anello` di `misura/focus/spessore` (2), a `misura/focus/distanza` (4) dal pulsante. Nel codice anche ingrandimento `movimento/fuoco/scala` 1,10 in 150 ms |
| Attivo | Non previsto: su TV la pressione è istantanea |
| Disabilitato | Fondo `superficie/rialzata`, testo e icona `testo/tenue` |
| Errore | Non previsto: il pulsante non porta errori, li mostra la schermata |
| Caricamento | Non previsto per ora |

### Accessibilità
- **Tastiera / telecomando:** si raggiunge con le frecce, si attiva con OK; il fuoco si vede sempre.
- **Lettori di schermo:** il Solo icona ha sempre un'etichetta (es. "Impostazioni").
- **Contrasti:** Principale 16,39:1 · Secondario sopra fondo scuro ≥ 15:1 · Disabilitato 4,83:1 · bordo di fuoco su sfondo/schermata 16,39:1.

### Esempi
- ✅ Corretto: un Principale "Riproduci" e un Secondario "La mia lista" affiancati sopra l'immagine.
- ❌ Scorretto: due Principali nella stessa schermata.

---

## CMP-02 – Voce del menu
**Tipo:** parte interna · **Usato in:** CMP-03 Menu in alto · **Figma:** pagina Componenti composti, set `29:20`; anteprima sopra un'immagine `29:21`

**Scopo:** una sezione dell'app nella pillola del menu in alto.
**Quando usarlo:** solo dentro il Menu in alto.
**Quando non usarlo:** da sola, o per azioni (si usa il Pulsante).

### Varianti e dimensioni
- **Tipo:** Testo, Icona (Cerca). Tutte alte `misura/icona-slot` (60), come il pulsante; la voce Icona è un tondo 60 × 60 con l'icona da 28 al centro, come il pulsante Solo icona.
- Padding laterale `spazio/voce/orizzontale` 24; contenuto centrato in altezza. Testo `Controllo/Pulsante`.
- **Proprietà:** Testo.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Nessun fondo, testo `testo/secondario` |
| Attiva | La sezione in cui sei: fondo `superficie/attiva`, testo `testo/primario` |
| Hover | Come Focus (solo web) |
| Focus | Pillola chiara: fondo `controllo/chiaro`, testo `testo/su-chiaro`; nel codice anche `movimento/fuoco` |
| Disabilitato | Non previsto: le sezioni ci sono sempre |
| Errore | Non previsto |
| Caricamento | Non previsto |

### Accessibilità
- **Tastiera / telecomando:** ← → fra le voci, ↓ scende al contenuto, OK apre la sezione.
- **Lettori di schermo:** la voce Icona ha l'etichetta "Cerca"; la voce Attiva è annunciata come corrente.
- **Contrasti** (sopra il vetro su fondo scuro): Default `testo/secondario` ≥ 9:1 · Attiva 11,70:1 · Focus 16,39:1.

---

## CMP-03 – Menu in alto
**Tipo:** composto · **Usato in:** tutte le schermate principali (da disegnare) · **Figma:** pagina Componenti composti, sezione Componenti composti, componente `33:12`; anteprima sopra un'immagine `33:33`

**Scopo:** passare da una sezione all'altra (regola 2 della Sala).
**Quando usarlo:** in alto in ogni schermata principale; sparisce quando si scende alle righe e torna con ↑.
**Quando non usarlo:** nel player e nelle finestre.

### Anatomia
- Largo come la schermata, margine laterale `spazio/schermata/margine` (96). Nessun margine sopra e sotto: la distanza dal bordo dello schermo la decide la schermata.
- Al centro la **pillola**: fondo `superficie/vetro`, raggio `raggio/pillola`, margine `spazio/menu/margine` (8), gap `spazio/menu/gap` (8). Dentro, istanze di CMP-02: Cerca (Icona) e al massimo 4 sezioni (Home, Film, Serie, Preferiti). Alta 76.
- A destra **Impostazioni**: CMP-01 Pulsante Solo icona con `Icona/impostazioni`.
- A sinistra un riquadro vuoto largo `misura/icona-slot` come il pulsante, per tenere la pillola al centro esatto della schermata.

### Proprietà
- Le voci e Impostazioni sono istanze esposte: stato (Default, Attiva, Focus) e testo si scelgono dall'istanza del menu.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Una voce Attiva (la sezione in cui sei), le altre Default |
| Focus | Il fuoco è su una voce (pillola chiara) o su Impostazioni (bordo di fuoco) |
| Nascosto | Quando si scende alle righe: nel codice esce verso l'alto in `movimento/fuoco/durata` |
| Disabilitato, Errore, Caricamento | Non previsti |

### Accessibilità
- **Telecomando:** ← → fra le voci e Impostazioni, ↓ al contenuto, ↑ dal contenuto riporta il menu.
- **Lettori di schermo:** è la navigazione principale; la voce Attiva è annunciata come corrente.
- **Contrasti:** come CMP-02 e CMP-01.

---

## CMP-04 – Card
**Tipo:** base · **Usato in:** nessuna schermata ancora (nei wireframe: Home, griglie, schede, Cerca, Pagina attore, Collezioni) · **Figma:** pagina Componenti base, sezione CMP-04 Card, set `41:86`; anteprima `42:56`

**Scopo:** aprire un titolo (film, serie, episodio, collezione) con il telecomando.
**Quando usarlo:** nelle righe e nelle griglie di titoli.
**Quando non usarlo:** per le azioni (si usa il Pulsante); per le persone del cast (Persona del cast).

### Varianti e dimensioni
| Formato | Rapporto | Larghezza dell'anteprima | Testo sotto |
|---|---|---|---|
| Orizzontale | 16:9 | 400 | Solo a fuoco: titolo e meta |
| Locandina | 2:3 | 226 | Solo a fuoco: titolo |
| Episodio | 16:9 | 336 | Sempre: titolo ("E4 · Il lago") e durata (eccezione alla regola 4) |
| Collezione | 16:9 | 416 | Il nome sta sull'immagine, in basso a sinistra (`Titolo/Riga`), sopra `Sfumatura/Card`; a fuoco sotto la meta ("3 film") |

- La larghezza la decide la riga o la griglia; l'immagine tiene il rapporto (bloccato).
- **Immagine:** fondo `superficie/artwork` come segnaposto (l'immagine vera si mette nell'istanza), raggio `raggio/card`, margine interno `spazio/card/interno`.
- **Testi:** titolo `Card/Titolo` `testo/primario`; meta `Meta/Card` `testo/terziario`; a `spazio/card/testo` dall'immagine, fra loro `spazio/card/meta`. I titoli lunghi vanno a capo, non si tagliano.
- **Proprietà:** Formato, Stato, Titolo, Meta, Mostra avanzamento (CMP-07 in fondo all'immagine; spenta di base).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Solo l'immagine (più titolo e durata nell'Episodio) |
| Hover | Come Focus (solo web) |
| Focus | Anello `focus/anello` di `misura/focus/spessore` (2) a `misura/focus/distanza` (4), raggio `raggio/card/fuoco` (16); ombra `Elevazione/Sollevata`; compare il testo sotto. Nel codice anche `movimento/fuoco/scala` 1,10 |
| Disabilitato, Errore, Caricamento | Non previsti: un titolo che non si riproduce lo dice la schermata (SC-13) |

### Accessibilità
- **Telecomando:** frecce per spostarsi, OK apre la scheda (o il player, nella riga Riprendi).
- **Lettori di schermo:** si legge sempre il titolo, anche quando non è mostrato sotto la card.
- **Contrasti:** titolo su `sfondo/schermata` 16,39:1, meta 6,95:1; anello 16,39:1.

---

## CMP-07 – Barra di avanzamento
**Tipo:** base · **Usato in:** CMP-04 Card; poi Comandi del player · **Figma:** pagina Componenti base, componente `41:12`

**Scopo:** mostrare quanto di un titolo è già stato visto.
- Binario `velo/traccia`, riempimento `accento/base` (regola 6), raggio `raggio/pillola`, alta `misura/avanzamento` (4), larga quanto il contenitore. Ombra `Elevazione/Barra` (2026-10-10): sulle immagini chiare si vedeva poco. La lunghezza del riempimento si regola nell'istanza.
- Stati: nessuno (non riceve il fuoco).

---

## CMP-08 – Avatar del profilo
**Tipo:** base · **Usato in:** CMP-03 Menu in alto (da rivedere), SC-01 Scelta profilo · **Figma:** pagina Componenti base, set `44:78`

**Scopo:** mostrare e scegliere un profilo.
- **Dimensione:** Piccolo, lato `misura/avatar/piccolo` (48; era 60, scelta C del 2026-10-10), iniziali `Etichetta`, senza testo sotto, usato dentro il Menu in alto; Grande, lato `misura/avatar` (160), iniziali `Titolo/Riga`, sotto nome (`Etichetta`) e nota facoltativa (`Didascalia`, `testo/tenue`, es. "18+ nascosti").
- Tondo `raggio/pillola`, fondo `superficie/rialzata`, iniziali `testo/primario`; l'immagine del profilo, se c'è, lo riempie. Testo sotto a `spazio/card/testo`, nome e nota a `spazio/card/meta`. Largo quanto il tondo: i nomi lunghi vanno a capo.
- **Proprietà:** Dimensione, Stato, Iniziali, Nome, Nota, Mostra nota (spenta di base). "Aggiungi" è un Grande con "+" al posto delle iniziali.

| Stato | Descrizione |
|---|---|
| Default | Nome `testo/secondario` |
| Focus | Anello tondo `focus/anello` (2) a 4; ombra `Elevazione/Sollevata`; nome `testo/primario`. Nel codice anche `movimento/fuoco/scala` |
| Hover | Come Focus (solo web) |
| Disabilitato, Errore, Caricamento | Non previsti |

- **Lettori di schermo:** si legge il nome (e la nota), anche per il Piccolo che non lo mostra.

---

## CMP-09 – Persona del cast
**Tipo:** base · **Usato in:** riga Cast di SC-10 e SC-11 · **Figma:** pagina Componenti base, set `44:90`

**Scopo:** un attore della scheda; OK apre la Pagina attore (SC-12).
- Foto tonda di lato `misura/cast` (160), segnaposto `superficie/artwork`; nome sotto, `Etichetta`, centrato, a `spazio/card/testo`; largo 160, i nomi lunghi vanno a capo.
- **Proprietà:** Stato, Nome. Stati come CMP-08.

---

## CMP-10 – Etichetta tecnica
**Tipo:** base · **Usato in:** SC-10 Scheda film · **Figma:** pagina Componenti base, componente `46:55`

**Scopo:** un dato tecnico del titolo (4K, HDR, 5.1, Sottotitoli ITA ENG).
- Testo `Didascalia` `testo/secondario` (8,78:1) su `superficie/rialzata`, raggio `raggio/badge`, padding `spazio/badge/verticale` e `spazio/badge/orizzontale`. Proprietà: Testo.
- Non prende il fuoco; per i lettori di schermo si legge insieme ai dati del titolo.

---

## CMP-11 – Scelta
**Tipo:** base · **Usato in:** stagioni (SC-11), schede e scelte del pannello del player (SC-14), elenco dei filtri · **Figma:** pagina Componenti base, set `46:79`

**Scopo:** scegliere un'opzione fra alcune, sapendo quale è attiva.
- Pillola alta `misura/icona-slot` (60), padding `spazio/controllo/…`, `Icona/spunta` a `spazio/gap/icona` dal testo (`Controllo/Pulsante`). Contorno `bordo/su-immagine` di `misura/bordo/spessore`, come il Pulsante Secondario. Proprietà: Testo.

| Stato | Descrizione |
|---|---|
| Default | Fondo `superficie/vetro`, testo `testo/secondario` |
| Selezionata | Fondo `superficie/attiva`, testo `testo/primario`, spunta |
| Focus · Focus selezionata | Come sopra più l'anello `focus/anello` (2) a 4, raggio `raggio/pillola`; la pillola non cambia misura |
| Disabilitato, Errore, Caricamento | Non previsti |

- **Lettori di schermo:** annunciata come opzione, "selezionata" quando lo è.
- Nota: qui, come nella Card e nell'Avatar, l'anello sta fuori dalla pillola e non la sposta; nel CMP-01 Pulsante il Focus è più grande di 12. Da allineare quando si rivede il Pulsante.

---

## CMP-12 – Tasto
**Tipo:** base · **Usato in:** tastiera di Cerca (SC-09), tastierino del PIN (SC-02) · **Figma:** pagina Componenti base, set `47:70`

**Scopo:** scrivere una lettera, una cifra o fare un'azione della tastiera (Spazio, Cancella, ⌫).
- Alto `misura/tasto` (72); la larghezza la decide la tastiera (80 nell'anteprima; "Spazio" e "Cancella tutto" più larghi). Fondo `superficie/rialzata`, raggio `raggio/card`, contenuto centrato.
- **Tipo:** Testo (`Etichetta`, `testo/secondario`), Icona (`Icona/cancella`). Proprietà: Testo.

| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Focus | Il tasto diventa chiaro: fondo `controllo/chiaro`, testo o icona `testo/su-chiaro` (come la Voce del menu). Niente anello esterno: i tasti sono a 8 l'uno dall'altro |
| Disabilitato, Errore, Caricamento | Non previsti |

---

## CMP-13 – Casella del PIN
**Tipo:** base · **Usato in:** SC-02 PIN, Cambia PIN · **Figma:** pagina Componenti base, set `47:75`

**Scopo:** una delle 4 cifre del PIN, senza mostrarla.
- Quadrata di lato `misura/pin` (96), fondo `superficie/rialzata`, raggio `raggio/card`. Non prende il fuoco (il fuoco è sul tastierino).

| Stato | Descrizione |
|---|---|
| Vuota | Solo il fondo |
| Attiva | La prossima da riempire: contorno `bordo/controllo` di `misura/bordo/spessore` |
| Piena | Un punto `misura/punto` (16) `testo/primario` al centro |

- **Lettori di schermo:** "cifra 2 di 4 inserita"; il PIN sbagliato lo annuncia la schermata.

---

## CMP-14 – Campo di testo
**Tipo:** base · **Usato in:** SC-09 Cerca, SC-16 Correggi titolo · **Figma:** pagina Componenti base, set `47:88`

**Scopo:** mostrare il testo che si scrive con la tastiera a schermo.
- Pillola alta `misura/campo` (72), larga quanto decide la schermata (560 nell'anteprima), fondo `superficie/rialzata`, padding `spazio/controllo/orizzontale`, testo `Controllo/Pulsante`. Proprietà: Testo, Suggerimento.

| Stato | Descrizione |
|---|---|
| Vuoto | Suggerimento in `testo/tenue` (4,83:1) |
| Con testo | Testo `testo/primario` e cursore `testo/primario`, largo `misura/cursore` (2) e alto `misura/icona` (28) |
| Focus | Come Con testo più l'anello `focus/anello` (2) a 4, raggio `raggio/pillola` (Correggi titolo; in Cerca il fuoco resta sulla tastiera) |

---

## CMP-15 – Interruttore
**Tipo:** base · **Usato in:** SC-17 Impostazioni (Nascondi contenuti 18+), dentro la Voce di elenco · **Figma:** pagina Componenti base, set `50:71`

**Scopo:** dire se un'opzione è accesa o spenta.
- Pillola `misura/interruttore/larghezza` × `misura/interruttore/altezza` (72 × 40), raggio `raggio/pillola`; pomello tondo `misura/interruttore/pomello` (32) `testo/primario`, a `spazio/interruttore/margine` (4) dal bordo.
- Non prende il fuoco: lo prende la Voce di elenco che lo contiene; OK cambia lo stato.

| Stato | Descrizione |
|---|---|
| Spento | Binario `superficie/attiva`, pomello a sinistra |
| Acceso | Binario `accento/base` (l'accento segna la selezione, regola 6), pomello a destra |
| Focus, Disabilitato, Errore | Non previsti (il fuoco è sulla voce) |

- **Contrasti:** Acceso, binario sullo sfondo 6,51:1; Spento, pomello sul binario 11,70:1. Lo stato si legge anche dalla posizione del pomello.
- **Lettori di schermo:** "interruttore, acceso / spento", letto insieme al testo della voce.

---

## CMP-16 – Voce di elenco
**Tipo:** base · **Usato in:** SC-17 Impostazioni (sezioni, profili, cartelle), SC-16 Correggi titolo (risultati), menu a tendina · **Figma:** pagina Componenti base, set `51:171`

**Scopo:** una riga di un elenco verticale che si sceglie con OK.
- Alta almeno `misura/voce` (72), cresce con il testo; larga quanto decide l'elenco (640 nell'anteprima). Padding `spazio/controllo/verticale` e `spazio/voce/orizzontale`, gap `spazio/gap/icona`, raggio `raggio/card`. Testo `Controllo/Pulsante`, che va a capo senza tagliarsi. Proprietà: Testo, Dettaglio.
- **Tipo:**
  - Semplice: una riga.
  - Con dettaglio: seconda riga in `Meta`, a `spazio/card/meta` (4).
  - Con locandina: a sinistra una locandina 2:3 alta `misura/voce` (fondo `superficie/artwork`, raggio `raggio/badge`), a destra l'Etichetta tecnica "Attuale" (CMP-10) sul risultato in uso.
  - Con interruttore: a destra l'Interruttore (CMP-15).

| Stato | Descrizione |
|---|---|
| Default | Senza fondo; testo `testo/secondario` (9,93:1), dettaglio `testo/terziario` (6,95:1) |
| Selezionata | La sezione in cui sei: fondo `superficie/attiva`, testo `testo/primario` (11,70:1), dettaglio `testo/secondario` (7,09:1) |
| Focus | Voce chiara, come i tasti e la Voce del menu: fondo `controllo/chiaro`, testi `testo/su-chiaro` (16,39:1); la voce non cambia misura |
| Disabilitato, Errore, Caricamento | Non previsti |

- **Lettori di schermo:** il testo, poi il dettaglio; "selezionata" se è la sezione in cui sei; con interruttore anche "acceso / spento".

---

## CMP-17 – Menu a tendina
**Tipo:** composto · **Usato in:** "Ordina e filtra" (SC-04, SC-05, SC-08), menu del profilo (SC-03), Altro (SC-10, SC-11) · **Figma:** pagina Componenti composti, componente `69:42`; parte interna **Intestazione del menu** `69:40`

**Scopo:** un elenco di scelte che si apre sotto il pulsante che lo comanda.
- Fondo `superficie/base`, raggio `raggio/finestra` (le voci hanno `raggio/card`: 20 − 8 = 12, concentrico), ombra `Elevazione/Sollevata`. Margine `spazio/elenco/margine` (16), voci a `spazio/elenco/gap` (8) (portati da 8 e 4 su richiesta, 2026-10-10). Largo 360 nell'anteprima, lo decide chi lo apre.
- Dentro: istanze di CMP-16 Voce di elenco (Semplice) e, per dividere in gruppi, l'**Intestazione del menu** (`Occhiello`, `testo/secondario`, padding `spazio/voce/orizzontale` ai lati, `spazio/controllo/verticale` sopra, `spazio/menu/margine` sotto; non prende il fuoco).
- **Telecomando:** si apre con OK sul pulsante, fuoco sulla voce scelta; ↑ ↓ fra le voci; OK sceglie e chiude; Indietro chiude senza cambiare; ← → non fanno niente.
- Stati: quelli delle voci (Default, Selezionata = scelta attuale, Focus).

