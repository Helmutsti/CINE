# Pilastri — Cineteca

> ## ⏸ Documento in pausa — 4 settembre 2026
>
> Il progetto riparte da un **prototipo di interfaccia in React con dati finti**, per vedere e provare il design prima di impegnarsi su qualunque scelta infrastrutturale. **Tutte le decisioni qui sotto sono rimandate**, incluse quelle marcate come chiuse: restano registrate perché il ragionamento vale, non perché sia vincolante.
>
> Quando il prototipo avrà detto la sua, questo documento si riapre — con in più la cosa che oggi manca: l'esperienza di aver usato l'interfaccia.

Le decisioni portanti del progetto. Non sono lo stack tecnologico: sono i vincoli da cui lo stack **discende**. Servono a rispondere in modo rapido e coerente a tutte le domande successive ("usiamo X o Y?") senza riaprire ogni volta il ragionamento da capo.

**Regola d'uso**: un pilastro si cambia solo con una decisione esplicita e scritta qui. Quando cambia, si rileggono tutte le scelte che ne derivavano — perché probabilmente cambiano anche quelle.

Ogni pilastro dichiara: la **decisione**, il **perché**, le **conseguenze** operative e **cosa esclude**. L'ultima sezione raccoglie le decisioni ancora aperte: sono le uniche cose che ci separano dalla prima riga di codice.

---

## P1 — Il file si riproduce così com'è. Il transcoding video è un fallimento, non una feature.

**Decisione.** Tre livelli, in quest'ordine rigido:

1. **Direct play** — il client riceve il file identico, il server fa solo `HTTP Range`. Costo CPU ≈ 0.
2. **Remux + eventuale transcodifica del solo audio** — si cambia contenitore (MKV → fMP4) e, se serve, si converte la traccia audio (DTS/TrueHD → AAC/AC3). Il video non viene toccato. Costo basso, accettabile.
3. **Transcodifica video** — ultima risorsa. Va **dichiarata all'utente** nell'interfaccia, non nascosta.

> **Aggiornamento del 4 settembre 2026 (da D2).** Sull'hardware scelto il livello 3 **non esiste**: il NAS non è in grado di ricodificare video in tempo reale. P1 smette di essere una preferenza architetturale e diventa un vincolo fisico. Non c'è rete di sicurezza: ciò che il client non riproduce, non si riproduce. Le conseguenze sono in D2.

**Perché.** È il vincolo guida del progetto ("veloce ed essenziale, deve girare bene su hardware datato") portato alle sue conseguenze. Ricodificare un 4K HEVC in tempo reale richiede hardware che per definizione non abbiamo. Al contrario remux e transcodifica audio costano quasi nulla: confonderli con il transcoding video è l'errore che fa sembrare irrisolvibile un problema che non lo è.

**Conseguenze.**
- Il server deve conoscere le **capacità reali del client** (codec video, codec audio, contenitori, HDR) e negoziarle prima di aprire lo stream. Questa negoziazione è un componente di primo livello, non un dettaglio del player.
- `ffprobe` gira **una volta sola**, in fase di scansione, e i risultati finiscono in tabella. Mai a runtime sulla richiesta di play.
- Le decisioni di riproduzione sono **osservabili**: per ogni sessione si registra quale dei tre livelli è stato usato e perché. Senza questo, il degrado di prestazioni è invisibile.
- Il player client va scelto in base a *quanto riesce a riprodurre nativamente*, non a quanto è comodo da integrare.

**Cosa esclude.** HLS/DASH come trasporto predefinito. Se il file è riproducibile direttamente, incapsularlo in un protocollo adattivo aggiunge latenza, CPU e complessità per un beneficio nullo in LAN. HLS resta lo strumento del livello 3, non la norma.

---

## P2 — Il filesystem è la verità. Il database è un indice ricostruibile.

**Decisione.** Cancellare il database e rifare la scansione deve riportare al catalogo identico. Nessuna informazione sul *contenuto* della libreria esiste solo nel DB.

