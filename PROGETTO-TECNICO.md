# Cineteca — Documento di progetto tecnico

> Basato sul progetto grafico "Cineteca: progetto multimediale" su Claude Design (board finale: `Cineteca - Granito.dc.html`, turno 4).

## 1. Visione

Applicazione web in stile Plex per la fruizione di una libreria multimediale **locale** (film e serie possedute), con un'unica interfaccia pensata per essere usata "in tutta casa": TV con telecomando come superficie principale, più web desktop, tablet e mobile. Non esclusa in futuro un'app nativa iPhone/Apple TV.

Vincolo guida emerso nel progetto grafico: **veloce ed essenziale, deve girare bene su hardware datato pur mantenendo qualità grafica**.

## 2. Sintesi del progetto grafico

Requisiti raccolti nel design (questionario + iterazioni):

- **Dispositivi**: TV/telecomando (D-pad), web desktop, app mobile, tablet.
- **Schermate chiave**: Home/catalogo, dettaglio film, dettaglio serie (stagioni/episodi), player video, ricerca e sfoglia per genere, lista/continua a guardare.
- **Catalogo**: generalista, molti titoli (non solo cinema d'autore).
- **Profili**: nessuno — account singolo.
- **Lingua**: italiano.
- **Design system finale ("Granito")**: tema scuro, un'unica famiglia tipografica, superfici distinte da un gradino di luminosità (niente ombre/gradienti), colore d'accento scuro usato solo su selezione/avanzamento. Navigazione in un menu laterale a comparsa (di norma solo icone, si apre su richiesta) — pensato per il telecomando: il focus è una cornice, non un ingrandimento.

Schermate disegnate nella board finale:

1. **Home** (menu chiuso) — righe "Riprendi da dove eri" e "Aggiunti di recente".
2. **Menu laterale aperto** — Home, Cerca, Film, Serie, Preferiti, Impostazioni.
3. **Ricerca e generi** — tastiera a schermo pensata per input da telecomando, sfoglia per genere/categoria (Azione, Commedia, Poliziesco, Documentario, Italiani, Serie TV...).
4. **Scheda film** — badge tecnici reali (4K UHD, HDR, 5.1 surround, sottotitoli ITA/ENG/ES, audiodescrizione), pulsanti Riprendi/Dall'inizio/Preferiti, sezione "Da vedere dopo".
5. **Scheda serie** — stagioni ed episodi, sinossi per episodio.
6. **Player** — minimale, immagine a piena schermo, barra di avanzamento sottile, titolo episodio/capitolo, controlli essenziali.
7. **Preferiti** — la propria lista salvata.
8. **Popup "Riprendi o ricomincia"** — al rientro su un titolo già iniziato.
9. **Adattamento mobile** — home, menu, player.

Nota di design da rispettare lato tecnico: **nessun logo su licenza** (Dolby, DTS, HDR10+ ecc.) — le caratteristiche tecniche vanno dichiarate con pittogrammi propri e marchi denominativi in testo, non con i loghi ufficiali.

## 3. Requisiti funzionali

### MVP

- Scansione automatica di una o più cartelle/dischi (locali o di rete/NAS) per costruire il catalogo.
- Recupero metadati (titolo, anno, regista, cast, sinossi, genere, poster) da TMDb, con match automatico sul nome file e correzione manuale in caso di errore.
- Player con **direct play** quando il client supporta nativamente il file, e **transcoding on-the-fly** (FFmpeg) quando serve — per restare leggero su hardware datato.
- Resume/continua a guardare, cronologia, coda "da vedere dopo".
- Ricerca e sfoglia per genere/anno/regista.
- Sottotitoli esterni (SRT/ASS) e selezione tracce audio multiple.
- UI responsive per TV (telecomando), desktop, mobile/tablet (touch).
- Account singolo, lingua italiana.

### V2 / nice-to-have

- App nativa iOS e tvOS (Apple TV, con supporto Siri Remote, AirPlay, Top Shelf).
- App Android / Android TV.
- Multi-profilo con cronologia separata (il design attuale lo esclude, ma vale la pena tenere il modello dati pronto).
- Download offline su mobile.
- Chromecast/AirPlay dal web.
- Notifiche per nuovi episodi/titoli aggiunti.
- Collezioni curate manuali (es. filmografia di un regista, come "Dallo stesso autore" nel design).
- Accesso da fuori casa in sicurezza (VPN/Tailscale, non esporre porte pubbliche).
- Sottotitoli generati automaticamente (Whisper) quando mancanti.

## 4. Architettura proposta

Client-server, stile Plex/Jellyfin, self-hosted.

**Server (media server)**
- API in Node.js/NestJS (TS) oppure Python/FastAPI.
- Database: **SQLite** per partire (zero-config, leggero, adatto a hardware datato) → **PostgreSQL** se in futuro serve più concorrenza/utenti.
- Scanner di libreria (watcher filesystem + job periodici) + estrazione metadati tecnici con `ffprobe`.
- Transcoding con **FFmpeg** (accelerazione HW se disponibile: VAAPI/NVENC/QuickSync), streaming adattivo HLS/DASH.
- Fetch metadati da **TMDb API**.
- Autenticazione semplice (sessione/JWT), pronta per multiutenza anche se oggi è account singolo.

**Frontend (TV + desktop + mobile, un'unica web app responsive)**
- SPA in **React** (o **Svelte**, più leggero, buono su hardware datato) con TypeScript.
- Gestione dedicata del **focus a griglia per navigazione da telecomando** (frecce/D-pad), coerente con lo stile "cornice, non ingrandimento" della board.
- Player: **hls.js**/Shaka Player per lo streaming adattivo, fallback a `<video>` nativo per il direct play.
- Tema "Granito" implementato con CSS custom properties (i design token sono già nella cartella `_ds` del progetto Claude Design).
- **PWA** installabile su smart TV/tablet, per avvio rapido e leggerezza.

**Deploy**
- Server containerizzato (Docker) su NAS, mini PC o Raspberry Pi 4/5.
- Reverse proxy (Caddy/Nginx) con HTTPS per l'accesso da altri dispositivi in LAN.

## 5. Stack tecnologico consigliato

| Livello | Tecnologia |
|---|---|
| Backend/API | Node.js + NestJS (TS) o Python + FastAPI |
| Database | SQLite → PostgreSQL se serve scalare |
| Transcoding | FFmpeg + HLS/DASH |
| Metadati | TMDb API |
| Frontend | React + TypeScript (alternativa: Svelte) |
| Player video | hls.js / Shaka Player |
| Stile | CSS variables/design tokens da "Granito" (+ Tailwind opzionale) |
| Navigazione telecomando | Focus management custom su griglia |
| Distribuzione | Docker Compose + reverse proxy Caddy |
| Futuro nativo | React Native (riuso logica) oppure Swift/SwiftUI per integrazione Apple piena |

## 6. Vincoli tecnici derivati dal design

- Tema scuro unico: nessuna necessità di gestire un tema chiaro, ma va comunque verificato il contrasto per accessibilità.
- I badge tecnici (4K UHD, HDR, Dolby Atmos, DTS-HD MA, sottotitoli, audiodescrizione) devono riflettere dati **reali** estratti dal file (via ffprobe/mediainfo), non essere statici.
- "Da vedere dopo" e "Dallo stesso autore" richiedono solo query su metadati (stesso regista/collezione/genere) — non serve un motore di raccomandazione ML.
- La ricerca con tastiera a schermo va progettata per input da frecce (D-pad), non solo tastiera fisica/touch.
- Niente loghi ufficiali con licenza (Dolby/DTS/HDR10+): badge testuali/pittogrammi propri. Se in futuro il progetto passasse da uso personale a distribuzione pubblica, andranno comunque verificati i termini d'uso dei marchi.

## 7. Fasi consigliate

1. Backend minimo: scansione libreria + DB + API catalogo + direct play FFmpeg.
2. Frontend web con le schermate già disegnate (Home, Ricerca, Scheda film/serie, Player, Preferiti).
3. Navigazione telecomando (focus a griglia, tastiera D-pad) + tema Granito.
4. Transcoding adattivo per hardware datato (HLS + accelerazione hardware).
5. Adattamento mobile/tablet.
6. (Futuro) App nativa iOS/tvOS.
