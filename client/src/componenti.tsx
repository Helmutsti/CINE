/* Componenti della Libreria Figma, in codice. Nomi e varianti come in docs/design/componenti.md. */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icona, type NomeIcona } from './icone'
import { mettiId, primo, fuocoDaiTasti } from './fuoco'
import { useNav, useTasti, type Sezione } from './nav'
import { useStato } from './stato'
import { iniziali } from './dati'

export { Icona }

// ---------- CMP-01 Pulsante ----------
export function Pulsante(p: {
  fid: string
  tipo?: 'principale' | 'secondario' | 'icona'
  icona?: NomeIcona
  etichetta?: string
  onOk: () => void
  children?: ReactNode
  pref?: boolean
  /** Solo icona con il fondo chiaro del Principale (play / pausa del player) */
  chiaro?: boolean
  /** icona dopo il testo (la freccia dei filtri) */
  iconaDopo?: NomeIcona
  /** un filtro attivo: fondo come la scelta selezionata */
  acceso?: boolean
  /** classe in più (le misure dei tasti del player) */
  classe?: string
}) {
  const tipo = p.tipo ?? 'secondario'
  return (
    <button
      data-f={p.fid}
      data-fpref={p.pref ? '' : undefined}
      className={`pulsante pulsante--${tipo} ${p.chiaro ? 'pulsante--chiaro' : ''} ${p.acceso ? 'pulsante--acceso' : ''} ${p.classe ?? ''} t-pulsante`}
      aria-label={p.etichetta}
      onClick={p.onOk}
    >
      {p.icona && <Icona nome={p.icona} />}
      {p.children}
      {p.iconaDopo && <Icona nome={p.iconaDopo} />}
    </button>
  )
}

// ---------- CMP-07 Barra di avanzamento ----------
export function Avanzamento({ valore, stile }: { valore: number; stile?: CSSProperties }) {
  return (
    <div className="avanzamento" style={stile}>
      <div style={{ width: `${Math.max(0, Math.min(1, valore)) * 100}%` }} />
    </div>
  )
}

// ---------- CMP-04 Card ----------
/** L'immagine di una card: se non arriva (server lento o in errore) riprova una volta dopo 2 s,
 *  poi mostra il titolo come quando l'immagine non c'è, invece dell'immagine rotta. */
function ImmagineCard({ src, titolo }: { src: string; titolo: string }) {
  // 0 = primo tentativo; un numero = l'ora del secondo (rende diverso l'indirizzo); -1 = rinuncia
  const [riprova, setRiprova] = useState(0)
  useEffect(() => setRiprova(0), [src])
  if (riprova < 0) return <div className="card__segnaposto t-card-titolo">{titolo}</div>
  const url = riprova ? `${src}${src.includes('?') ? '&' : '?'}riprova=${riprova}` : src
  return (
    <img
      key={url}
      src={url}
      alt=""
      loading="lazy"
      onError={() => (riprova === 0 ? setTimeout(() => setRiprova(Date.now()), 2000) : setRiprova(-1))}
    />
  )
}