**Perché.** È ciò che rende un media server casalingo affidabile per anni. Elimina intere categorie di problemi: migrazioni distruttive, corruzione del DB, backup pesanti, disallineamento tra ciò che vedi e ciò che hai.

**Conseguenze.**
- Il modello dati si divide in due nature, e la divisione è netta:
  - **Derivato** (catalogo, metadati tecnici, poster, match TMDb) — rigenerabile, sacrificabile, non va nel backup.
  - **Proprio dell'utente** (posizione di riproduzione, cronologia, preferiti, coda, correzioni manuali di match) — irrecuperabile, va nel backup, è l'unica cosa che merita attenzione in migrazione.
- Un file identificato una volta deve restare identificato dopo uno spostamento: l'identità del media non può essere il path. Serve un'identità stabile (dimensione + hash parziale, o simile).
- Le correzioni manuali di match sono dati d'utente e sopravvivono a ogni riscansione. Un rescan che ricancella la correzione fatta a mano è un bug grave.

**Cosa esclude.** Qualsiasi funzionalità che introduca dati sul catalogo non ricavabili dal filesystem o da TMDb. Se una feature futura lo richiede, si torna qui a discuterla prima di scriverla.

---

## P3 — La libreria dell'utente è di sola lettura.

**Decisione.** Il server non rinomina, non sposta, non riorganizza, non cancella nulla dentro le cartelle multimediali. Mai. Nemmeno come opzione disattivabile.

**Perché.** È la promessa di fiducia su cui si regge un software che punti su una collezione costruita in anni. Un solo bug in una routine di rinomina automatica distrugge lavoro irrecuperabile, e la funzione che quel bug abilitava non vale il rischio.

**Conseguenze.**
- Poster, thumbnail, sottotitoli generati, sidecar e cache vivono **fuori** dalle cartelle multimediali, in una directory dati dell'applicazione.
- Il permesso di mount è `read-only` a livello di container. Il vincolo è imposto dal sistema, non dalla nostra disciplina.
- La correzione di un match è un record nel nostro DB, non un rinomina del file.

**Cosa esclude.** Organizzatori automatici, integrazione con strumenti che riscrivono i file, "pulizia" della libreria.

---

## P4 — Funziona senza internet.

**Decisione.** Con la connessione staccata, l'applicazione si avvia, mostra il catalogo completo con poster e metadati e riproduce tutto. Nessuna schermata attende una risposta da un servizio esterno.

**Perché.** È un server di casa, in LAN. Dipendere da TMDb per *usare* la propria libreria significa che un problema di rete altrui rompe il salotto. TMDb arricchisce; non abilita.

**Conseguenze.**
- Ogni poster e backdrop viene **scaricato e conservato in locale** alla scansione. Nessun `<img src="https://image.tmdb.org/...">` nell'interfaccia.
- L'arricchimento metadati è un job di background con coda e ritentativi, disaccoppiato dalla scansione. Un titolo senza metadati esiste comunque nel catalogo, mostrato con i dati ricavati dal file.
- Nessuna chiamata a terzi sul percorso critico di una richiesta utente.

**Cosa esclude.** Font, icone, CSS o script serviti da CDN. Tutto è nel bundle.

---

## P5 — Il focus da telecomando è una primitiva del sistema, non un miglioramento successivo.

**Decisione.** La navigazione spaziale a D-pad viene progettata nel primo componente scritto. Ogni elemento interattivo nasce dentro il sistema di focus; non esiste un elemento "solo per il mouse".

**Perché.** È l'unico pilastro che non si può aggiungere dopo. Retrofittare la navigazione a frecce su un'interfaccia pensata per il puntatore significa riscriverla. Il progetto grafico ha già scelto la sua semantica — *il focus è una cornice, non un ingrandimento* — e quella scelta è vincolante anche per il codice, perché un focus che ridimensiona provoca reflow e su hardware lento si vede.

