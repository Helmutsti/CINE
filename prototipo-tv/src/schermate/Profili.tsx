/* SC-01 Scelta profilo · SC-02 PIN */
import { useState } from 'react'
import { Avatar, CasellaPin, Campo, Finestra, Pulsante, Tasto } from '../componenti'
import { mettiId } from '../fuoco'
import { useFuocoIniziale, useNav, useTasti, type Voce } from '../nav'
import { useStato } from '../stato'
import { Tastiera } from './Tastiera'

export function SceltaProfilo() {
  const { st, azioni } = useStato()
  const nav = useNav()
  const [nuovo, setNuovo] = useState<string | null>(null)
  useFuocoIniziale('p-' + st.ultimoProfiloId)

  const precedente = st.profili.find((p) => p.id === st.ultimoProfiloId)
  const scegli = (id: string) => {
    const p = st.profili.find((x) => x.id === id)!
    if (precedente?.nascondi18 && !p.nascondi18 && p.pin && p.id !== precedente.id) {
      nav.vai({ s: 'pin', profiloId: id, scopo: 'entra' })
    } else {
      azioni.entra(id)
      nav.ricomincia({ s: 'home' })
    }
  }

  return (
    <div className="schermata" data-livello style={{ background: 'var(--bg)' }}>
      {/* posizioni del wireframe SC-01 (1920 × 1080) */}
      <h1 className="t-titolo-pagina" style={{ position: 'absolute', top: 300, left: 0, right: 0, margin: 0, textAlign: 'center' }}>Chi guarda?</h1>
      <div style={{ position: 'absolute', top: 430, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 80, alignItems: 'flex-start' }}>
        {st.profili.map((p) => (
          <Avatar key={p.id} fid={'p-' + p.id} nome={p.nome} foto={p.foto} nota={p.nascondi18 ? '18+ nascosti' : undefined} onOk={() => scegli(p.id)} />
        ))}
        <Avatar fid="p-aggiungi" nome="Aggiungi" piu onOk={() => setNuovo('')} />
      </div>
      <div style={{ position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Pulsante fid="p-gestisci" onOk={() => nav.vai({ s: 'impostazioni', sezione: 'profili' })}>
          Gestisci profili
        </Pulsante>
      </div>
      {nuovo !== null && (
        <Finestra
          titolo="Nuovo profilo"
          larghezza={760}
          onChiudi={() => {
            setNuovo(null)
            setTimeout(() => mettiId('p-aggiungi'))
          }}
        >
          <Campo testo={nuovo} suggerimento="Nome del profilo" />
          <Tastiera testo={nuovo} onCambia={setNuovo} soloLettere />
          <div className="finestra__azioni">
            <Pulsante
              fid="np-crea"
              tipo="principale"
              onOk={() => {
                if (!nuovo.trim()) return
                const id = azioni.aggiungiProfilo(nuovo.trim()[0].toUpperCase() + nuovo.trim().slice(1))
                setNuovo(null)
                setTimeout(() => mettiId('p-' + id))
              }}
            >
              Crea profilo
            </Pulsante>
          </div>
        </Finestra>
      )}
    </div>
  )
}

const TASTIERINO = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'annulla', '0', 'cancella']

export function Pin({ voce }: { voce: Extract<Voce, { s: 'pin' }> }) {
  const { st, azioni } = useStato()
  const nav = useNav()
  const profilo = st.profili.find((p) => p.id === voce.profiloId)!
  // 'cambia': prima il PIN attuale, poi quello nuovo
  const [fase, setFase] = useState<'verifica' | 'nuovo'>(voce.scopo === 'nuovo' ? 'nuovo' : 'verifica')
  const [cifre, setCifre] = useState('')
  const [errore, setErrore] = useState(false)
  useFuocoIniziale('k-1')

  const titolo =
    fase === 'nuovo' ? `Scegli un PIN per ${profilo.nome}` : voce.scopo === 'cambia' ? `PIN attuale di ${profilo.nome}` : `Inserisci il PIN di ${profilo.nome}`

  const completo = (pin: string) => {
    if (fase === 'nuovo') {
      azioni.cambiaProfilo(profilo.id, { pin })
      voce.poi?.()
      nav.indietro()
      return
    }
    if (pin !== profilo.pin) {
      setCifre('')
      setErrore(true)
      mettiId('k-1')
      return
    }
    if (voce.scopo === 'entra') {
      azioni.entra(profilo.id)
      nav.ricomincia({ s: 'home' })
    } else if (voce.scopo === 'cambia') {
      setFase('nuovo')
      setCifre('')
      setErrore(false)
      mettiId('k-1')
    } else {
      voce.poi?.()
      nav.indietro()
    }
  }

  const premi = (k: string) => {
    if (k === 'annulla') return nav.indietro()
    if (k === 'cancella') return setCifre((c) => c.slice(0, -1))
    const nuovo = (cifre + k).slice(0, 4)
    setCifre(nuovo)
    setErrore(false)
    if (nuovo.length === 4) setTimeout(() => completo(nuovo), 150)
  }

  useTasti((_, e) => {
    if (/^[0-9]$/.test(e.key)) {
      premi(e.key)
      return true
    }
    if (e.key === 'Backspace' && cifre) {
      premi('cancella')
      return true
    }
  })

  return (
    <div className="schermata" data-livello style={{ background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 240 }}>
        <h1 className="t-titolo-pagina" style={{ margin: 0 }}>{titolo}</h1>
        <div style={{ display: 'flex', gap: 24, marginTop: 96 }}>
          {[0, 1, 2, 3].map((i) => (
            <CasellaPin key={i} stato={i < cifre.length ? 'piena' : i === cifre.length ? 'attiva' : 'vuota'} />
          ))}
        </div>
        <div className="t-meta" style={{ height: 24, marginTop: 24, color: 'var(--text-2)' }} role="status">
          {errore ? 'PIN sbagliato. Riprova.' : ''}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 120px)', gap: 12, marginTop: 40 }}>
          {TASTIERINO.map((k) => (
            <Tasto
              key={k}
              fid={'k-' + k}
              larghezza={120}
              testo={k === 'annulla' ? 'Annulla' : k === 'cancella' ? undefined : k}
              icona={k === 'cancella' ? 'cancella' : undefined}
              etichetta={k === 'cancella' ? 'Cancella' : undefined}
              onOk={() => premi(k)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