export function Card(p: {
  fid: string
  formato: 'orizzontale' | 'locandina' | 'episodio' | 'collezione'
  img: string | null
  titolo: string
  meta?: ReactNode
  avanzamento?: number
  numero?: number
  larghezza?: number | string
  sempre?: boolean
  piccolo?: boolean
  /** immagine in un solo colore (Generi, Mood) */
  mono?: boolean
  onOk: () => void
}) {
  const larghezza = p.larghezza ?? { orizzontale: 400, locandina: 226, episodio: 336, collezione: 416 }[p.formato]
  const sempre = p.sempre || p.formato === 'episodio'
  return (
    <button
      data-f={p.fid}
      className={`card ${p.formato === 'locandina' ? 'card--locandina' : ''} ${sempre ? 'card--sempre' : ''} ${p.mono ? 'card--mono' : ''}`}
      style={{ width: larghezza }}
      aria-label={p.titolo}
      onClick={p.onOk}
    >
      <div className="card__img">
        {p.img ? (
          <ImmagineCard src={p.img} titolo={p.titolo} />
        ) : (
          <div className="card__segnaposto t-card-titolo">{p.titolo}</div>
        )}
        {p.formato === 'collezione' && <div className="card__nome t-titolo-riga">{p.titolo}</div>}
        {p.numero != null && <div className="card__numero t-meta">{p.numero}</div>}
        {p.avanzamento != null && <div className="card__sfumatura" />}
        {p.avanzamento != null && (
          <div className="card__barra">
            <Avanzamento valore={p.avanzamento} />
          </div>
        )}
      </div>
      <div className="card__testo">
        {p.formato !== 'collezione' && (
          <div className={p.piccolo ? 't-card-titolo-piccolo' : 't-card-titolo'}>{p.titolo}</div>
        )}
        {p.meta && <div className="t-meta-card c-2">{p.meta}</div>}
      </div>
    </button>
  )
}

// ---------- CMP-05 Riga di card ----------
export function Riga(p: { g: string; titolo?: string; children: ReactNode; y?: 'inizio' | 'cima'; stile?: CSSProperties }) {
  return (
    <section className="riga" data-y={p.y ?? 'inizio'} style={p.stile}>
      {p.titolo && <h2 className="riga__titolo t-titolo-riga" style={{ margin: 0 }}>{p.titolo}</h2>}
      <div className="riga__binario" data-g={p.g} data-xscroll="96">
        {p.children}
      </div>
    </section>
  )
}

// ---------- CMP-08 Avatar ----------
export function Avatar(p: {
  fid?: string
  nome: string
  foto?: string
  nota?: string
  piccolo?: boolean
  piu?: boolean
  /** verticale 2:3, come una locandina (Chi guarda?) */
  ritratto?: boolean
  onOk?: () => void
}) {
  const classe = `avatar ${p.piccolo ? 'avatar--piccolo' : ''} ${p.ritratto ? 'avatar--ritratto' : ''}`
  const contenuto = (
    <>
      <div className={`avatar__tondo ${p.piccolo ? 't-etichetta' : 't-titolo-sezione'}`}>
        {p.foto ? <img className="avatar__foto" src={p.foto} alt="" /> : p.piu ? '+' : iniziali(p.nome)}
      </div>
      {!p.piccolo && <div className="avatar__nome t-etichetta">{p.nome}</div>}
      {!p.piccolo && p.nota && <div className="avatar__nota t-didascalia">{p.nota}</div>}
    </>
  )
  return p.fid ? (
    <button data-f={p.fid} className={classe} aria-label={p.nome} onClick={p.onOk}>
      {contenuto}
    </button>
  ) : (
    <div className={classe}>{contenuto}</div>
  )
}

// ---------- CMP-09 Persona del cast ----------
export function PersonaCast(p: { fid: string; nome: string; foto: string | null; ruolo?: string | null; onOk: () => void }) {
  return (
    <button data-f={p.fid} className="persona" onClick={p.onOk}>
      <div className="persona__foto t-didascalia c-3">
        {p.foto ? <img src={p.foto} alt="" loading="lazy" /> : iniziali(p.nome)}
      </div>
      <div className="persona__nome t-etichetta">{p.nome}</div>
      {p.ruolo && <div className="persona__ruolo t-meta-card">({p.ruolo})</div>}
    </button>
  )
}

// ---------- CMP-10 Etichetta tecnica ----------
export function Etichetta({ children }: { children: ReactNode }) {
  return <span className="etichetta t-didascalia">{children}</span>
}

// ---------- CMP-11 Scelta ----------
export function Scelta(p: { fid: string; testo: string; selezionata?: boolean; onOk?: () => void; onFuoco?: () => void; pref?: boolean }) {
  return (
    <button
      data-f={p.fid}
      data-fpref={p.pref ? '' : undefined}
      className={`scelta t-pulsante ${p.selezionata ? 'scelta--selezionata' : ''}`}
      aria-pressed={p.selezionata}
      onClick={p.onOk}
      onFocus={p.onFuoco}
    >
      {p.selezionata && <Icona nome="spunta" />}
      {p.testo}
    </button>
  )
}

