/*
 * SC-03 Home a sezioni (2026-10-16): Hero · Continua a guardare · Collezioni · La mia lista · Intero catalogo.
 *
 * Una sezione alla volta, a tutto schermo; il contenuto sta fra due bande vuote (0–160 e 920–1080).
 * Dentro la sezione ↑ ↓ passano da un livello all'altro ([data-strato]), ← → si muovono nel livello.
 * Finiti i livelli si passa alla sezione sopra o sotto: quella che lascia si stringe verso la banda,
 * quella che arriva si allarga dalla banda, e lo sfondo cambia con una dissolvenza.
 * ← dal primo elemento a sinistra apre il menu laterale (per ora solo Cerca e il profilo).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import type { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import { Avanzamento, Card, CaricamentoPagina, Finestra, GruppoPulsanti, Icona, Pulsante, Tendina } from '../componenti'
import { durata, iniziali } from '../dati'
import { api, dimentica, locandina, orizzontale, secondi, sfondo, useCarica } from '../jf'
import { corrente, livello, metti, mettiId } from '../fuoco'
import { useNav, useTasti } from '../nav'
import { useStato } from '../stato'
import { CAMPI, episodioDaGuardare, restano, sigla, useAzionePrincipale } from './comune'
import { useRipresa } from './Ripresa'
import { RigaDati } from './Titolo'
import { useGriglia } from './Griglia'
import { AzioniElimina } from './Collezioni'
import { CambiaImmagini } from './Immagini'
import { dimenticaCollezioni } from './EditorCollezioni'

type Chiave = 'hero' | 'continua' | 'collezioni' | 'lista' | 'catalogo'

const ORDINI: { id: string; testo: string; sortBy: ItemSortBy[]; sortOrder: SortOrder[] }[] = [
  { id: 'titolo', testo: 'Titolo A–Z', sortBy: ['SortName'], sortOrder: ['Ascending'] },
  { id: 'recenti', testo: 'Aggiunti di recente', sortBy: ['DateCreated', 'SortName'], sortOrder: ['Descending', 'Ascending'] },
  { id: 'anno', testo: 'Anno di uscita', sortBy: ['ProductionYear', 'SortName'], sortOrder: ['Descending', 'Ascending'] },
  { id: 'voto', testo: 'Voto', sortBy: ['CommunityRating', 'SortName'], sortOrder: ['Descending', 'Ascending'] },
  { id: 'durata', testo: 'Durata', sortBy: ['Runtime', 'SortName'], sortOrder: ['Descending', 'Ascending'] },
]
const COLONNE = 6

/** Tornando alla Home (da una scheda, dal player) si ritrovano la sezione e i titoli scelti. */
const ricordo = { uid: '', sezione: 'hero' as Chiave, hero: 0, continua: 0, collezione: 0, lista: 0, ordine: 'titolo' }

// ---------- livelli della sezione ----------
const memoriaStrati = new Map<string, string>()
/** I livelli della sezione in fuoco, dall'alto in basso come si vedono (non nell'ordine del codice). */
const strati = () =>
  [...livello().querySelectorAll<HTMLElement>('[data-strato]')]
    .map((s) => ({ s, y: s.getBoundingClientRect().top }))
    .sort((a, b) => a.y - b.y)
    .map((x) => x.s)
const elementi = (s: HTMLElement) => [...s.querySelectorAll<HTMLElement>('[data-f]')]

/** Entra in un livello: sull'ultimo elemento scelto lì, altrimenti sul preferito o sul primo.
 *  Nelle righe della griglia si resta nella stessa colonna. */
function entra(s: HTMLElement, da?: HTMLElement | null) {
  const el = elementi(s)
  if (!el.length) return false
  if (da && s.dataset.colonne !== undefined) {
    const prima = da.closest<HTMLElement>('[data-strato]')
    if (prima?.dataset.colonne !== undefined) return metti(el[Math.min(elementi(prima).indexOf(da), el.length - 1)])
  }
  const id = memoriaStrati.get(s.dataset.strato!)
  const ricordato = id ? el.find((e) => e.dataset.f === id) : undefined
  return metti(ricordato ?? el.find((e) => e.dataset.fpref !== undefined) ?? el[0])
}

/** Entrando in una sezione dall'alto si parte dal livello d'ingresso, dal basso dall'ultimo. */
function entraSezione(dalBasso: boolean) {
  const ss = strati()
  const ordine = dalBasso ? [...ss].reverse() : [ss.find((s) => s.dataset.ingresso !== undefined), ...ss].filter(Boolean)
  for (const s of ordine) if (entra(s!)) return true
  return false
}

