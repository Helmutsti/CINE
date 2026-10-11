/*
 * Navigazione col telecomando: frecce, OK (Invio), Indietro (Esc o Backspace).
 *
 * - Un elemento che prende il fuoco ha l'attributo data-f="<id>" (unico nella schermata).
 * - La ricerca avviene solo nel livello più in alto: l'ultimo [data-livello] nel documento
 *   (la schermata, oppure una finestra o un menu aperto sopra).
 * - Un contenitore con data-g="<nome>" ricorda l'ultimo elemento a fuoco: rientrandoci
 *   si torna lì. Senza ricordo si va su [data-fpref], se c'è.
 * - ↑ ↓ vanno sempre alla riga più vicina: i livelli non si saltano (es. griglia → filtri → menu).
 * - Colonne affiancate ([data-colonna], es. tastiera e risultati): ↑ ↓ restano nella colonna in cui si è;
 *   si cambia colonna con ← →. Gli elementi fuori da ogni colonna (il menu) restano raggiungibili.
 * - Lo scorrimento verticale lo decide [data-y] sull'antenato più vicino:
 *   "cima" porta il contenitore [data-yscroll] in alto, "inizio" allinea quell'elemento in alto.
 */

export type Direzione = 'su' | 'giu' | 'sinistra' | 'destra'
export type Tasto = Direzione | 'ok' | 'indietro'

type Gestore = (t: Tasto, e: KeyboardEvent) => boolean | void

const gestori: Gestore[] = []
/** gestori che decidono prima di tutti (la tastiera a schermo: scrivere vince su Indietro) */
const primi: Gestore[] = []
const memoria = new Map<string, string>()

/** Registra un gestore dei tasti: l'ultimo registrato decide per primo. */
export function aggiungiGestore(g: Gestore, prima = false) {
  const l = prima ? primi : gestori
  l.push(g)
  return () => {
    const i = l.lastIndexOf(g)
    if (i >= 0) l.splice(i, 1)
  }
}

export function livello(): HTMLElement {
  const l = document.querySelectorAll<HTMLElement>('[data-livello]')
  return l[l.length - 1] ?? document.body
}

function visibile(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
}

export function corrente(): HTMLElement | null {
  const a = document.activeElement as HTMLElement | null
  return a && a.dataset.f !== undefined && livello().contains(a) ? a : null
}

export function trova(id: string): HTMLElement | null {
  return livello().querySelector<HTMLElement>(`[data-f="${CSS.escape(id)}"]`)
}

export function metti(el: HTMLElement | null) {
  if (!el) return false
  el.focus({ preventScroll: true })
  ricorda(el)
  scorri(el)
  return true
}

export function mettiId(id: string | undefined | null) {
  return id ? metti(trova(id)) : false
}

export function primo() {
  const tutti = [...livello().querySelectorAll<HTMLElement>('[data-f]')].filter(visibile)
  return metti(tutti.find((e) => e.dataset.fpref !== undefined) ?? tutti[0] ?? null)
}

function ricorda(el: HTMLElement) {
  let g = el.parentElement?.closest<HTMLElement>('[data-g]')
  while (g) {
    memoria.set(g.dataset.g!, el.dataset.f!)
    g = g.parentElement?.closest<HTMLElement>('[data-g]') ?? null
  }
}

export function dimentica(gruppo: string) {
  memoria.delete(gruppo)
}