// ---------- Gruppo di pulsanti (Home, 2026-10-16): una barra sola che scorre, al posto delle Scelte ----------
export function GruppoPulsanti(p: {
  strato: string
  voci: { fid: string; testo: string; selezionata: boolean; onOk?: () => void; onFuoco?: () => void }[]
  classe?: string
  ingresso?: boolean
}) {
  // il fondo è un elemento solo che scivola da una voce all'altra: segue il fuoco (chiaro)
  // quando il fuoco è nel gruppo, altrimenti sta sulla voce scelta
  const barra = useRef<HTMLDivElement>(null)
  const [fuoco, setFuoco] = useState<number | null>(null)
  const scelta = fuoco ?? p.voci.findIndex((v) => v.selezionata)
  const primaVolta = useRef(true)
  useLayoutEffect(() => {
    const ind = barra.current?.querySelector<HTMLElement>('.gruppo__indicatore')
    if (!ind) return
    const metti = (subito: boolean) => {
      const v = barra.current?.querySelectorAll<HTMLElement>('.gruppo__voce')[scelta]
      // all'apertura (e quando cambiano le misure) il fondo è già al suo posto, senza scivolare
      if (subito) ind.style.transition = 'none'
      ind.style.opacity = v ? '1' : '0'
      if (v) {
        ind.style.width = `${v.offsetWidth}px`
        ind.style.transform = `translateX(${v.offsetLeft}px)`
      }
      if (subito) {
        void ind.offsetWidth
        ind.style.transition = ''
      }
    }
    const prima = primaVolta.current
    primaVolta.current = false
    metti(prima)
    if (!prima) return
    // solo all'apertura: il carattere può arrivare dopo e cambiare la larghezza delle voci
    let vivo = true
    document.fonts?.ready.then(() => vivo && metti(true))
    return () => {
      vivo = false
    }
  }, [scelta, p.voci.length])
  return (
    <div
      ref={barra}
      className={`gruppo ${p.classe ?? ''}`}
      role="group"
      data-strato={p.strato}
      data-ingresso={p.ingresso ? '' : undefined}
      data-xscroll="96"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFuoco(null)
      }}
    >
      <div className={`gruppo__indicatore ${fuoco != null ? 'gruppo__indicatore--fuoco' : ''}`} aria-hidden />
      {p.voci.map((v, i) => (
        <button
          key={v.fid}
          data-f={v.fid}
          data-fpref={v.selezionata ? '' : undefined}
          className={`gruppo__voce t-pulsante ${v.selezionata ? 'gruppo__voce--selezionata' : ''}`}
          aria-pressed={v.selezionata}
          onClick={v.onOk}
          onFocus={() => {
            setFuoco(i)
            v.onFuoco?.()
          }}
        >
          {v.testo}
        </button>
      ))}
    </div>
  )
}

// ---------- CMP-12 Tasto ----------
export function Tasto(p: { fid: string; testo?: string; icona?: NomeIcona; larghezza?: number | string; onOk: () => void; etichetta?: string }) {
  return (
    <button
      data-f={p.fid}
      className="tasto t-etichetta"
      style={{ width: p.larghezza ?? 80 }}
      aria-label={p.etichetta ?? p.testo}
      onClick={p.onOk}
    >
      {p.icona ? <Icona nome={p.icona} /> : p.testo}
    </button>
  )
}

// ---------- CMP-13 Casella del PIN ----------
export function CasellaPin({ stato }: { stato: 'vuota' | 'attiva' | 'piena' }) {
  return (
    <div className={`casella-pin ${stato === 'attiva' ? 'casella-pin--attiva' : ''}`}>
      {stato === 'piena' && <div className="casella-pin__punto" />}
    </div>
  )
}

