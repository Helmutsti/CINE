/* Stato dell'app: profili, lista, avanzamenti, libreria. Vive solo in memoria: ricaricando la pagina riparte da capo. */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { film, serie, titoli, trovaEpisodio, type Titolo } from './dati'

export interface Profilo {
  id: string
  nome: string
  nascondi18: boolean
  pin: string | null
  /** foto del profilo (ritratti liberi: randomuser.me e Wikimedia Commons) */
  foto?: string
}

/** Punto raggiunto: per un film l'id del film, per una serie l'id dell'episodio. */
export interface Avanzamento {
  id: string
  /** secondi visti */
  pos: number
  /** quando: serve a ordinare la riga Riprendi */
  quando: number
}

interface DatiProfilo {
  lista: string[]
  avanzamenti: Record<string, Avanzamento>
  visti: string[]
}

export interface Stato {
  profili: Profilo[]
  profiloId: string | null
  ultimoProfiloId: string
  dati: Record<string, DatiProfilo>
  cartelle: string[]
  aggiornatoIl: Record<string, number>
}

const ora = Date.now()
const f = (n: string) => film.find((x) => x.titolo.startsWith(n))?.id
const s = (n: string) => serie.find((x) => x.titolo === n)

function avviaManuel(): DatiProfilo {
  const av: Record<string, Avanzamento> = {}
  const visti: string[] = []
  const mettiFilm = (n: string, frazione: number, quando: number) => {
    const id = f(n)
    const t = id && film.find((x) => x.id === id)
    if (t) av[t.id] = { id: t.id, pos: Math.round((t.minuti ?? 90) * 60 * frazione), quando: ora - quando }
  }
  const mettiSerie = (n: string, st: number, ep: number, frazione: number, quando: number) => {
    const x = s(n)
    const stagione = x?.stagioni.find((y) => y.numero === st)
    const e = stagione?.episodi.find((y) => y.numero === ep)
    if (!x || !stagione || !e) return
    for (const y of x.stagioni) for (const z of y.episodi) if (y.numero < st || (y.numero === st && z.numero < ep)) visti.push(z.id)
    av[x.id] = { id: e.id, pos: Math.round(e.minuti * 60 * frazione), quando: ora - quando }
  }
  mettiSerie('Dark', 1, 4, 0.3, 1000)
  mettiFilm('Sintel', 0.55, 2000)
  mettiSerie('Scissione', 1, 2, 0.7, 3000)
  mettiFilm('Nosferatu', 0.25, 4000)
  mettiSerie('Babylon Berlin', 2, 1, 0.45, 5000)
  mettiFilm('La signora del venerdì', 0.8, 6000)
  return {
    lista: [f('Metropolis'), s('Chernobyl')?.id, f('Sciarada'), s('The Bear')?.id, f('La vita è meravigliosa'), f('Il monello')].filter(
      (x): x is string => !!x,
    ),
    avanzamenti: av,
    visti,
  }
}

const iniziale: Stato = {
  profili: [
    { id: 'manuel', nome: 'Manuel', nascondi18: false, pin: '1234', foto: 'media/profili/manuel.jpg' },
    { id: 'giulia', nome: 'Giulia', nascondi18: false, pin: '1234', foto: 'media/profili/giulia.jpg' },
    { id: 'bambini', nome: 'Bambini', nascondi18: true, pin: null, foto: 'media/profili/bambini.jpg' },
    { id: 'luca', nome: 'Luca', nascondi18: false, pin: '1234' },
  ],
  profiloId: null,
  ultimoProfiloId: 'manuel',
  dati: {
    manuel: avviaManuel(),
    giulia: { lista: [], avanzamenti: {}, visti: [] },
    bambini: { lista: [], avanzamenti: {}, visti: [] },
    luca: { lista: [], avanzamenti: {}, visti: [] },
  },
  cartelle: ['Film · /media/Film', 'Serie · /media/Serie'],
  aggiornatoIl: {},
}

