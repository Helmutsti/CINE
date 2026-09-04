# Cineteca — prototipo di interfaccia

Prototipo React con **dati finti**, per vedere e provare il design "Granito" prima di impegnarsi su qualunque scelta infrastrutturale. Non c'è backend, non c'è riproduzione video vera: il tempo del player scorre simulato, il catalogo sta in `src/data/mock.ts`.

Le decisioni tecniche del progetto sono in pausa — vedi `../PILASTRI.md`.

## Avvio

```bash
npm install
npm run dev
```

## Comandi

L'interfaccia è pensata **prima per il telecomando**, poi per il puntatore.

| Tasto | Azione |
| --- | --- |
| Frecce | Sposta il focus |
| Invio | Apre / attiva |
| Esc (o Backspace) | Torna indietro |

Il mouse funziona: passarci sopra sposta il focus, il clic attiva.

## Come è fatto

- **`src/focus/Focus.tsx`** — navigazione spaziale a D-pad. Ogni elemento interattivo si registra e diventa raggiungibile con le frecce: la direzione si risolve sulla geometria reale degli elementi, non su una griglia cablata a mano. `FocusScope` isola i livelli, così un popup o il player non lasciano raggiungere ciò che sta dietro.
- **`src/styles/tokens.css`** — colori, tipografia, spaziature e raggi estratti dalla board `design/Cineteca - Granito.dc.html`. Unica fonte dello stile: nessun valore letterale nei componenti.
- L'intera interfaccia **scala sul viewport**: è progettata a 1920×1080 e resta proporzionata ovunque, con un impianto diverso sotto i 900px.
- Il focus è **una cornice, non un ingrandimento** — solo `box-shadow`, che non innesca layout.

## Schermate

Home · menu a scomparsa · ricerca con tastiera a schermo e sfoglia per genere · catalogo film e serie · scheda film · scheda serie con stagioni ed episodi · player con pannelli audio/sottotitoli/capitoli · richiamo di fine episodio · popup di ripresa · preferiti · impostazioni · libreria vuota · nessun risultato · errore di riproduzione.

## Verifica visiva

`giro.mjs` percorre l'app con Playwright e ne raccoglie le schermate, segnalando eventuali errori in console:

```bash
node giro.mjs /percorso/di/uscita
```

## Note

- Le locandine e i fotogrammi sono **volutamente vuoti**: sono i punti in cui entrano gli artwork reali del catalogo.
- I badge tecnici (4K, HDR, tracce audio, sottotitoli) rappresentano dati che verrebbero letti dal file, non etichette decorative. Un titolo è marcato come non riproducibile per mostrare come si comporta quel caso.
- Nessun logo su licenza (Dolby, DTS, HDR10+): pittogrammi propri e marchi denominativi in testo.