// ---------- CMP-14 Campo di testo ----------
export function Campo(p: { testo: string; suggerimento: string; larghezza?: number | string }) {
  return (
    <div className="campo t-pulsante" style={{ width: p.larghezza }}>
      {p.testo ? (
        <>
          {p.testo}
          <span className="campo__cursore" />
        </>
      ) : (
        <span className="campo__vuoto">{p.suggerimento}</span>
      )}
    </div>
  )
}

// ---------- CMP-15 Interruttore ----------
export function Interruttore({ acceso }: { acceso: boolean }) {
  return (
    <div className={`interruttore ${acceso ? 'interruttore--acceso' : ''}`} role="switch" aria-checked={acceso}>
      <div className="interruttore__pomello" />
    </div>
  )
}

// ---------- CMP-16 Voce di elenco ----------
export function VoceElenco(p: {
  fid: string
  testo: string
  dettaglio?: string
  selezionata?: boolean
  locandina?: string | null
  attuale?: boolean
  interruttore?: boolean
  onOk?: () => void
  onFuoco?: () => void
  pref?: boolean
}) {
  return (
    <button
      data-f={p.fid}
      data-fpref={p.pref ? '' : undefined}
      className={`voce ${p.selezionata ? 'voce--selezionata' : ''}`}
      onClick={p.onOk}
      onFocus={p.onFuoco}
    >
      {p.locandina !== undefined &&
        (p.locandina ? <img className="voce__locandina" src={p.locandina} alt="" /> : <div className="voce__locandina" />)}
      <div className="voce__testi">
        <span className="t-pulsante">{p.testo}</span>
        {p.dettaglio && <span className="voce__dettaglio t-meta">{p.dettaglio}</span>}
      </div>
      {p.attuale && <Etichetta>Attuale</Etichetta>}
      {p.interruttore !== undefined && <Interruttore acceso={p.interruttore} />}
    </button>
  )
}

// ---------- Menu a tendina ----------
export function Tendina(p: {
  /** riga di intestazione, non prende il fuoco (es. il nome del profilo) */
  titolo?: string
  voci: { id: string; testo: string; selezionata?: boolean; intestazione?: boolean }[]
  stile: CSSProperties
  onScegli: (id: string) => void
  onChiudi: () => void
}) {
  useTasti((t) => {
    if (t === 'indietro') {
      p.onChiudi()
      return true
    }
    if (t === 'sinistra' || t === 'destra') return true
  })
  useLayoutEffect(() => {
    if (!mettiId('t-' + (p.voci.find((v) => v.selezionata)?.id ?? p.voci.find((v) => !v.intestazione)?.id))) primo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // col mouse: un clic fuori dal menu lo chiude
  const ref = useRef<HTMLDivElement>(null)
  const chiudi = useRef(p.onChiudi)
  chiudi.current = p.onChiudi
  useEffect(() => {
    const fuori = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        e.stopPropagation()
        e.preventDefault()
        chiudi.current()
      }
    }
    document.addEventListener('mousedown', fuori, true)
    return () => document.removeEventListener('mousedown', fuori, true)
  }, [])
  return (
    <div ref={ref} className="tendina" data-livello style={p.stile}>
      {p.titolo && <div className="tendina__titolo t-pulsante">{p.titolo}</div>}
      {p.voci.map((v) =>
        v.intestazione ? (
          <div key={v.id} className="tendina__gruppo t-occhiello">{v.testo}</div>
        ) : (
          <VoceElenco key={v.id} fid={'t-' + v.id} testo={v.testo} selezionata={v.selezionata} onOk={() => p.onScegli(v.id)} />
        ),
      )}
    </div>
  )
}

/**
 * Filtri, soluzione C (scelta del 2026-10-10): una fila di generi da scegliere con OK
 * e un solo pulsante "Ordina e filtra ⌄" che apre un elenco a gruppi.
 */