function useStatoInterno() {
  const [st, set] = useState<Stato>(iniziale)
  const profilo = st.profili.find((p) => p.id === st.profiloId) ?? null
  const dati = st.dati[st.profiloId ?? st.ultimoProfiloId] ?? { lista: [], avanzamenti: {}, visti: [] }

  const azioni = useMemo(() => {
    const cambiaDati = (fn: (d: DatiProfilo) => DatiProfilo) =>
      set((x) => {
        const id = x.profiloId ?? x.ultimoProfiloId
        return { ...x, dati: { ...x.dati, [id]: fn(x.dati[id]) } }
      })
    return {
      entra: (id: string) => set((x) => ({ ...x, profiloId: id, ultimoProfiloId: id })),
      esci: () => set((x) => ({ ...x, profiloId: null })),
      cambiaLista: (id: string) =>
        cambiaDati((d) => ({ ...d, lista: d.lista.includes(id) ? d.lista.filter((y) => y !== id) : [id, ...d.lista] })),
      /** salva il punto: idTitolo è il film o la serie, idPunto il film o l'episodio */
      salvaPunto: (idTitolo: string, idPunto: string, pos: number, durata: number) =>
        cambiaDati((d) => {
          const av = { ...d.avanzamenti }
          const finito = pos >= durata - 60
          if (finito) delete av[idTitolo]
          else if (pos > 30) av[idTitolo] = { id: idPunto, pos, quando: Date.now() }
          const visti = finito && !d.visti.includes(idPunto) ? [...d.visti, idPunto] : d.visti
          return { ...d, avanzamenti: av, visti }
        }),
      ricomincia: (idTitolo: string) =>
        cambiaDati((d) => {
          const av = { ...d.avanzamenti }
          delete av[idTitolo]
          return { ...d, avanzamenti: av }
        }),
      cambiaProfilo: (id: string, modifica: Partial<Profilo>) =>
        set((x) => ({ ...x, profili: x.profili.map((p) => (p.id === id ? { ...p, ...modifica } : p)) })),
      aggiungiProfilo: (nome: string) => {
        const id = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
        set((x) => ({
          ...x,
          profili: [...x.profili, { id, nome, nascondi18: false, pin: null }],
          dati: { ...x.dati, [id]: { lista: [], avanzamenti: {}, visti: [] } },
        }))
        return id
      },
      eliminaProfilo: (id: string) => set((x) => ({ ...x, profili: x.profili.filter((p) => p.id !== id) })),
      aggiungiCartella: () =>
        set((x) => ({ ...x, cartelle: [...x.cartelle, `Altro · /media/Nuova cartella ${x.cartelle.length + 1}`] })),
      togliCartella: (c: string) => set((x) => ({ ...x, cartelle: x.cartelle.filter((y) => y !== c) })),
      segnaAggiornato: (id: string) => set((x) => ({ ...x, aggiornatoIl: { ...x.aggiornatoIl, [id]: Date.now() } })),
    }
  }, [])

  /** I titoli che questo profilo può vedere (18+ nascosti, libreria vuota). */
  const visibili = useMemo(() => {
    if (st.cartelle.length === 0) return new Set<string>()
    return new Set(titoli.filter((t) => !(profilo?.nascondi18 && t.eta === '18+')).map((t) => t.id))
  }, [profilo, st.cartelle.length])

  const puo = (t: Titolo | undefined | null): t is Titolo => !!t && visibili.has(t.id)

  /** La riga "Riprendi da dove eri", dal più recente. */
  const riprendi = Object.entries(dati.avanzamenti)
    .sort((a, b) => b[1].quando - a[1].quando)
    .map(([idTitolo, av]) => ({ titolo: titoli.find((t) => t.id === idTitolo)!, av }))
    .filter((x) => puo(x.titolo))

  return { st, profilo, dati, azioni, puo, riprendi, trovaEpisodio }
}

type Ctx = ReturnType<typeof useStatoInterno>
const Contesto = createContext<Ctx | null>(null)

export function StatoProvider({ children }: { children: ReactNode }) {
  const v = useStatoInterno()
  return <Contesto.Provider value={v}>{children}</Contesto.Provider>
}

export function useStato() {
  return useContext(Contesto)!
}