**Conseguenze.**
- La TV è la superficie **primaria**: si disegna prima per il telecomando, poi si adatta a puntatore e touch. Il contrario non funziona.
- Righe orizzontali lunghe (il pattern portante del design) implicano virtualizzazione e memoria del focus: tornando indietro da una scheda, si rientra sull'elemento da cui si era usciti.
- Lo stato di focus vive in un livello proprio, indipendente dal framework di rendering scelto.
- L'animazione di focus è la sola concessione: deve restare sotto la soglia di percezione anche su hardware lento (solo `transform`/`opacity`, mai proprietà che innescano layout).

**Cosa esclude.** Librerie di componenti generaliste pensate per il web desktop. Portano con sé un modello di interazione che dovremmo combattere in ogni componente.

---

## P6 — Un solo linguaggio dal disco allo schermo, un solo contratto tipizzato.

**Decisione.** Stesso linguaggio su server e client, con i tipi del dominio (Film, Serie, Episodio, Traccia, Sessione) definiti **una volta** e importati da entrambi i lati.

**Perché.** Il progetto ha un solo sviluppatore. Il costo maggiore non è scrivere il codice, è mantenere allineate due rappresentazioni della stessa cosa. Un contratto condiviso trasforma un'intera classe di errori di integrazione in errori di compilazione.

**Conseguenze.**
- Un monorepo con un pacchetto `shared` per tipi e schemi di validazione. Lo schema è la definizione, il tipo si deriva da esso — non due dichiarazioni da tenere in sincronia a mano.
- Tipizzazione stretta, senza scappatoie. Il confine dove i dati entrano nel sistema (filesystem, `ffprobe`, TMDb) è l'unico punto in cui si valida a runtime; oltre quel confine i dati sono tipizzati e ci si fida.
- Rende praticabile in futuro il riuso della logica in un client nativo.

**Cosa esclude.** Backend e frontend in linguaggi diversi. Non perché una delle due opzioni sia inferiore, ma perché il costo di traduzione ricade interamente su una persona sola.

---

## P7 — L'API serve schermate, non tabelle.

**Decisione.** Ogni schermata del progetto grafico si carica con **una sola richiesta**, che restituisce esattamente ciò che quella schermata mostra.

**Perché.** L'unico consumatore dell'API è la nostra interfaccia, che è già disegnata: un'API REST generica per risorse ci farebbe pagare N richieste a cascata per comporre una home. Su un client lento e una LAN Wi-Fi, quella cascata è la differenza tra un'apertura istantanea e una schermata che si popola a pezzi.

**Conseguenze.**
- Gli endpoint prendono il nome dalle schermate, non dalle entità: `/home`, `/titolo/:id`, `/serie/:id`, `/cerca`.
- Il server decide cosa è "Riprendi da dove eri" o "Da vedere dopo". Il client renderizza e non calcola.
- Cambiare il design cambia l'API, ed è accettabile: sono la stessa cosa vista da due lati.

**Cosa esclude.** Un livello API generico "riutilizzabile" per consumatori che non esistono. Se un giorno arriva un client nativo, saranno le stesse schermate.

---

## P8 — I token di "Granito" sono l'unica fonte dello stile.

**Decisione.** Colori, tipografia, spaziature e raggi provengono esclusivamente dalle CSS custom properties del sistema. Nessun valore letterale nel codice dei componenti.

**Perché.** Il sistema visivo è già stato progettato e validato ed è la parte più matura del progetto. La sua coerenza si mantiene solo se è meccanicamente impossibile aggirarla — la disciplina individuale, su mesi, non basta.

**Conseguenze.**
- Il tema è scuro e unico. Nessuna infrastruttura per il cambio tema, ma il contrasto va verificato davvero: superfici distinte da un solo gradino di luminosità sono il punto in cui l'accessibilità si perde per prima.
- I badge tecnici (4K, HDR, tracce audio, sottotitoli) rappresentano **dati reali** letti dal file. Un badge che mente è peggio di un badge assente.
- Nessun logo su licenza (Dolby, DTS, HDR10+): pittogrammi propri e marchi denominativi in testo.
- Una regola di lint blocca i valori letterali di colore fuori dal file dei token.