export function FilaGeneri(p: { generi: string[]; valore: string; onScegli: (g: string) => void; stile?: CSSProperties; margine?: number }) {
  return (
    <div className="riga__binario" data-g="generi" data-xscroll={p.margine ?? 96} style={{ gap: 16, ...p.stile }}>
      {['tutti', ...p.generi].map((g) => (
        <Scelta key={g} fid={'gen-' + g} testo={g === 'tutti' ? 'Tutti' : g} selezionata={g === p.valore} pref={g === p.valore} onOk={() => p.onScegli(g)} />
      ))}
    </div>
  )
}

export interface Gruppo {
  nome: string
  scelte: { id: string; testo: string }[]
  valore: string
  /** il valore che vale "nessun filtro": se diverso, il pulsante si accende */
  base: string
  onScegli: (id: string) => void
}

export function OrdinaFiltra(p: { fid: string; testo: string; gruppi: Gruppo[]; allineaDestra?: boolean }) {
  const [aperto, setAperto] = useState(false)
  const chiudi = () => {
    setAperto(false)
    setTimeout(() => mettiId(p.fid))
  }
  const acceso = p.gruppi.some((g) => g.nome !== 'Ordina' && g.valore !== g.base)
  return (
    <div style={{ position: 'relative' }}>
      <Pulsante fid={p.fid} iconaDopo="freccia-giu" acceso={acceso} onOk={() => setAperto(true)}>
        {p.testo}
      </Pulsante>
      {aperto && (
        <Tendina
          voci={p.gruppi.flatMap((g, k) => [
            // con un solo gruppo il titolo ripeterebbe la scritta del pulsante
            ...(p.gruppi.length > 1 ? [{ id: 'h' + k, testo: g.nome, intestazione: true }] : []),
            ...g.scelte.map((s) => ({ id: k + '-' + s.id, testo: s.testo, selezionata: s.id === g.valore })),
          ])}
          stile={{ top: 72, [p.allineaDestra === false ? 'left' : 'right']: 0, maxHeight: 760, overflowY: 'auto', scrollbarWidth: 'none' }}
          onChiudi={chiudi}
          onScegli={(id) => {
            const [k, ...resto] = id.split('-')
            p.gruppi[Number(k)].onScegli(resto.join('-'))
            chiudi()
          }}
        />
      )}
    </div>
  )
}

/** (vecchia soluzione "Nome: valore", non più usata nelle schermate) */
export function Filtro(p: {
  fid: string
  nome: string
  valore: string
  scelte: { id: string; testo: string }[]
  onScegli: (id: string) => void
  allineaDestra?: boolean
}) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const chiudi = () => {
    setAperto(false)
    setTimeout(() => mettiId(p.fid))
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Pulsante fid={p.fid} onOk={() => setAperto(true)}>
        {p.nome}: {p.scelte.find((s) => s.id === p.valore)?.testo.toLowerCase()}
      </Pulsante>
      {aperto && (
        <Tendina
          voci={p.scelte.map((s) => ({ ...s, selezionata: s.id === p.valore }))}
          stile={{ top: 72, [p.allineaDestra ? 'right' : 'left']: 0 }}
          onChiudi={chiudi}
          onScegli={(id) => {
            p.onScegli(id)
            chiudi()
          }}
        />
      )}
    </div>
  )
}

// ---------- Finestra ----------
export function Finestra(p: { titolo: string; testo?: ReactNode; children: ReactNode; onChiudi: () => void; larghezza?: number }) {
  useTasti((t) => {
    if (t === 'indietro') {
      p.onChiudi()
      return true
    }
  })
  return (
    <div className="velo" data-livello>
      <div className="finestra" role="dialog" aria-label={p.titolo} style={{ width: p.larghezza }}>
        <h2 className="t-titolo-sezione" style={{ margin: 0, fontWeight: 400 }}>{p.titolo}</h2>
        {p.testo && <p className="t-meta c-2" style={{ margin: 0 }}>{p.testo}</p>}
        {p.children}
      </div>
    </div>
  )
}

