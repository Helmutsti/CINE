/* Tastiera a schermo (Cerca, Correggi titolo, nome del profilo): 7 colonne di tasti CMP-12. */
import { useRef, useState } from 'react'
import { Tasto } from '../componenti'
import { useTasti } from '../nav'

const LETTERE = 'abcdefghijklmnopqrstuvwxyz'.split('')
const ALTRI = ["'", '-', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export function Tastiera(p: { testo: string; onCambia: (t: string) => void; soloLettere?: boolean; g?: string }) {
  const [maiuscole, setMaiuscole] = useState(false)
  const tasti = p.soloLettere ? LETTERE : [...LETTERE, ...ALTRI]
  const libere = 7 - (tasti.length % 7 || 7)
  // il testo più recente, anche fra due tasti premuti di seguito prima che la schermata si aggiorni
  const testo = useRef(p.testo)
  testo.current = p.testo
  const cambia = (t: string) => {
    testo.current = t
    p.onCambia(t)
  }
  const scrivi = (c: string) => cambia(testo.current + c)

  // si può scrivere anche con la tastiera del computer
  useTasti((_, e) => {
    if (e.key.length === 1 && /[\p{L}\p{N}'\- ]/u.test(e.key) && !(e.key === ' ' && !testo.current)) {
      scrivi(e.key)
      return true
    }
    if (e.key === 'Backspace' && testo.current) {
      cambia(testo.current.slice(0, -1))
      return true
    }
  }, [], true)

  return (
    <div data-g={p.g ?? 'tastiera'} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 80px)', gap: 8 }}>
      {tasti.map((c) => (
        <Tasto key={c} fid={'tasto-' + c} testo={maiuscole ? c.toUpperCase() : c} onOk={() => scrivi(maiuscole ? c.toUpperCase() : c)} />
      ))}
      {/* Maiuscole: non è nei wireframe, aggiunto su richiesta (2026-10-10) */}
      <div style={{ gridColumn: `span ${libere || 7}` }}>
        <Tasto fid="tasto-maiuscole" testo={maiuscole ? 'Minuscole' : 'Maiuscole'} larghezza="100%" onOk={() => setMaiuscole((m) => !m)} />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gap: 8 }}>
        <Tasto fid="tasto-spazio" testo="Spazio" larghezza="100%" onOk={() => scrivi(' ')} />
        <Tasto fid="tasto-cancella" testo="Cancella" larghezza="100%" onOk={() => cambia(testo.current.slice(0, -1))} />
        <Tasto fid="tasto-tutto" testo="Cancella tutto" larghezza="100%" onOk={() => cambia('')} />
      </div>
    </div>
  )
}