**Cosa esclude.** Framework CSS che portano una propria scala di design. Sostituirebbero il sistema che abbiamo già scelto con il loro.

---

## P9 — Un comando per avviare tutto.

**Decisione.** Dal repository a un'istanza funzionante: un solo comando. Nessuna procedura guidata di installazione, nessun servizio esterno da configurare a mano, nessun passaggio manuale nel README.

**Perché.** Il progetto vivrà su un dispositivo domestico che nessuno amministra e a cui si tornerà a distanza di mesi. Se ci fosse una procedura di installazione, sarebbe già scaduta la prossima volta che serve.

**Conseguenze.**
- Database senza processo separato (un file, non un servizio) finché non c'è una ragione misurata per cambiare. Concorrenza attesa: una casa.
- Configurazione minima: dove sono i file, dove stanno i dati, la chiave TMDb. Nient'altro.
- Le migrazioni dello schema girano da sole all'avvio. E per P2 le migrazioni pesanti riguardano solo i dati d'utente, che sono pochi.
- Aggiornare = sostituire l'immagine e riavviare.

**Cosa esclude.** Dipendenze infrastrutturali aggiuntive (cache, broker di code, motori di ricerca) prima che un problema reale e misurato le renda necessarie.

---

## P10 — Nessun account, nessuna nuvola, nessuna telemetria.

**Decisione.** Il sistema non parla con nessuno tranne TMDb. Accesso su LAN; da fuori casa si passa da una rete privata (Tailscale/WireGuard), non esponendo porte pubbliche.

**Perché.** È coerente con l'uso personale ed elimina in un colpo l'intera superficie di problemi di sicurezza, privacy e conformità che non ha alcuna contropartita in un progetto di casa.

