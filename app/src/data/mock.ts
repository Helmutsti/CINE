/**
 * Catalogo finto. Serve a provare l'interfaccia, non a rappresentare un
 * modello dati definitivo: i campi tecnici (risoluzione, HDR, tracce audio,
 * sottotitoli) esistono perché le schede li mostrano come dati reali letti
 * dal file, mai come etichette decorative.
 */

export type Episodio = {
  id: string;
  n: number;
  titolo: string;
  sinossi: string;
  durataMin: number;
  progressoSec?: number;
  visto?: boolean;
};

export type Stagione = {
  n: number;
  episodi: Episodio[];
};

export type Titolo = {
  id: string;
  tipo: "film" | "serie";
  titolo: string;
  anno: number;
  generi: string[];
  durataMin?: number;
  vm?: string;
  sinossi: string;
  regia: string;
  cast: string[];
  risoluzione: "4K UHD" | "1080p" | "720p";
  hdr: boolean;
  audio: string[];
  canali: string;
  sottotitoli: string[];
  audiodescrizione?: boolean;
  /**
   * Il client non è in grado di riprodurre questo file. Lo sappiamo prima di
   * premere play perché i codec vengono letti in fase di scansione, non al
   * momento della richiesta.
   */
  nonRiproducibile?: string;
  /** Posizione di ripresa in secondi. Presente = "continua a guardare". */
  progressoSec?: number;
  preferito?: boolean;
  aggiuntoIl: string;
  stagioni?: Stagione[];
};

const ep = (
  n: number,
  titolo: string,
  sinossi: string,
  durataMin: number,
  extra: Partial<Episodio> = {},
): Episodio => ({ id: `e${n}-${titolo}`, n, titolo, sinossi, durataMin, ...extra });