export function Home() {
  const nav = useNav()
  const { uid, profilo } = useStato()
  const ripresa = useRipresa()
  const lib = getLibraryApi(api)
  if (ricordo.uid !== uid) Object.assign(ricordo, { uid, sezione: 'hero', hero: 0, continua: 0, collezione: 0, lista: 0, ordine: 'titolo' })

  // ---------- dati ----------
  const evidenza = useCarica(`home:evidenza:${uid}`, async () =>
    (await lib.getItems({ userId: uid, includeItemTypes: ['Movie', 'Series'], recursive: true, sortBy: ['Random'], limit: 6, imageTypes: ['Backdrop'], hasOverview: true, fields: [...CAMPI, 'MediaStreams'] })).data.Items ?? [],
  )
  const riprendi = useCarica(`home:riprendi:${uid}`, async () =>
    (await lib.getResumeItems({ userId: uid, mediaTypes: ['Video'], limit: 16, fields: [...CAMPI], enableUserData: true })).data.Items ?? [],
  )
  const collezioni = useCarica(`home:collezioni:${uid}`, async () =>
    (await lib.getItems({ userId: uid, includeItemTypes: ['BoxSet'], recursive: true, sortBy: ['SortName'], fields: ['ChildCount', 'Overview'] })).data.Items ?? [],
  )
  const lista = useCarica(`home:lista:${uid}`, async () =>
    (await lib.getItems({ userId: uid, isFavorite: true, includeItemTypes: ['Movie', 'Series'], recursive: true, sortBy: ['DateCreated'], sortOrder: ['Descending'], limit: 40, fields: [...CAMPI, 'MediaStreams'] })).data.Items ?? [],
  )

  // ---------- stato delle sezioni ----------
  const [sezione, setSezione] = useState<Chiave>(ricordo.sezione)
  const [heroN, setHeroN] = useState(ricordo.hero)
  const [contSel, setContSel] = useState(ricordo.continua)
  const [collSel, setCollSel] = useState(ricordo.collezione)
  const [listaSel, setListaSel] = useState(ricordo.lista)
  const [ordine, setOrdine] = useState(ricordo.ordine)
  Object.assign(ricordo, { sezione, hero: heroN, continua: contSel, collezione: collSel, lista: listaSel, ordine })
  const [toccato, setToccato] = useState(false)
  const [menu, setMenu] = useState(false)
  const [finestra, setFinestra] = useState<null | { tipo: 'elimina' | 'immagini'; c: BaseItemDto }>(null)
  const [elimino, setElimino] = useState(false)

  const pronto = evidenza.pronto && riprendi.pronto && collezioni.pronto && lista.pronto
  const titoli = evidenza.dati ?? []
  const elCont = riprendi.dati ?? []
  const elColl = collezioni.dati ?? []
  const elLista = lista.dati ?? []
  const sezioni: Chiave[] = pronto
    ? ([titoli.length && 'hero', elCont.length && 'continua', elColl.length && 'collezioni', elLista.length && 'lista', 'catalogo'].filter(Boolean) as Chiave[])
    : []
  const attiva = Math.max(0, sezioni.indexOf(sezione))
  const chiaveAttiva = sezioni[attiva]

  const eroe = titoli[heroN % Math.max(1, titoli.length)]
  const cont = elCont[Math.min(contSel, elCont.length - 1)]
  const coll = elColl[Math.min(collSel, elColl.length - 1)]
  const vLista = elLista[Math.min(listaSel, elLista.length - 1)]

  const filmColl = useCarica(coll ? `collezione-film:${uid}:${coll.Id}` : null, async () =>
    (await lib.getItems({ userId: uid, parentId: coll!.Id!, sortBy: ['PremiereDate', 'ProductionYear', 'SortName'], fields: [...CAMPI] })).data.Items ?? [],
  )
  /** la collezione mostrata cambia quando i suoi film sono arrivati: testo, locandine e sfondo insieme */
  const [mostrata, setMostrata] = useState<{ c: BaseItemDto; film: BaseItemDto[] } | null>(null)
  if (coll && filmColl.dati && (mostrata?.c !== coll || mostrata.film !== filmColl.dati)) setMostrata({ c: coll, film: filmColl.dati })

  const ordineScelto = ORDINI.find((o) => o.id === ordine) ?? ORDINI[0]
  const catalogo = useGriglia(`home:catalogo:${uid}:${ordine}`, async (start, quanti) => {
    const r = await lib.getItems({
      userId: uid,
      includeItemTypes: ['Movie', 'Series'],
      recursive: true,
      sortBy: ordineScelto.sortBy,
      sortOrder: ordineScelto.sortOrder,
      startIndex: start,
      limit: quanti,
      fields: [...CAMPI],
      enableTotalRecordCount: true,
    })
    return { el: r.data.Items ?? [], totale: r.data.TotalRecordCount ?? 0 }
  })

  // ---------- lo sfondo della sezione in fuoco ----------
  const sfondoDi = (k: Chiave | undefined): string | null => {
    if (k === 'hero') return eroe ? sfondo(eroe) : null
    if (k === 'continua') return cont ? (cont.Type === 'Episode' ? orizzontale(cont, 1920) : sfondo(cont)) : null
    if (k === 'collezioni') return mostrata ? sfondo(mostrata.c) || (mostrata.film[0] && sfondo(mostrata.film[0])) || null : null
    if (k === 'lista') return vLista ? sfondo(vLista) : null
    return null
  }

  // gli sfondi del carosello si caricano subito: cambiando titolo l'immagine c'è già
  useEffect(() => {
    for (const t of titoli) {
      const u = sfondo(t)
      if (u) new Image().src = u
    }
  }, [titoli])

  // ---------- il titolo in evidenza cambia da solo ogni 8 s, finché non si tocca il telecomando ----------
  useEffect(() => {
    if (toccato || chiaveAttiva !== 'hero' || titoli.length < 2) return
    const t = setInterval(() => setHeroN((x) => (x + 1) % titoli.length), 8000)
    return () => clearInterval(t)
  }, [toccato, chiaveAttiva, titoli.length])

  // cambiando titolo i pulsanti dell'Hero si rifanno: il fuoco torna sullo stesso pulsante
  const fuocoHero = useRef<string | undefined>(undefined)
  useLayoutEffect(() => {
    if (chiaveAttiva !== 'hero' || corrente()) return
    if (!mettiId(fuocoHero.current)) entraSezione(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroN])

  // ---------- fuoco all'apertura e al cambio di sezione ----------
  const ingresso = useRef<'alto' | 'basso' | 'ricordo'>('ricordo')
  const primoFuoco = useRef(false)
  useLayoutEffect(() => {
    if (!pronto) return
    if (!primoFuoco.current) {
      primoFuoco.current = true
      if (mettiId(nav.cima.fuoco)) return
      entraSezione(false)
      return
    }
    if (ingresso.current !== 'ricordo') entraSezione(ingresso.current === 'basso')
    ingresso.current = 'ricordo'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, chiaveAttiva])

  const cambia = (dir: 1 | -1) => {
    const k = sezioni[attiva + dir]
    if (!k) return
    ingresso.current = dir > 0 ? 'alto' : 'basso'
    setSezione(k)
  }

  const fuocoPrimaDelMenu = useRef<string | undefined>(undefined)
  const apriMenu = () => {
    fuocoPrimaDelMenu.current = corrente()?.dataset.f
    setMenu(true)
  }

  useTasti((t) => {
    if (!t || !pronto) return false
    // una finestra o un menu aperto sopra la Home: decide la navigazione normale
    if (!livello().classList.contains('sezione-home')) return false
    if (chiaveAttiva === 'hero' && !toccato) setToccato(true)
    const da = corrente()
    const strato = da?.closest<HTMLElement>('[data-strato]')
    if (t === 'indietro') return false
    if (t === 'ok') return false
    if (!da || !strato) return entraSezione(false), true
    if (t === 'sinistra' || t === 'destra') {
      // Hero: i pulsanti scorrono anche il carosello. ← sul primo pulsante = titolo precedente
      // (sul primo titolo apre il menu), → sull'ultimo = titolo successivo; fra i due pulsanti ← → li cambiano
      if (strato.dataset.strato === 'hero-pulsanti' && titoli.length > 1) {
        const el = elementi(strato)
        const i = el.indexOf(da)
        if (t === 'destra' && i === el.length - 1) return setHeroN((x) => (x + 1) % titoli.length), true
        if (t === 'sinistra' && i === 0) {
          if (heroN % titoli.length > 0) setHeroN((x) => x - 1)
          else apriMenu()
          return true
        }
      }
      const el = elementi(strato)
      const v = el[el.indexOf(da) + (t === 'destra' ? 1 : -1)]
      if (v) metti(v)
      else if (t === 'sinistra') apriMenu()
      return true
    }
    const ss = strati()
    const dir = t === 'giu' ? 1 : -1
    for (let i = ss.indexOf(strato) + dir; i >= 0 && i < ss.length; i += dir) if (entra(ss[i], da)) return true
    cambia(dir)
    return true
  }, [pronto, chiaveAttiva, heroN, titoli.length, toccato, attiva, sezioni.join()])

  // ---------- azioni ----------
  const apri = (t: BaseItemDto) => nav.vai({ s: t.Type === 'BoxSet' ? 'collezione' : 'titolo', id: t.Id! })
  /** OK su una card: parte il titolo (per una serie l'episodio da cui ripartire); se è iniziato, Riprendi o Ricomincia */
  const avviaTitolo = async (t: BaseItemDto, fid: string) => {
    let v: BaseItemDto | null = t
    if (t.Type === 'Series') v = await episodioDaGuardare(uid, t.Id!)
    if (!v) return apri(t)
    const pos = secondi(v.UserData?.PlaybackPositionTicks)
    const cosa = v.Type === 'Episode' ? `${v.SeriesName ?? ''} · ${sigla(v)}` : (v.Name ?? '')
    ripresa.avvia({ s: 'player', id: v.Id! }, pos > 0, { pos, durata: secondi(v.RunTimeTicks), cosa }, fid)
  }
  const tornaDopo = (fid: string) => setTimeout(() => mettiId(fid))

  const vuota = pronto && titoli.length === 0 && catalogo.totale === 0
  if (vuota) {
    return (
      <div className="schermata" data-livello>
        <div className="vuoto">
          <h1 className="t-titolo-pagina" style={{ margin: 0 }}>La libreria è vuota</h1>
          <p className="t-sinossi c-2">Sul server Jellyfin non ci sono ancora film o serie per questo profilo.</p>
          <Pulsante fid="vuota-impostazioni" tipo="principale" pref onOk={() => nav.vai({ s: 'impostazioni', sezione: 'libreria' })}>
            Vai alle impostazioni della libreria
          </Pulsante>
        </div>
      </div>
    )
  }

  const contenuto = (k: Chiave): ReactNode => {
    switch (k) {
      case 'hero':
        return eroe && <SezioneHero t={eroe} n={heroN % titoli.length} totale={titoli.length} ripresa={ripresa} />
      case 'continua':
        return (
          <SezioneTitoli
            k="cont"
            etichetta="Continua a guardare"
            senzaTrama
            el={elCont}
            sel={Math.min(contSel, elCont.length - 1)}
            onSel={setContSel}
            card={(t, i) => {
              const pos = secondi(t.UserData?.PlaybackPositionTicks)
              const tot = secondi(t.RunTimeTicks)
              const ep = t.Type === 'Episode'
              return (
                <Card
                  key={t.Id}
                  fid={`cont-${i}`}
                  formato="orizzontale"
                  img={orizzontale(t)}
                  titolo={ep ? (t.SeriesName ?? t.Name ?? '') : (t.Name ?? '')}
                  meta={ep ? `${sigla(t)} · ${restano(tot - pos)}` : restano(tot - pos)}
                  avanzamento={tot ? pos / tot : 0}
                  onOk={() => avviaTitolo(t, `cont-${i}`)}
                />
              )
            }}
          />
        )
      case 'collezioni':
        return (
          mostrata && (
            <SezioneCollezioni
              el={elColl}
              sel={Math.min(collSel, elColl.length - 1)}
              onSel={setCollSel}
              mostrata={mostrata}
              ripresa={ripresa}
              modifica={!!profilo?.collezioni}
              onApri={apri}
              onModifica={(v) => {
                if (v === 'rinomina') nav.vai({ s: 'nome-collezione', id: coll.Id!, nome: coll.Name ?? '' })
                else if (v === 'titoli') nav.vai({ s: 'titoli-collezione', id: coll.Id! })
                else setFinestra({ tipo: v === 'immagini' ? 'immagini' : 'elimina', c: coll })
              }}
            />
          )
        )
      case 'lista':
        return (
          <SezioneTitoli
            k="lista"
            etichetta="La mia lista"
            el={elLista}
            sel={Math.min(listaSel, elLista.length - 1)}
            onSel={setListaSel}
            card={(t, i) => <Card key={t.Id} fid={`lista-${i}`} formato="orizzontale" img={orizzontale(t)} titolo={t.Name ?? ''} meta={t.ProductionYear ?? undefined} onOk={() => avviaTitolo(t, `lista-${i}`)} />}
          />
        )
      case 'catalogo':
        return <SezioneCatalogo attiva={chiaveAttiva === 'catalogo'} el={catalogo.el} totale={catalogo.totale} ordine={ordine} onOrdine={setOrdine} onAltri={catalogo.altri} onApri={apri} />
    }
  }

  return (
    <div className="schermata">
      <SfondoHome img={sfondoDi(chiaveAttiva)} />
      {!pronto && <CaricamentoPagina />}
      {sezioni.map((k, i) => {
        const d = i - attiva
        return (
          <section
            key={k}
            className={`sezione-home ${d === 0 ? 'sezione-home--attiva' : d < 0 ? 'sezione-home--sopra' : 'sezione-home--sotto'}`}
            data-livello={d === 0 ? '' : undefined}
            inert={d !== 0}
            aria-hidden={d !== 0}
            onFocus={(e) => {
              const el = e.target as HTMLElement
              const s = el.closest<HTMLElement>('[data-strato]')
              if (s && el.dataset.f) memoriaStrati.set(s.dataset.strato!, el.dataset.f)
              if (k === 'hero') fuocoHero.current = el.dataset.f
            }}
          >
            {contenuto(k)}
          </section>
        )
      })}
      {menu && (
        <MenuLaterale
          onChiudi={() => {
            setMenu(false)
            tornaDopo(fuocoPrimaDelMenu.current ?? '')
          }}
          onCatalogo={() => {
            setMenu(false)
            if (chiaveAttiva === 'catalogo') tornaDopo('ord-' + ordine)
            else {
              ingresso.current = 'alto'
              setSezione('catalogo')
            }
          }}
        />
      )}
      {ripresa.finestra}
      {finestra?.tipo === 'elimina' && (
        <Finestra
          titolo="Eliminare la collezione?"
          testo={`«${finestra.c.Name ?? ''}» sparisce da Collezioni. I film restano nella libreria.`}
          onChiudi={() => (setFinestra(null), tornaDopo('coll-modifica'))}
        >
          <AzioniElimina
            elimino={elimino}
            onElimina={async () => {
              setElimino(true)
              try {
                await getLibraryApi(api).deleteItem({ itemId: finestra.c.Id! })
                dimenticaCollezioni(uid, finestra.c.Id!)
                dimentica(`home:collezioni:${uid}`)
                collezioni.ricarica()
                setCollSel(0)
                setFinestra(null)
              } finally {
                setElimino(false)
              }
            }}
            onAnnulla={() => (setFinestra(null), tornaDopo('coll-modifica'))}
          />
        </Finestra>
      )}
      {finestra?.tipo === 'immagini' && (
        <CambiaImmagini
          t={finestra.c}
          onFatto={() => {
            dimentica('')
            collezioni.ricarica()
            setFinestra(null)
            tornaDopo('coll-modifica')
          }}
          onChiudi={() => (setFinestra(null), tornaDopo('coll-modifica'))}
        />
      )}
    </div>
  )
}

// ---------- sfondo: il nuovo si dissolve sopra il vecchio ----------
function SfondoHome({ img }: { img: string | null }) {
  const [livelli, setLivelli] = useState([{ img, k: 0 }])
  const ultimo = livelli[livelli.length - 1]
  if (ultimo.img !== img) setLivelli([ultimo, { img, k: ultimo.k + 1 }])
  return (
    <div className="sfondo-home" aria-hidden>
      {livelli.map((l, i) => (
        <div key={l.k} className={`sfondo-home__livello ${i > 0 ? 'sfondo-home__livello--entra' : ''}`}>
          {/* la dissolvenza parte quando l'immagine è arrivata: niente lampo sul fondo vuoto */}
          {l.img && <img src={l.img} alt="" onLoad={(e) => e.currentTarget.parentElement?.classList.add('sfondo-home__livello--pronto')} />}
        </div>
      ))}
      <div className="sfondo-home__sfumature" />
    </div>
  )
}

type Ripresa = ReturnType<typeof useRipresa>

function Etichetta({ children }: { children: ReactNode }) {
  return <h2 className="sezione-home__etichetta t-titolo-riga">{children}</h2>
}

/** Pulsante principale di un titolo: Riprendi o Guarda (per le serie l'episodio da cui ripartire). */
function Principale({ fid, t, ripresa }: { fid: string; t: BaseItemDto; ripresa: Ripresa }) {
  const a = useAzionePrincipale(t)
  return (
    <Pulsante fid={fid} tipo="principale" icona="play" pref onOk={() => a && ripresa.avvia(a.voce, a.iniziato, a, fid)}>
      {a?.testo ?? 'Guarda'}
    </Pulsante>
  )
}

// ---------- Hero ----------
/** le prime frasi intere della trama, fino a circa due righe: nell'Hero non c'è «Leggi altro» */
function descrizioneBreve(trama: string, max = 160, min = 80) {
  const frasi = trama.match(/[^.!?]+[.!?]+["»”]?\s*|[^.!?]+$/g) ?? [trama]
  let s = frasi[0]
  for (const f of frasi.slice(1)) {
    // una prima frase cortissima («Berlino, 1929.») non basta: si aggiunge la successiva anche se è lunga
    if ((s + f).length > max && s.length >= min) break
    s += f
  }
  return s.trim()
}

/** I testi dell'Hero: il vecchio esce mentre il nuovo entra, nello stesso posto (dissolvenza incrociata). */
function TestiHero({ t }: { t: BaseItemDto }) {
  const [livelli, setLivelli] = useState([{ t, k: 0 }])
  const ultimo = livelli[livelli.length - 1]
  if (ultimo.t.Id !== t.Id) setLivelli([ultimo, { t, k: ultimo.k + 1 }])
  return (
    <div className="hero-testi">
      {livelli.map((l, i) => (
        <div
          key={l.k}
          className={`sezione-home__blocco hero-testi__livello ${livelli.length > 1 ? (i === 0 ? 'hero-testi__livello--esce' : 'hero-testi__livello--entra') : ''}`}
          aria-hidden={i < livelli.length - 1}
          onAnimationEnd={() => i === 0 && livelli.length > 1 && setLivelli((x) => x.slice(-1))}
        >
          <h1 className="t-titolo-scheda" style={{ margin: 0 }}>{l.t.Name}</h1>
          <RigaDati t={l.t} />
          <p className="t-sinossi c-2 sezione-home__breve">{l.t.Overview ? descrizioneBreve(l.t.Overview) : ''}</p>
        </div>
      ))}
    </div>
  )
}

function SezioneHero(p: { t: BaseItemDto; n: number; totale: number; ripresa: Ripresa }) {
  return (
    <div className="sezione-home__testo">
      {/* a ogni cambio cambiano solo i testi, in dissolvenza incrociata; Guarda e i pallini restano fermi */}
      <TestiHero t={p.t} />
      {/* solo Guarda (2026-10-16): ← → scorrono il carosello */}
      <div className="sezione-home__azioni" data-strato="hero-pulsanti" data-ingresso>
        <Principale fid="ev-principale" t={p.t} ripresa={p.ripresa} />
      </div>
      {/* i pallini dicono solo dove si è: non prendono il fuoco, il carosello si scorre dai pulsanti */}
      {p.totale > 1 && (
        <div className="pallini" role="status" aria-label={`Suggerimento ${p.n + 1} di ${p.totale}`}>
          {Array.from({ length: p.totale }, (_, i) => (
            <span key={i} className={`pallini__punto ${i === p.n ? 'pallini__punto--acceso' : ''}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Continua a guardare · La mia lista: titolo scelto a sinistra, card in basso a destra ----------
/* Un solo livello, le card: ci si arriva subito e OK avvia il titolo (se è iniziato chiede Riprendi o Ricomincia). */
function SezioneTitoli(p: { k: string; etichetta: string; el: BaseItemDto[]; sel: number; onSel: (i: number) => void; card: (t: BaseItemDto, i: number) => ReactNode; senzaTrama?: boolean }) {
  const t = p.el[p.sel]
  if (!t) return null
  const ep = t.Type === 'Episode'
  return (
    <>
      <Etichetta>{p.etichetta}</Etichetta>
      <div key={t.Id} className="sezione-home__testo sezione-home__testo--titoli sezione-home__cambia">
        <h1 className="t-titolo-scheda" style={{ margin: 0 }}>{ep ? t.SeriesName : t.Name}</h1>
        {ep ? (
          <div className="t-meta">
            {sigla(t)} · {t.Name}
          </div>
        ) : (
          <RigaDati t={t} />
        )}
        <Tempo t={t} />
        {!p.senzaTrama && t.Overview && <p className="t-sinossi c-2 sezione-home__trama">{t.Overview}</p>}
      </div>
      <div
        className="riga__binario sezione-home__card"
        data-strato={`${p.k}-card`}
        data-ingresso
        data-xscroll="48"
        onFocus={(e) => {
          const i = Number((e.target as HTMLElement).dataset.f?.split('-').pop())
          if (!Number.isNaN(i)) p.onSel(i)
        }}
      >
        {p.el.map(p.card)}
      </div>
    </>
  )
}

/** Quanto si è guardato e quanto manca, con la barra; niente se il titolo non è iniziato. */
function Tempo({ t }: { t: BaseItemDto }) {
  const pos = secondi(t.UserData?.PlaybackPositionTicks)
  const tot = secondi(t.RunTimeTicks)
  if (!pos || !tot) return null
  const min = (s: number) => durata(Math.max(1, Math.round(s / 60)))
  return (
    <div className="sezione-home__tempo">
      <Avanzamento valore={pos / tot} />
      <span className="t-meta c-2">
        Guardati {min(pos)} · mancano {min(tot - pos)}
      </span>
    </div>
  )
}

// ---------- Collezioni: gruppo di pulsanti, pulsanti, locandine dei film ----------
function SezioneCollezioni(p: {
  el: BaseItemDto[]
  sel: number
  onSel: (i: number) => void
  mostrata: { c: BaseItemDto; film: BaseItemDto[] }
  ripresa: Ripresa
  modifica: boolean
  onApri: (t: BaseItemDto) => void
  onModifica: (v: string) => void
}) {
  const { c, film } = p.mostrata
  const [menu, setMenu] = useState(false)
  const anni = film.map((f) => f.ProductionYear ?? 0).filter(Boolean)
  const meta = [
    film.length ? `${film.length} ${film.length === 1 ? 'titolo' : 'titoli'}` : c.ChildCount ? `${c.ChildCount} titoli` : null,
    anni.length ? (Math.min(...anni) === Math.max(...anni) ? `${anni[0]}` : `${Math.min(...anni)}–${Math.max(...anni)}`) : null,
  ].filter(Boolean)
  const primo = film.find((f) => !f.UserData?.Played) ?? film[0]
  return (
    <>
      <Etichetta>Collezioni</Etichetta>
      <GruppoPulsanti
        strato="coll-pill"
        classe="sezione-home__gruppo"
        voci={p.el.map((x, i) => ({ fid: `pill-${i}`, testo: x.Name ?? '', selezionata: i === p.sel, onFuoco: () => p.onSel(i) }))}
      />
      <div key={'testo-' + c.Id} className="sezione-home__testo sezione-home__testo--stretto sezione-home__cambia">
        <h1 className="t-titolo-scheda" style={{ margin: 0 }}>{c.Name}</h1>
        {meta.length > 0 && <div className="t-meta">{meta.join(' · ')}</div>}
        {c.Overview && <p className="t-sinossi c-2 sezione-home__trama">{c.Overview}</p>}
        <div className="sezione-home__azioni" data-strato="coll-pulsanti">
          {primo && (
            <Pulsante
              fid="coll-guarda"
              tipo="principale"
              icona="play"
              pref
              onOk={() => {
                const pos = secondi(primo.UserData?.PlaybackPositionTicks)
                p.ripresa.avvia({ s: 'player', id: primo.Id! }, pos > 0, { pos, durata: secondi(primo.RunTimeTicks), cosa: primo.Name ?? '' }, 'coll-guarda')
              }}
            >
              Guarda tutto
            </Pulsante>
          )}
          {p.modifica && (
            <div style={{ position: 'relative' }}>
              <Pulsante fid="coll-modifica" icona="matita" onOk={() => setMenu(true)}>
                Modifica
              </Pulsante>
              {menu && (
                <Tendina
                  voci={[
                    { id: 'rinomina', testo: 'Rinomina' },
                    { id: 'titoli', testo: 'Aggiungi o togli titoli' },
                    { id: 'immagini', testo: 'Cambia immagini' },
                    { id: 'elimina', testo: 'Elimina collezione' },
                  ]}
                  stile={{ bottom: 76, left: 0 }}
                  onChiudi={() => (setMenu(false), setTimeout(() => mettiId('coll-modifica')))}
                  onScegli={(v) => (setMenu(false), p.onModifica(v))}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {film.length > 0 && (
        <div key={'locandine-' + c.Id} className="riga__binario sezione-home__locandine sezione-home__cambia" data-strato="coll-loc" data-xscroll="48">
          {film.map((f) => (
            <Card key={f.Id} fid={'cl-' + f.Id} formato="locandina" img={locandina(f)} titolo={f.Name ?? ''} onOk={() => p.onApri(f)} />
          ))}
        </div>
      )}
    </>
  )
}

// ---------- Intero catalogo: film e serie insieme, ordinamento subito sopra ----------
function SezioneCatalogo(p: { attiva: boolean; el: BaseItemDto[]; totale: number | null; ordine: string; onOrdine: (o: string) => void; onAltri: () => void; onApri: (t: BaseItemDto) => void }) {
  const righe: BaseItemDto[][] = []
  for (let i = 0; i < p.el.length; i += COLONNE) righe.push(p.el.slice(i, i + COLONNE))
  const attesa = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(attesa.current), [])
  const scegli = (id: string, dopo: number) => {
    clearTimeout(attesa.current)
    if (id === p.ordine) return
    attesa.current = setTimeout(() => p.onOrdine(id), dopo)
  }
  // entrando si vede l'ordinamento con i titoli a metà schermo; scesi nella griglia tutto sale:
  // l'ordinamento va in alto e le locandine prendono lo schermo. Risalendo resta così;
  // la posizione bassa torna solo rientrando nella sezione
  const [inGriglia, setInGriglia] = useState(false)
  const griglia = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!p.attiva) setInGriglia(false)
  }, [p.attiva])
  return (
    <div
      className={`catalogo ${inGriglia ? 'catalogo--griglia' : ''}`}
      onFocus={(e) => {
        if (griglia.current?.contains(e.target as Node)) setInGriglia(true)
        else griglia.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    >
      <h2 className="sezione-home__etichetta sezione-home__etichetta--catalogo t-titolo-riga">Intero catalogo</h2>
      <GruppoPulsanti
        strato="cat-ordine"
        ingresso
        classe="sezione-home__gruppo sezione-home__gruppo--catalogo"
        // l'ordine cambia quando il fuoco si ferma su una voce (o subito con OK):
        // passando veloce non parte una richiesta per ogni voce attraversata
        voci={ORDINI.map((o) => ({ fid: 'ord-' + o.id, testo: o.testo, selezionata: o.id === p.ordine, onOk: () => scegli(o.id, 0), onFuoco: () => scegli(o.id, 400) }))}
      />
      <div ref={griglia} className="sezione-home__griglia" data-yscroll="0">
        {righe.map((r, k) => (
          <div
            key={k}
            className="sezione-home__riga-griglia"
            data-strato={'cat-r' + k}
            data-colonne
            onFocus={() => k >= righe.length - 3 && p.onAltri()}
          >
            {r.map((t) => (
              <Card key={t.Id} fid={'cat-' + t.Id} formato="locandina" img={locandina(t)} titolo={t.Name ?? ''} onOk={() => p.onApri(t)} />
            ))}
          </div>
        ))}
        {p.totale === 0 && <p className="t-sinossi c-2" style={{ padding: '0 96px' }}>Non ci sono titoli.</p>}
      </div>
    </div>
  )
}

// ---------- Menu laterale ----------
/** Menu laterale (2026-10-17): solo Cerca, Catalogo e Profili, raggruppati a metà della colonna. */
function MenuLaterale({ onChiudi, onCatalogo }: { onChiudi: () => void; onCatalogo: () => void }) {
  const nav = useNav()
  const { profilo } = useStato()
  useTasti((t) => {
    if (t === 'indietro' || t === 'destra') return onChiudi(), true
    if (t === 'sinistra') return true
  })
  useLayoutEffect(() => {
    mettiId('ml-cerca')
  }, [])
  return (
    <div className="menu-laterale" data-livello>
      <div className="menu-laterale__velo" onClick={onChiudi} />
      <nav className="menu-laterale__pannello" aria-label="Menu">
        <div className="menu-laterale__voci">
          <button data-f="ml-cerca" className="menu-laterale__voce t-pulsante" onClick={() => nav.vai({ s: 'cerca' })}>
            <Icona nome="cerca" />
            Cerca
          </button>
          <button data-f="ml-catalogo" className="menu-laterale__voce t-pulsante" onClick={onCatalogo}>
            <Icona nome="film" />
            Catalogo
          </button>
          <button data-f="ml-profili" className="menu-laterale__voce t-pulsante" aria-label={`Profili, ora ${profilo?.nome ?? ''}`} onClick={() => nav.vai({ s: 'profili' })}>
            <span className="menu-laterale__foto t-didascalia">
              {profilo?.foto ? <img className="avatar__foto" src={profilo.foto} alt="" /> : iniziali(profilo?.nome ?? '')}
            </span>
            Profili
          </button>
        </div>
      </nav>
    </div>
  )
}
