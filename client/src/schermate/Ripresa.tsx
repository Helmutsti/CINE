/* "Riprendi o ricomincia?": si apre quando si avvia un titolo già iniziato (2026-10-10). */
import { useState } from 'react'
import { Finestra, Pulsante } from '../componenti'
import { mettiId } from '../fuoco'
import { useFuocoIniziale, useNav, type Voce } from '../nav'

type Player = Extract<Voce, { s: 'player' }>
interface Richiesta {
  voce: Player
  pos: number
  durata: number
  cosa: string
  torna: string
}

function mancano(sec: number) {
  const m = Math.max(1, Math.round(sec / 60))
  const h = Math.floor(m / 60)
  const resto = m % 60
  const min = (n: number) => `${n} ${n === 1 ? 'minuto' : 'minuti'}`
  return h ? `${h} ${h === 1 ? 'ora' : 'ore'}${resto ? ' e ' + min(resto) : ''}` : min(m)
}

/** Avvia un titolo: se è iniziato chiede prima se riprendere o ricominciare. */
export function useRipresa() {
  const nav = useNav()
  const [r, setR] = useState<Richiesta | null>(null)
  const chiudi = () => {
    const torna = r?.torna
    setR(null)
    setTimeout(() => mettiId(torna))
  }
  const avvia = (voce: Player, iniziato: boolean, info: Omit<Richiesta, 'voce' | 'torna'>, torna: string) => {
    if (!iniziato) nav.vai(voce)
    else setR({ voce, torna, ...info })
  }
  const finestra = r && (
    <Finestra titolo={`${r.cosa} è già iniziato.`} testo={`Ti mancano ${mancano(r.durata - r.pos)}. Cosa vuoi fare?`} onChiudi={chiudi}>
      <Azioni
        onRiprendi={() => {
          setR(null)
          nav.vai(r.voce)
        }}
        onRicomincia={() => {
          setR(null)
          nav.vai({ ...r.voce, daCapo: true })
        }}
        onAnnulla={chiudi}
      />
    </Finestra>
  )
  return { avvia, finestra }
}

function Azioni({ onRiprendi, onRicomincia, onAnnulla }: { onRiprendi: () => void; onRicomincia: () => void; onAnnulla: () => void }) {
  useFuocoIniziale('rr-riprendi')
  return (
    <div className="finestra__azioni">
      <Pulsante fid="rr-riprendi" tipo="principale" icona="play" onOk={onRiprendi}>
        Riprendi
      </Pulsante>
      <Pulsante fid="rr-ricomincia" onOk={onRicomincia}>
        Ricomincia
      </Pulsante>
      <Pulsante fid="rr-annulla" onOk={onAnnulla}>
        Annulla
      </Pulsante>
    </div>
  )
}
