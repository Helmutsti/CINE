/* Pila delle schermate. Indietro torna alla precedente, con il fuoco sull'elemento da cui si era partiti. */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { aggiungiGestore, corrente, mettiId, primo } from './fuoco'

export type Sezione = 'cerca' | 'home' | 'film' | 'serie' | 'collezioni' | 'lista'

export type Voce =
  | { s: 'profili' }
  | { s: Sezione }
  | { s: 'titolo'; id: string }
  | { s: 'collezione'; id: string }
  | { s: 'attore'; id: string }
  /** id: il film o l'episodio da riprodurre; trailer: un trailer (locale o su YouTube) */
  | { s: 'player'; id: string; daCapo?: boolean; trailer?: { id?: string; youtube?: string; titolo: string } }
  | { s: 'raccolta'; nome: string; occhiello: string; generi?: string[]; ids?: string[] }
  | { s: 'impostazioni'; sezione?: 'libreria' | 'profili' }
  /** SC-19: nome di una collezione nuova, o rinomina (id e nome della collezione) */
  | { s: 'nome-collezione'; id?: string; nome?: string }
  /** SC-20: aggiungere e togliere titoli; nuova: si arriva da SC-19 e Fine apre la collezione */
  | { s: 'titoli-collezione'; id: string; nuova?: boolean }

type Elemento = Voce & { fuoco?: string; chiave: number }

let chiavi = 0
const SEZIONI: Sezione[] = ['cerca', 'home', 'film', 'serie', 'collezioni', 'lista']

function useNavInterna() {
  const [pila, setPila] = useState<Elemento[]>([{ s: 'profili', chiave: chiavi++ }])
  const pilaRef = useRef(pila)
  pilaRef.current = pila

  const az = useMemo(() => {
    const salvaFuoco = (p: Elemento[]) => {
      const f = corrente()?.dataset.f
      return p.map((x, i) => (i === p.length - 1 ? { ...x, fuoco: f } : x))
    }
    return {
      vai: (v: Voce) =>
        setPila((p) => {
          if (SEZIONI.includes(v.s as Sezione)) {
            // le sezioni del menu sono sorelle: si parte sempre dalla Home
            const home = p.find((x) => x.s === 'home')
            const base = home && p[p.length - 1].s === 'home' ? salvaFuoco([home])[0] : home
            return v.s === 'home'
              ? [{ s: 'home', chiave: base?.chiave ?? chiavi++ }]
              : [base ?? { s: 'home', chiave: chiavi++ }, { ...v, chiave: chiavi++ }]
          }
          return [...salvaFuoco(p), { ...v, chiave: chiavi++ }]
        }),
      /** cambia i dati della schermata in cima senza riaprirla (per ritrovarla uguale tornando indietro) */
      aggiornaCima: (v: Partial<Voce>) => setPila((p) => [...p.slice(0, -1), { ...p[p.length - 1], ...v } as Elemento]),
      sostituisci: (v: Voce) => setPila((p) => [...p.slice(0, -1), { ...v, chiave: chiavi++ }]),
      ricomincia: (v: Voce) => setPila([{ ...v, chiave: chiavi++ }]),
      indietro: () => {
        if (pilaRef.current.length <= 1) return false
        setPila((p) => p.slice(0, -1))
        return true
      },
    }
  }, [])

  useEffect(() => aggiungiGestore((t) => (t === 'indietro' ? az.indietro() : false)), [az])

  return { pila, cima: pila[pila.length - 1], ...az }
}

type Ctx = ReturnType<typeof useNavInterna>
const Contesto = createContext<Ctx | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const v = useNavInterna()
  return <Contesto.Provider value={v}>{children}</Contesto.Provider>
}

export function useNav() {
  return useContext(Contesto)!
}

/** All'apertura di una schermata: il fuoco torna dov'era, altrimenti va sull'elemento indicato. */
export function useFuocoIniziale(id?: string | null, dipendenze: unknown[] = []) {
  const { cima } = useNav()
  const fatto = useRef(false)
  useLayoutEffect(() => {
    // i dati arrivano dal server con un attimo di ritardo: il fuoco si mette appena c'è dove metterlo,
    // e poi non si sposta più da solo (a meno che l'elemento a fuoco sparisca)
    if (fatto.current && corrente()) return
    const ok = (!fatto.current && mettiId(cima.fuoco)) || mettiId(id) || (id !== null && primo())
    if (ok) fatto.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dipendenze)
}

/** Registra un gestore dei tasti per la durata del componente. */
export function useTasti(g: Parameters<typeof aggiungiGestore>[0], dipendenze: unknown[] = [], prima = false) {
  const ref = useRef(g)
  ref.current = g
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => aggiungiGestore((t, e) => ref.current(t, e), prima), dipendenze)
}