export const catalogo: Titolo[] = [
  {
    id: "delitto-a-nord",
    tipo: "film",
    titolo: "Delitto a Nord",
    anno: 2023,
    generi: ["Poliziesco"],
    durataMin: 134,
    vm: "VM14",
    sinossi:
      "Un ispettore prossimo alla pensione riapre un fascicolo che tutti in questura preferirebbero lasciare chiuso.",
    regia: "Chiara Ravelli",
    cast: ["Fabio Manetti", "Nadia Coen"],
    risoluzione: "4K UHD",
    hdr: true,
    audio: ["Italiano", "Inglese"],
    canali: "5.1 surround",
    sottotitoli: ["ITA", "ENG", "ES"],
    audiodescrizione: true,
    progressoSec: 2472,
    preferito: true,
    aggiuntoIl: "2026-08-28",
  },
  {
    id: "fuoco-incrociato",
    tipo: "film",
    titolo: "Fuoco incrociato",
    anno: 2024,
    generi: ["Azione", "Thriller"],
    durataMin: 118,
    vm: "VM14",
    sinossi:
      "Due squadre che non dovrebbero incontrarsi finiscono sullo stesso obiettivo, nella stessa notte.",
    regia: "Marco Vento",
    cast: ["Elia Storti", "Rachele Fumagalli", "Ivan Bregoli"],
    risoluzione: "4K UHD",
    hdr: true,
    audio: ["Italiano", "Inglese"],
    canali: "7.1 surround",
    sottotitoli: ["ITA", "ENG"],
    progressoSec: 1840,
    aggiuntoIl: "2026-09-01",
  },
  {
    id: "la-chiatta",
    tipo: "film",
    titolo: "La chiatta",
    anno: 2021,
    generi: ["Drammatico"],
    durataMin: 96,
    sinossi:
      "Padre e figlio risalgono il fiume su una chiatta da carico, senza avere niente da dirsi fino all'ultimo giorno.",
    regia: "Anna Torresin",
    cast: ["Piero Salvi", "Tommaso Ricci"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano"],
    canali: "Stereo",
    sottotitoli: ["ITA"],
    progressoSec: 3120,
    preferito: true,
    aggiuntoIl: "2026-07-14",
  },
  {
    id: "spazio",
    tipo: "film",
    titolo: "Spazio",
    anno: 2022,
    generi: ["Documentario"],
    durataMin: 88,
    sinossi:
      "Quattro anni dentro il cantiere di un radiotelescopio, dalle fondamenta alla prima immagine.",
    regia: "Giulio Ferrari",
    cast: [],
    risoluzione: "4K UHD",
    hdr: false,
    audio: ["Italiano"],
    canali: "Stereo",
    sottotitoli: ["ITA", "ENG"],
    aggiuntoIl: "2026-08-30",
  },
  {
    id: "campo-lungo",
    tipo: "film",
    titolo: "Campo lungo",
    anno: 2020,
    generi: ["Commedia"],
    durataMin: 104,
    sinossi:
      "Una troupe di provincia gira uno spot per un caseificio e riesce a litigare su ogni singola inquadratura.",
    regia: "Silvia Pastorello",
    cast: ["Gigi Manfredini", "Ornella Zanetti"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano"],
    canali: "5.1 surround",
    sottotitoli: ["ITA"],
    aggiuntoIl: "2026-08-19",
  },
  {
    id: "la-linea-del-sale",
    tipo: "film",
    titolo: "La linea del sale",
    anno: 2019,
    generi: ["Drammatico", "Italiani"],
    durataMin: 127,
    vm: "VM14",
    sinossi:
      "Le saline chiudono e un paese intero deve decidere se restare o smettere di esistere.",
    regia: "Chiara Ravelli",
    cast: ["Nadia Coen", "Renzo Ferretti"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano"],
    canali: "5.1 surround",
    sottotitoli: ["ITA", "ENG"],
    audiodescrizione: true,
    preferito: true,
    aggiuntoIl: "2026-06-02",
  },
  {
    id: "novembre-in-citta",
    tipo: "film",
    titolo: "Novembre in città",
    anno: 2024,
    generi: ["Drammatico"],
    durataMin: 111,
    sinossi:
      "Tre storie che si sfiorano per una settimana di pioggia e non si incontrano mai davvero.",
    regia: "Davide Ferro",
    cast: ["Marta Lisi", "Sandro Bevilacqua"],
    risoluzione: "4K UHD",
    hdr: true,
    audio: ["Italiano", "Francese"],
    canali: "5.1 surround",
    sottotitoli: ["ITA", "FR"],
    aggiuntoIl: "2026-09-03",
  },
  {
    id: "il-turno-di-notte",
    tipo: "film",
    titolo: "Il turno di notte",
    anno: 2023,
    generi: ["Thriller"],
    durataMin: 99,
    vm: "VM14",
    sinossi:
      "Un guardiano notturno si accorge che l'archivio che sorveglia non contiene ciò che dovrebbe.",
    regia: "Marco Vento",
    cast: ["Ivan Bregoli"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano", "Inglese"],
    canali: "5.1 surround",
    sottotitoli: ["ITA", "ENG"],
    aggiuntoIl: "2026-08-25",
  },
  {
    id: "meridiana",
    tipo: "film",
    titolo: "Meridiana",
    anno: 2018,
    generi: ["Drammatico", "Italiani"],
    durataMin: 142,
    sinossi:
      "Un architetto torna nel paese che ha progettato trent'anni prima e non ne riconosce più niente.",
    regia: "Anna Torresin",
    cast: ["Piero Salvi", "Ornella Zanetti"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano"],
    canali: "Stereo",
    sottotitoli: ["ITA"],
    nonRiproducibile:
      "Il video è codificato in VC-1, che questo dispositivo non decodifica. Il file è integro: serve un client capace di riprodurlo.",
    aggiuntoIl: "2026-05-11",
  },
  {
    id: "acqua-alta",
    tipo: "film",
    titolo: "Acqua alta",
    anno: 2025,
    generi: ["Documentario", "Italiani"],
    durataMin: 76,
    sinossi:
      "Una città che convive con la marea, raccontata da chi ogni mattina decide a che ora alzarsi guardando l'acqua.",
    regia: "Giulio Ferrari",
    cast: [],
    risoluzione: "4K UHD",
    hdr: true,
    audio: ["Italiano"],
    canali: "Stereo",
    sottotitoli: ["ITA", "ENG"],
    aggiuntoIl: "2026-09-02",
  },
  {
    id: "le-regole-del-gioco",
    tipo: "film",
    titolo: "Le regole del gioco",
    anno: 2022,
    generi: ["Commedia"],
    durataMin: 93,
    sinossi:
      "Un torneo di scacchi di quartiere diventa il pretesto per regolare vent'anni di conti in sospeso.",
    regia: "Silvia Pastorello",
    cast: ["Gigi Manfredini", "Marta Lisi"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano"],
    canali: "Stereo",
    sottotitoli: ["ITA"],
    aggiuntoIl: "2026-07-30",
  },
  {
    id: "controra",
    tipo: "film",
    titolo: "Controra",
    anno: 2021,
    generi: ["Poliziesco", "Italiani"],
    durataMin: 121,
    vm: "VM14",
    sinossi:
      "Nelle ore più calde del pomeriggio un paese del sud si ferma, e qualcuno ne approfitta.",
    regia: "Davide Ferro",
    cast: ["Fabio Manetti", "Renzo Ferretti"],
    risoluzione: "4K UHD",
    hdr: false,
    audio: ["Italiano"],
    canali: "5.1 surround",
    sottotitoli: ["ITA"],
    aggiuntoIl: "2026-08-08",
  },

  // ── Serie ──
  {
    id: "linea-di-costa",
    tipo: "serie",
    titolo: "Linea di costa",
    anno: 2022,
    generi: ["Drammatico"],
    vm: "VM14",
    sinossi:
      "Tre stagioni lungo lo stesso tratto di costa, seguendo chi ci resta e chi non riesce ad andarsene.",
    regia: "Anna Torresin",
    cast: ["Marta Lisi", "Elia Storti", "Renzo Ferretti"],
    risoluzione: "4K UHD",
    hdr: true,
    audio: ["Italiano", "Inglese"],
    canali: "5.1 surround",
    sottotitoli: ["ITA", "ENG", "ES"],
    audiodescrizione: true,
    progressoSec: 1388,
    preferito: true,
    aggiuntoIl: "2026-08-31",
    stagioni: [
      {
        n: 1,
        episodi: [
          ep(1, "Bassa marea", "L'estate finisce prima del previsto e il porto resta vuoto.", 52, { visto: true }),
          ep(2, "Il faro", "Una segnalazione notturna che nessuno ha registrato.", 49, { visto: true }),
          ep(3, "Scogliera", "Chi ha visto qualcosa decide di non dirlo.", 51, { visto: true }),
          ep(4, "Fondale", "Il mare restituisce ciò che era stato lasciato andare.", 55, { visto: true }),
        ],
      },
      {
        n: 2,
        episodi: [
          ep(1, "Ritorno", "Dopo due anni qualcuno rientra senza avvisare.", 50, { visto: true }),
          ep(2, "Cantiere", "Il progetto sul lungomare divide il paese in due.", 47, { visto: true }),
          ep(3, "Acqua ferma", "Una settimana senza vento e senza notizie.", 53, { visto: true }),
          ep(4, "Corrente", "Le versioni non coincidono più.", 56, { progressoSec: 1388 }),
          ep(5, "Risacca", "Quello che torna a riva non è quello che era partito.", 51),
          ep(6, "Mareggiata", "La stagione si chiude nel modo peggiore.", 58),
        ],
      },
      {
        n: 3,
        episodi: [
          ep(1, "Terra battuta", "Un anno dopo, il cantiere è fermo.", 49),
          ep(2, "Bonaccia", "Nessuno vuole essere il primo a parlare.", 52),
          ep(3, "Ultimo molo", "Il conto arriva a tutti insieme.", 61),
        ],
      },
    ],
  },
  {
    id: "vetro-e-cemento",
    tipo: "serie",
    titolo: "Vetro e cemento",
    anno: 2024,
    generi: ["Poliziesco"],
    vm: "VM14",
    sinossi:
      "Una squadra della edilizia indaga su cantieri che crollano prima di essere finiti.",
    regia: "Marco Vento",
    cast: ["Ivan Bregoli", "Rachele Fumagalli"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano"],
    canali: "5.1 surround",
    sottotitoli: ["ITA"],
    aggiuntoIl: "2026-08-27",
    stagioni: [
      {
        n: 1,
        episodi: [
          ep(1, "Fondamenta", "Il primo crollo sembra un incidente.", 46),
          ep(2, "Armatura", "Il secondo no.", 48),
          ep(3, "Gettata", "Le firme sui collaudi portano tutte allo stesso nome.", 45),
          ep(4, "Collaudo", "Chi doveva controllare guardava altrove.", 50),
        ],
      },
    ],
  },
  {
    id: "stazione-centrale",
    tipo: "serie",
    titolo: "Stazione centrale",
    anno: 2023,
    generi: ["Commedia"],
    sinossi:
      "Il personale di una grande stazione ferroviaria, raccontato fra un ritardo e l'altro.",
    regia: "Silvia Pastorello",
    cast: ["Gigi Manfredini", "Ornella Zanetti", "Sandro Bevilacqua"],
    risoluzione: "1080p",
    hdr: false,
    audio: ["Italiano"],
    canali: "Stereo",
    sottotitoli: ["ITA"],
    progressoSec: 640,
    aggiuntoIl: "2026-08-12",
    stagioni: [
      {
        n: 1,
        episodi: [
          ep(1, "Binario dispari", "Il primo giorno del nuovo capostazione.", 28, { visto: true }),
          ep(2, "Coincidenza", "Due treni, un solo binario libero.", 27, { progressoSec: 640 }),
          ep(3, "Deposito bagagli", "Qualcosa nel deposito non è mai stato ritirato.", 29),
          ep(4, "Ultimo treno", "Nessuno vuole chiudere il turno.", 31),
        ],
      },
      {
        n: 2,
        episodi: [
          ep(1, "Sciopero", "Otto ore di silenzio assoluto.", 30),
          ep(2, "Sottopasso", "Il tratto che nessuno vuole sorvegliare.", 28),
        ],
      },
    ],
  },
  {
    id: "il-registro",
    tipo: "serie",
    titolo: "Il registro",
    anno: 2025,
    generi: ["Drammatico", "Italiani"],
    sinossi:
      "Un archivio comunale conserva ottant'anni di storie che qualcuno vorrebbe riordinare.",
    regia: "Davide Ferro",
    cast: ["Nadia Coen", "Piero Salvi"],
    risoluzione: "4K UHD",
    hdr: true,
    audio: ["Italiano"],
    canali: "5.1 surround",
    sottotitoli: ["ITA", "ENG"],
    aggiuntoIl: "2026-09-04",
    stagioni: [
      {
        n: 1,
        episodi: [
          ep(1, "Faldone uno", "La prima scatola è vuota.", 54),
          ep(2, "Protocollo", "Manca una firma su un documento del 1961.", 51),
          ep(3, "Scarto", "Ciò che si butta dice più di ciò che si tiene.", 57),
        ],
      },
    ],
  },
];

export const generi = [
  "Azione",
  "Commedia",
  "Poliziesco",
  "Drammatico",
  "Documentario",
  "Thriller",
  "Italiani",
];

// ── Selettori ──

export const byId = (id: string) => catalogo.find((t) => t.id === id);

export const film = () => catalogo.filter((t) => t.tipo === "film");
export const serie = () => catalogo.filter((t) => t.tipo === "serie");

export const daRiprendere = () =>
  catalogo.filter((t) => t.progressoSec != null);

export const aggiuntiDiRecente = () =>
  [...catalogo].sort((a, b) => b.aggiuntoIl.localeCompare(a.aggiuntoIl)).slice(0, 9);

export const preferiti = () => catalogo.filter((t) => t.preferito);

export const perGenere = (g: string) => catalogo.filter((t) => t.generi.includes(g));

export const cerca = (q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return catalogo.filter(
    (t) =>
      t.titolo.toLowerCase().includes(s) ||
      t.regia.toLowerCase().includes(s) ||
      t.cast.some((c) => c.toLowerCase().includes(s)) ||
      t.generi.some((g) => g.toLowerCase().includes(s)),
  );
};

/** "Dallo stesso autore" e "Da vedere dopo": sola query sui metadati. */
export const correlati = (t: Titolo) =>
  catalogo.filter(
    (x) =>
      x.id !== t.id &&
      (x.regia === t.regia || x.generi.some((g) => t.generi.includes(g))),
  );

/** Il prossimo episodio non ancora visto, con l'eventuale ripresa. */
export const prossimoEpisodio = (t: Titolo) => {
  if (!t.stagioni) return null;
  for (const s of t.stagioni) {
    for (const e of s.episodi) {
      if (e.progressoSec != null) return { stagione: s.n, episodio: e };
      if (!e.visto) return { stagione: s.n, episodio: e };
    }
  }
  return null;
};

// ── Formattazione ──

export const durataUmana = (min: number) => `${min} minuti`;

export const mmss = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const hhmmss = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
};

export const metaRiga = (t: Titolo) => {
  if (t.tipo === "serie") {
    const st = t.stagioni?.length ?? 0;
    const epTot = t.stagioni?.reduce((n, s) => n + s.episodi.length, 0) ?? 0;
    return [
      `${st} ${st === 1 ? "stagione" : "stagioni"}`,
      `${epTot} episodi`,
      ...t.generi,
      t.vm,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [String(t.anno), ...t.generi, durataUmana(t.durataMin ?? 0), t.vm]
    .filter(Boolean)
    .join(" · ");
};