**Conseguenze.**
- Autenticazione semplice, ma il modello dati tiene già l'utente come chiave sulla cronologia: il design attuale esclude i profili, riaprirli più avanti non deve costare una migrazione.
- Nessun analytics, nessun crash reporter di terzi. La diagnostica sono i log locali.
- La sicurezza si concentra dove serve davvero: percorsi di file (nessun path traversal verso l'esterno della libreria) e argomenti passati a FFmpeg.

---

## P11 — Il budget di prestazioni è un numero dichiarato, non un'aspirazione.

**Decisione.** "Deve girare su hardware datato" viene tradotto in soglie misurabili, verificate sul dispositivo peggiore che intendiamo supportare, non sulla macchina di sviluppo.

**Perché.** Un vincolo di prestazioni non quantificato viene eroso una decisione ragionevole alla volta, e ce ne si accorge quando è troppo tardi per rimediare senza riscrivere.

**Conseguenze.**
- Le soglie vanno fissate una volta scelto il dispositivo di riferimento (vedi D1/D2): tempo di apertura della home, risposta a una pressione del telecomando, peso del bundle, memoria in scorrimento, latenza dall'avvio del play al primo fotogramma.
- Ogni dipendenza aggiunta si giustifica rispetto al budget. Il peso è un costo, non un dettaglio.
- Si misura sul dispositivo reale, periodicamente. Un budget mai verificato non esiste.

---

# Decisioni chiuse

### D1 — Cos'è "la TV" → **un box collegato al televisore** *(4 settembre 2026)*

Era la decisione più pesante del progetto, perché P1 e P5 dipendevano interamente da essa. Il browser integrato in una smart TV non riproduce HEVC in modo affidabile, non apre i contenitori MKV e non gestisce audio DTS o TrueHD: con quel client, ogni film in quei formati avrebbe imposto una transcodifica video — ciò che P1 vieta e che un NAS non può sostenere. La regola era: **o il client è capace, o il server deve essere potente.** Abbiamo scelto di rendere capace il client.

**Precisazione necessaria.** "Box con browser moderno" è più stretto di quanto la categoria suggerisca, e conviene saperlo prima di comprare hardware:

- **Apple TV non ha un browser** e non installa PWA. È escluso da questa strada: richiederebbe un'app nativa, cioè la terza opzione che abbiamo scartato.
- **I box Android TV** (Shield inclusa) hanno browser mal mantenuti e in ritardo di versioni. Sconsigliati.
- Restano praticabili: **un mini PC** con Chromium/Chrome in modalità chiosco — la scelta più solida, decodifica hardware inclusa — oppure **un Raspberry Pi 4/5** con Chromium in chiosco, più economico e silenzioso ma con accelerazione hardware meno scontata sui formati pesanti.

**Conseguenze già acquisite:**

- Il livello 3 di P1 (transcodifica video) diventa un caso raro e reale — un file esotico — e non più la norma. Il NAS può restare leggero.
- **D4 si sblocca**: il budget di P11 non è più dettato da un motore JavaScript obsoleto. La scelta del frontend torna libera, vincolata solo dal peso.
- Resta **un'unica web app responsive**, come da progetto grafico. Nessun secondo client da mantenere.
- Il costo è un dispositivo per ogni televisore su cui si vuole guardare.

---

### D2 — Il server → **QNAP con CPU ARM e Container Station** *(4 settembre 2026)*

**Il NAS non transcodifica video.** I QNAP ARM montano SoC Realtek (RTD1295/1296) o Annapurna Alpine. I Realtek hanno un motore video hardware — nascono come chip da set-top box — ma QNAP **non lo espone a FFmpeg** dentro Container Station: niente VAAPI, il motore resta riservato alle app multimediali proprietarie per le anteprime. Rimane la codifica software su quattro Cortex-A53 a ~1,4-1,7 GHz, che su un 1080p H.264 non si avvicina al tempo reale.

Cosa invece regge senza problemi: il **remux** è riscrittura di contenitore, costo I/O e nient'altro; la **transcodifica audio** costa una frazione percentuale di quella video. Il livello 2 di P1 è interamente alla portata.

**Conseguenze.**

- **P9 regge**: i container ci sono. Ma le immagini devono corrispondere all'architettura — `arm64` sui Realtek RTD129x, `armhf` a 32 bit sugli Annapurna, dove la disponibilità di immagini pronte è nettamente peggiore. *Serve il modello esatto per saperlo.*
- **Il livello 3 di P1 è abolito** (vedi la nota nel pilastro).
- **Non esistendo una rete di sicurezza, il box diventa il componente critico**: ciò che non riproduce lui non lo riproduce nessuno. Questo trasforma la scelta del box da preferenza a requisito — **mini PC, non Raspberry Pi**. Su un mini PC con iGPU Intel, Chrome esegue la decodifica HEVC in hardware; su Chromium per Pi il supporto HEVC è incerto e mal documentato, e non avremmo modo di compensare lato server.
- **Il collo di bottiglia non è la potenza del box, è il browser.** Chrome non apre i contenitori MKV, non riproduce DTS o TrueHD in nessuna circostanza, e fa HEVC solo con decoder hardware e supporto della piattaforma. Ma è esattamente il problema che il livello 2 risolve: il NAS rimuxa MKV in fMP4 e converte l'audio in AAC, il video passa intatto. **L'architettura tiene** — semplicemente il livello 2 diventa la modalità ordinaria, non l'eccezione.
- **Capacità nuova, gratuita, che cade dal combinato di P1 e P2**: poiché `ffprobe` gira già in fase di scansione, il server sa **in anticipo** — prima che si prema play — quali titoli il box non è in grado di riprodurre. Diventa un rapporto di compatibilità della libreria. Senza rete di sicurezza, saperlo prima invece che scoprirlo sul divano vale molto.
- La RAM del NAS (tipicamente 1-4 GB su questi modelli) entra tra i vincoli di P11.

**Modello: QNAP TS-431K.** Annapurna Labs Alpine AL-214, quad-core Cortex-A15 a 1,7 GHz, **1 GB di RAM non espandibile**. Due dati cambiano il quadro rispetto alle ipotesi fatte sopra:

- L'Alpine AL-214 è **ARMv7 a 32 bit (`armhf`)**, non arm64. È lo scenario peggiore per la disponibilità di immagini container: molti progetti hanno abbandonato armhf, e quelle che restano sono spesso indietro di versioni. Da verificare inoltre se il TS-431K supporti davvero Container Station — su diversi modelli ARM da 1 GB QNAP non la offre, e la memoria da sola la rende in ogni caso stretta.
- L'AL-214 **non ha alcun motore video**, a differenza dei Realtek: qui non c'è nemmeno l'hardware teorico da provare a esporre. La transcodifica video è esclusa in modo definitivo, non per scelta di QNAP ma per assenza fisica del silicio.

Con 1 GB di RAM condiviso tra sistema, scansione della libreria e servizio dei file, questo NAS è realisticamente **spazio di archiviazione, non un server applicativo**. È l'argomento più forte a favore di far girare il server sul mini PC del salotto e lasciare al TS-431K il ruolo di disco di rete — ma la decisione è rimandata insieme a tutte le altre.

---

# Decisioni aperte

### D3 — Quale linguaggio per il pilastro P6

TypeScript su entrambi i lati è la scelta che rispetta P6 nel modo più diretto, e l'ecosistema dei player web è nativamente TypeScript. Python sul server sarebbe più comodo per lo scripting su file e metadati, ma spezza il contratto condiviso e obbliga a mantenere due definizioni dello stesso dominio.

### D4 — Quale strumento per il frontend

Sbloccata da D1: il client è un browser moderno, quindi la scelta non è più costretta dalla compatibilità. Resta vincolata dal peso (P11) e dal fatto che P5 esclude le librerie di componenti generaliste pensate per il puntatore.

### D5 — Cosa significa "fatto" per una funzionalità

Il livello di test che ci imponiamo. Proposta: copertura seria e non negoziabile sulle due parti dove gli errori sono silenziosi e costosi — il riconoscimento dei titoli dai nomi dei file e la negoziazione delle capacità di riproduzione di P1 — e verifica manuale sul resto.

### D6 — Come arrivano i tasti al browser *(nuova, derivata da D1)*

P5 dà per scontato di ricevere eventi da tastiera direzionali, ma su un mini PC o un Pi in modalità chiosco quegli eventi devono arrivare da qualche parte. Le strade sono un **telecomando Bluetooth** che emette già frecce e invio, un **ricevitore IR tipo Flirc** che mappa un telecomando normale su tasti di tastiera, o **HDMI-CEC** per usare il telecomando del televisore (funziona bene sul Pi, richiede un livello di traduzione).

Non blocca l'inizio dello sviluppo — si lavora con la tastiera — ma va deciso prima di considerare finita l'esperienza da divano, perché determina *quali* tasti esistono davvero: un telecomando con quattro frecce, OK e Indietro è un'interfaccia molto più povera di una tastiera, e P5 va progettata su quel minimo.

### D3 — Quale linguaggio per il pilastro P6

TypeScript su entrambi i lati è la scelta che rispetta P6 nel modo più diretto, e l'ecosistema dei player web è nativamente TypeScript. Python sul server sarebbe più comodo per lo scripting su file e metadati, ma spezza il contratto condiviso e obbliga a mantenere due definizioni dello stesso dominio.

### D4 — Quale strumento per il frontend

Da decidere **dopo** D1, perché è D1 a stabilire il budget. Se il client è un browser moderno la scelta è quasi libera; se è il browser di una smart TV, il peso e il livello di JavaScript prodotto diventano vincoli stringenti.

### D5 — Cosa significa "fatto" per una funzionalità

Il livello di test che ci imponiamo. Proposta: copertura seria e non negoziabile sulle due parti dove gli errori sono silenziosi e costosi — il riconoscimento dei titoli dai nomi dei file e la negoziazione delle capacità di riproduzione di P1 — e verifica manuale sul resto.