function scorri(el: HTMLElement) {
  // dentro un elenco a tendina che scorre
  if (el.closest('.tendina')) el.scrollIntoView({ block: 'nearest' })
  // orizzontale: le righe di card
  const riga = el.closest<HTMLElement>('[data-xscroll]')
  if (riga) {
    const margine = Number(riga.dataset.xscroll || 96)
    const rr = riga.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    const scala = rr.width / riga.clientWidth || 1
    let dx = 0
    if (er.left < rr.left + margine * scala) dx = (er.left - rr.left) / scala - margine
    else if (er.right > rr.right - margine * scala) dx = (er.right - rr.right) / scala + margine
    if (dx) riga.scrollBy({ left: dx, behavior: 'smooth' })
  }
  // verticale
  const ancora = el.closest<HTMLElement>('[data-y]')
  const cont = el.closest<HTMLElement>('[data-yscroll]')
  if (cont) {
    const cr = cont.getBoundingClientRect()
    const scala = cr.height / cont.clientHeight || 1
    if (ancora?.dataset.y === 'cima') {
      cont.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (ancora?.dataset.y === 'inizio') {
      const ar = ancora.getBoundingClientRect()
      const alto = Number(cont.dataset.yscroll || 0)
      cont.scrollBy({ top: (ar.top - cr.top) / scala - alto, behavior: 'smooth' })
    } else {
      const er = el.getBoundingClientRect()
      const m = 120 * scala
      if (er.top < cr.top + m) cont.scrollBy({ top: (er.top - cr.top - m) / scala, behavior: 'smooth' })
      else if (er.bottom > cr.bottom - m) cont.scrollBy({ top: (er.bottom - cr.bottom + m) / scala, behavior: 'smooth' })
    }
  }
}

/** Per ↑ ↓: l'elemento b è davvero nella riga sopra / sotto di a? Una card della stessa riga
 *  ma più alta (titolo su più righe) ha il centro più in basso: conta da dove comincia. */
function fuoriRiga(dir: 'su' | 'giu', a: DOMRect, b: DOMRect, ay: number, by: number) {
  if (dir === 'giu') return by <= ay + 1 || b.bottom <= a.bottom || b.top < a.top + a.height / 2
  return by >= ay - 1 || b.top >= a.top || b.bottom > a.bottom - a.height / 2
}

/** Sposta il fuoco nella direzione, scegliendo l'elemento più vicino. */
export function muovi(dir: Direzione): boolean {
  const da = corrente()
  if (!da) return primo()
  const a = da.getBoundingClientRect()
  const ax = a.left + a.width / 2
  const ay = a.top + a.height / 2
  let migliore: { el: HTMLElement; punti: number } | null = null
  // ↑ ↓ non saltano le righe: si sceglie solo nella riga più vicina (gli elementi che si
  // sovrappongono in altezza al più vicino), poi il più allineato in orizzontale
  let riga: DOMRect | null = null
  const colonna = da.closest('[data-colonna]')
  /** per ↑ ↓: l'elemento sta in un'altra colonna affiancata? */
  const altraColonna = (el: HTMLElement) => {
    if (!colonna || (dir !== 'su' && dir !== 'giu')) return false
    if (dentroColonna) return !colonna.contains(el)
    const c = el.closest('[data-colonna]')
    return !!c && c !== colonna
  }
  /** la riga scelta per ↑ ↓ sta nella propria colonna: si sceglie solo lì */
  let dentroColonna = false
  if (dir === 'su' || dir === 'giu') {
    // prima dentro la propria colonna (anche se la riga è scorsa sotto il menu), poi fuori
    for (const soloColonna of colonna ? [true, false] : [false]) {
      let gap = Infinity
      for (const el of livello().querySelectorAll<HTMLElement>('[data-f]')) {
        if (el === da || !visibile(el) || altraColonna(el) || (soloColonna && !colonna!.contains(el))) continue
        const b = el.getBoundingClientRect()
        const by = b.top + b.height / 2
        if (fuoriRiga(dir as 'su' | 'giu', a, b, ay, by)) continue
        const g = dir === 'giu' ? Math.max(0, b.top - a.bottom) : Math.max(0, a.top - b.bottom)
        if (g < gap) (gap = g), (riga = b)
      }
      if (riga) {
        dentroColonna = soloColonna
        break
      }
    }
  }
  for (const el of livello().querySelectorAll<HTMLElement>('[data-f]')) {
    if (el === da || !visibile(el) || altraColonna(el)) continue
    const b = el.getBoundingClientRect()
    const bx = b.left + b.width / 2
    const by = b.top + b.height / 2
    let principale: number
    let laterale: number
    if (dir === 'destra' || dir === 'sinistra') {
      if (dir === 'destra' ? bx <= ax + 1 || b.right <= a.right : bx >= ax - 1 || b.left >= a.left) continue
      principale = dir === 'destra' ? Math.max(0, b.left - a.right) : Math.max(0, a.left - b.right)
      // ← → solo dentro la stessa riga: l'elemento deve sovrapporsi in altezza
      if (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 0) continue
      laterale = Math.abs(by - ay) * 0.05
    } else {
      if (fuoriRiga(dir as 'su' | 'giu', a, b, ay, by)) continue
      if (riga && Math.min(riga.bottom, b.bottom) - Math.max(riga.top, b.top) <= 0) continue
      principale = dir === 'giu' ? Math.max(0, b.top - a.bottom) : Math.max(0, a.top - b.bottom)
      const sovrapposti = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0
      laterale = sovrapposti ? Math.abs(bx - ax) * 0.05 : Math.abs(bx - ax)
    }
    const punti = principale + laterale * 2
    if (!migliore || punti < migliore.punti) migliore = { el, punti }
  }
  if (!migliore) {
    // nelle griglie, a fine riga → va al primo della riga sotto (e ← all'ultimo della riga sopra)
    const griglia = da.closest<HTMLElement>('[data-griglia]')
    if (griglia && (dir === 'destra' || dir === 'sinistra')) {
      const tutti = [...griglia.querySelectorAll<HTMLElement>('[data-f]')].filter(visibile)
      const vicino = tutti[tutti.indexOf(da) + (dir === 'destra' ? 1 : -1)]
      if (vicino) return metti(vicino)
    }
    return false
  }
  // entrando in un gruppo diverso si torna sull'ultimo elemento ricordato
  const gruppo = migliore.el.closest<HTMLElement>('[data-g]')
  if (gruppo && !gruppo.contains(da)) {
    const id = memoria.get(gruppo.dataset.g!)
    const ricordato = id ? gruppo.querySelector<HTMLElement>(`[data-f="${CSS.escape(id)}"]`) : null
    const pref = gruppo.querySelector<HTMLElement>('[data-fpref]')
    return metti(ricordato && visibile(ricordato) ? ricordato : pref && visibile(pref) ? pref : migliore.el)
  }
  return metti(migliore.el)
}

const TASTI: Record<string, Tasto> = {
  ArrowUp: 'su',
  ArrowDown: 'giu',
  ArrowLeft: 'sinistra',
  ArrowRight: 'destra',
  Enter: 'ok',
  ' ': 'ok',
  Escape: 'indietro',
  Backspace: 'indietro',
}

let avviato = false
export function avvia() {
  if (avviato) return
  avviato = true
  document.addEventListener('keydown', (e) => {
    const t = TASTI[e.key]
    const tutti = [...gestori, ...primi]
    for (let i = tutti.length - 1; i >= 0; i--) {
      if (tutti[i](t, e) === true) {
        e.preventDefault()
        return
      }
    }
    if (!t) return
    e.preventDefault()
    if (t === 'ok') corrente()?.click()
    else if (t !== 'indietro') muovi(t)
  })
  // col mouse: passare sopra un elemento gli dà il fuoco (lo stato Hover è come Focus)
  // il browser manda movimenti finti quando la pagina cambia sotto il puntatore fermo: si ignorano
  document.addEventListener('mousemove', (e) => {
    if (e.movementX === 0 && e.movementY === 0) return
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-f]')
    if (el && el !== document.activeElement && livello().contains(el)) {
      el.focus({ preventScroll: true })
      ricorda(el)
    }
  })
}