// ---------- Sfondo a tutto schermo ----------
export function Sfondo({ img }: { img: string | null }) {
  return <div className="sfondo">{img && <img key={img} src={img} alt="" />}</div>
}

// ---------- CMP-03 Menu in alto ----------
const VOCI: { id: Sezione; testo: string }[] = [
  { id: 'cerca', testo: 'Cerca' },
  { id: 'home', testo: 'Home' },
  { id: 'film', testo: 'Film' },
  { id: 'serie', testo: 'Serie' },
  { id: 'collezioni', testo: 'Collezioni' },
  { id: 'lista', testo: 'La mia lista' },
]

let cambioSezione = 0

/** Mentre una sezione carica: un cerchio che gira su tutta la pagina, sotto il menu. */
export function CaricamentoPagina() {
  return (
    <div className="caricamento-pagina" role="status" aria-label="Caricamento">
      <div className="caricamento-video" />
    </div>
  )
}

export function Menu({ attiva, nascosto }: { attiva: Sezione; nascosto?: boolean }) {
  const nav = useNav()
  const { profilo } = useStato()
  const [aperto, setAperto] = useState(false)
  const chiudi = () => {
    setAperto(false)
    setTimeout(() => mettiId('menu-profilo'))
  }
  return (
    <nav className={`menu ${nascosto ? 'menu--nascosto' : ''}`} data-g="menu" data-y="cima">
      <div className="menu__pillola">
        {VOCI.map((v) => (
          <button
            key={v.id}
            data-f={'menu-' + v.id}
            data-fpref={attiva === v.id ? '' : undefined}
            className={`voce-menu t-pulsante ${v.id === 'cerca' ? 'voce-menu--icona' : ''} ${attiva === v.id ? 'voce-menu--attiva' : ''}`}
            aria-label={v.id === 'cerca' ? 'Cerca' : undefined}
            aria-current={attiva === v.id ? 'page' : undefined}
            onClick={() => attiva !== v.id && nav.vai({ s: v.id }, 'menu-' + v.id)}
            onFocus={() => {
              // solo nella barra del menu: spostandosi con le frecce la sezione cambia da sola, dopo un attimo
              // (passando di corsa sulle voci non si caricano tutte); col mouse si clicca
              if (attiva === v.id || !fuocoDaiTasti()) return
              clearTimeout(cambioSezione)
              cambioSezione = window.setTimeout(() => {
                if (document.activeElement?.getAttribute('data-f') === 'menu-' + v.id) nav.vai({ s: v.id }, 'menu-' + v.id)
              }, 250)
            }}
          >
            {v.id === 'cerca' ? <Icona nome="cerca" /> : v.testo}
          </button>
        ))}
        {/* la foto del profilo sta dentro la pillola, ultima voce (2026-10-10) */}
        <div style={{ position: 'relative' }}>
          <button data-f="menu-profilo" className="voce-menu voce-menu--profilo" aria-label={`Profilo: ${profilo?.nome}`} onClick={() => setAperto(true)}>
            <div className="avatar__tondo t-didascalia" style={{ width: 'var(--avatar-piccolo)', height: 'var(--avatar-piccolo)' }}>
              {profilo?.foto ? <img className="avatar__foto" src={profilo.foto} alt="" /> : iniziali(profilo?.nome ?? '')}
            </div>
          </button>
          {aperto && (
            <Tendina
              titolo={profilo?.nome}
              voci={[
                { id: 'cambia', testo: 'Cambia profilo' },
                { id: 'impostazioni', testo: 'Impostazioni' },
              ]}
              stile={{ top: 84, right: -8 }}
              onChiudi={chiudi}
              onScegli={(id) => {
                setAperto(false)
                if (id === 'cambia') nav.vai({ s: 'profili' })
                else nav.vai({ s: 'impostazioni' })
              }}
            />
          )}
        </div>
      </div>
    </nav>
  )
}
