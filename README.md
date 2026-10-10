# Cineteca

Un client per **Jellyfin** pensato per la TV: si usa col telecomando (o con le frecce della tastiera), con un'interfaccia essenziale in stile Apple TV.
Questa è la versione **web**, che gira in un contenitore Docker. Le app per iPhone, Apple TV e Android TV arriveranno dopo.

- Niente login: il contenitore si collega al tuo server Jellyfin con una **chiave API**.
- I profili sono gli **utenti** del tuo Jellyfin ("Chi guarda?"): avanzamento, La mia lista e contenuti limitati restano quelli del server, uguali alle altre app.
- La chiave resta dentro il contenitore: il browser non la vede mai.

---

## Primo avvio (Mac, Windows o Linux)

### 1. Installa Docker
Sul Mac: scarica e apri **Docker Desktop** da <https://www.docker.com/products/docker-desktop/> (va bene sia per Mac Intel sia per Apple Silicon). Aspetta che l'icona della balena nella barra in alto smetta di muoversi.

### 2. Crea una chiave API in Jellyfin
1. Apri Jellyfin nel browser ed entra con un utente **amministratore**.
2. Vai in **Pannello di controllo → Chiavi API** (in inglese: *Dashboard → API Keys*).
3. Premi **+**, scrivi come nome `Cineteca` e conferma.
4. Copia la chiave che compare (una lunga sequenza di lettere e numeri).

### 3. Prepara il file di avvio
Crea una cartella, per esempio `cineteca` sulla Scrivania, e dentro un file chiamato **`docker-compose.yml`** con questo contenuto:

```yaml
services:
  cineteca:
    image: ghcr.io/helmutsti/cineteca:1.1.0
    container_name: cineteca
    ports:
      - "8080:80"
    environment:
      JELLYFIN_URL: "http://192.168.1.10:8096"      # l'indirizzo del tuo server Jellyfin
      JELLYFIN_API_KEY: "incolla-qui-la-chiave"     # la chiave del punto 2
    restart: unless-stopped
```

Cambia le due righe:
- **`JELLYFIN_URL`**: l'indirizzo con cui apri Jellyfin nel browser, senza `/` in fondo. Per esempio `http://192.168.1.10:8096`, oppure `https://jellyfin.casa.mia`.
  Se Jellyfin gira **sullo stesso Mac** dove avvii Cineteca, usa `http://host.docker.internal:8096` (non `localhost`).
- **`JELLYFIN_API_KEY`**: la chiave copiata al punto 2.

Lo stesso file c'è già nella radice di questo repository: [`docker-compose.yml`](docker-compose.yml).

### 4. Avvia
Apri il Terminale nella cartella e scrivi:

```sh
docker compose up -d
```

La prima volta Docker scarica l'immagine (qualche decina di MB). Poi apri **<http://localhost:8080>**.
Da un altro dispositivo della stessa rete (TV, tablet) usa l'indirizzo del computer, per esempio `http://192.168.1.20:8080`.

### Comandi
| Telecomando | Tastiera |
|---|---|
| Frecce | Frecce |
| OK | Invio |
| Indietro | Esc o Backspace |

Funziona anche col mouse. Lo schermo è disegnato per 1920 × 1080 e si adatta alla finestra: per l'effetto TV usa il **tutto schermo** del browser.

### Se qualcosa non va
- **«Il server Jellyfin non risponde»**: controlla `JELLYFIN_URL`. Il contenitore deve poter raggiungere il server: prova l'indirizzo nel browser dello stesso computer.
- **«Il server Jellyfin non accetta la chiave API»**: ricopia la chiave in `JELLYFIN_API_KEY`, senza spazi.
- **Dopo aver cambiato il file**: `docker compose up -d` di nuovo, e Docker riavvia il contenitore.
- **Aggiornare a una versione nuova**: cambia il numero dopo `cineteca:` (oppure usa `cineteca:latest`) e poi `docker compose pull && docker compose up -d`.
- **Se `docker compose up` dice che non ha il permesso di scaricare l'immagine**: l'immagine su GitHub non è ancora pubblica. Il proprietario del repository la rende pubblica da *GitHub → Packages → cineteca → Package settings → Change visibility → Public*.

---

## Riproduzione
Il browser dice al server quali formati sa leggere. Se il file va bene arriva così com'è (nessun lavoro per il server); se no Jellyfin cambia solo il contenitore o l'audio quando basta, e converte il video solo quando serve davvero.
Nel player, freccia giù → **Transcodifica** mostra cosa sta succedendo e permette di forzare o spegnere la conversione.

## Il progetto
| Cartella | Cosa c'è |
|---|---|
| `client/` | Il client web (TypeScript, Vite, React) e il suo contenitore Docker |
| `prototipo-tv/` | Il prototipo dell'interfaccia con dati finti, per provare il design |
| `docs/design/` | Funzioni, flussi, schermate, componenti, token e registro delle decisioni |
| `AGENTS.md` | Istruzioni per chi ci lavora (persone e agenti), con i link ai file Figma |

### Sviluppo del client
```sh
cd client
npm install
# client/.env.local (non va nel repository):
#   JELLYFIN_URL=http://192.168.1.10:8096
#   JELLYFIN_API_KEY=la-tua-chiave
npm run dev
```
In sviluppo il server di Vite fa da ponte verso Jellyfin, come nginx nel contenitore.

### Pubblicare una versione
Si aggiorna `version` in `client/package.json`, si fa il commit e si crea il tag, per esempio `v1.1.0`.
Il workflow [`immagine-docker.yml`](.github/workflows/immagine-docker.yml) costruisce l'immagine per amd64 e arm64 e la pubblica su `ghcr.io/helmutsti/cineteca` con le etichette `1.1.0`, `1.1` e `latest`.
