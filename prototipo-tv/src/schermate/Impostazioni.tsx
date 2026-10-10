/* SC-17 Impostazioni (schema F · a pannelli): sezioni a sinistra, dettaglio a destra. */
import { useState } from 'react'
import { Campo, Finestra, Pulsante, VoceElenco } from '../componenti'
import { film, serie } from '../dati'
import { corrente, mettiId } from '../fuoco'
import { useFuocoIniziale, useNav, useTasti, type Voce } from '../nav'
import { useStato } from '../stato'
import { Tastiera } from './Tastiera'

type Conferma = { titolo: string; testo: string; azione: string; ok: () => void; torna: string }

export function Impostazioni({ voce }: { voce: Extract<Voce, { s: 'impostazioni' }> }) {
  const nav = useNav()
  const { st, azioni } = useStato()
  const [sezione, setSezione] = useState<'libreria' | 'profili'>(voce.sezione ?? 'libreria')
  const [profiloId, setProfiloId] = useState<string | null>(voce.profiloId ?? null)
  const [conferma, setConferma] = useState<Conferma | null>(null)
  const [nuovo, setNuovo] = useState<string | null>(null)
  const [aggiorna, setAggiorna] = useState<'mai' | 'in-corso' | 'fatto'>('mai')
  useFuocoIniziale(profiloId ? 'pd-18' : 'sez-' + sezione)

  const profilo = st.profili.find((p) => p.id === profiloId)

  // Indietro dal dettaglio di un profilo torna all'elenco dei profili
  useTasti((t) => {
    // → dalle sezioni entra nel dettaglio a destra
    const f = corrente()?.dataset.f
    if (t === 'destra' && f?.startsWith('sez-') && !conferma && nuovo === null) {
      if (sezione === 'libreria') return mettiId('lib-0') || mettiId('lib-aggiungi')
      return profilo ? mettiId('pd-18') : mettiId('pr-' + st.profili[0]?.id)
    }
    if (t === 'indietro' && profilo && !conferma && nuovo === null) {
      setProfiloId(null)
      setTimeout(() => mettiId('pr-' + profilo.id))
      return true
    }
  })

  const chiudiConferma = () => {
    const torna = conferma?.torna
    setConferma(null)
    setTimeout(() => mettiId(torna))
  }

  const n = { film: film.length, serie: serie.length }

  return (
    <div className="schermata" data-livello>
      <h1 className="t-titolo-pagina" style={{ position: 'absolute', left: 96, top: 120, margin: 0 }}>Impostazioni</h1>
      <div style={{ position: 'absolute', left: 96, top: 240, width: 448, display: 'flex', flexDirection: 'column', gap: 4 }} data-g="sezioni">
        <VoceElenco fid="sez-libreria" testo="Libreria" selezionata={sezione === 'libreria'} pref={sezione === 'libreria'} onFuoco={() => (setSezione('libreria'), setProfiloId(null))} onOk={() => mettiId('lib-0') || mettiId('lib-aggiungi')} />
        <VoceElenco fid="sez-profili" testo="Profili" selezionata={sezione === 'profili'} pref={sezione === 'profili'} onFuoco={() => setSezione('profili')} onOk={() => mettiId('pr-' + st.profili[0]?.id)} />
      </div>

      <div style={{ position: 'absolute', left: 640, right: 96, top: 240, padding: 40, borderRadius: 'var(--r-finestra)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sezione === 'libreria' && (
          <>
            <h2 className="t-titolo-riga" style={{ margin: 0 }}>Cartelle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {st.cartelle.map((c, i) => (
                <VoceElenco
                  key={c}
                  fid={'lib-' + i}
                  testo={c}
                  dettaglio="OK per toglierla"
                  onOk={() =>
                    setConferma({
                      titolo: 'Togliere la cartella?',
                      testo: `${c}. I file restano dove sono: spariscono solo dalla libreria.`,
                      azione: 'Togli',
                      ok: () => azioni.togliCartella(c),
                      torna: 'lib-aggiungi',
                    })
                  }
                />
              ))}
              {st.cartelle.length === 0 && <p className="t-meta c-3" style={{ margin: '8px 24px' }}>Nessuna cartella: la libreria è vuota.</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, marginTop: 8 }}>
              <Pulsante fid="lib-aggiungi" onOk={azioni.aggiungiCartella}>Aggiungi cartella</Pulsante>
              <div className="t-meta c-3">
                {st.cartelle.length ? `${n.film} film e ${n.serie} serie` : 'Nessun titolo'} · ultimo aggiornamento{' '}
                {aggiorna === 'fatto' ? 'adesso' : 'oggi alle 14:20'}
              </div>
              <Pulsante
                fid="lib-aggiorna"
                onOk={() => {
                  if (aggiorna === 'in-corso') return
                  setAggiorna('in-corso')
                  setTimeout(() => setAggiorna('fatto'), 2000)
                }}
              >
                {aggiorna === 'in-corso' ? 'Aggiornamento in corso…' : 'Aggiorna tutto'}
              </Pulsante>
            </div>
          </>
        )}

        {sezione === 'profili' && !profilo && (
          <>
            <h2 className="t-titolo-riga" style={{ margin: 0 }}>Profili</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {st.profili.map((p) => (
                <VoceElenco
                  key={p.id}
                  fid={'pr-' + p.id}
                  testo={p.nome}
                  dettaglio={[p.nascondi18 ? '18+ nascosti' : 'Tutti i contenuti', p.pin ? 'PIN impostato' : 'Senza PIN'].join(' · ')}
                  onOk={() => {
                    setProfiloId(p.id)
                    setTimeout(() => mettiId('pd-18'))
                  }}
                />
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <Pulsante fid="pr-aggiungi" onOk={() => setNuovo('')}>Aggiungi profilo</Pulsante>
            </div>
          </>
        )}

        {sezione === 'profili' && profilo && (
          <>
            <h2 className="t-titolo-riga" style={{ margin: 0 }}>{profilo.nome}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <VoceElenco
                fid="pd-18"
                testo="Nascondi contenuti 18+"
                dettaglio="I titoli per adulti spariscono da Home, ricerca, sezioni e collezioni"
                interruttore={profilo.nascondi18}
                onOk={() => {
                  if (!profilo.nascondi18 && !profilo.pin) {
                    nav.aggiornaCima({ sezione: 'profili', profiloId: profilo.id })
                    nav.vai({ s: 'pin', profiloId: profilo.id, scopo: 'nuovo', poi: () => azioni.cambiaProfilo(profilo.id, { nascondi18: true }) })
                  } else azioni.cambiaProfilo(profilo.id, { nascondi18: !profilo.nascondi18 })
                }}
              />
              <VoceElenco
                fid="pd-pin"
                testo={profilo.pin ? 'Cambia PIN' : 'Scegli un PIN'}
                dettaglio={profilo.pin ? 'Serve il PIN attuale' : 'Nessun PIN impostato'}
                onOk={() => {
                  nav.aggiornaCima({ sezione: 'profili', profiloId: profilo.id })
                  nav.vai({ s: 'pin', profiloId: profilo.id, scopo: profilo.pin ? 'cambia' : 'nuovo' })
                }}
              />
              <VoceElenco
                fid="pd-elimina"
                testo="Elimina profilo"
                onOk={() =>
                  setConferma({
                    titolo: `Eliminare ${profilo.nome}?`,
                    testo: 'Si perdono la sua lista e i punti in cui ha interrotto i titoli.',
                    azione: 'Elimina',
                    ok: () => {
                      azioni.eliminaProfilo(profilo.id)
                      setProfiloId(null)
                    },
                    torna: 'sez-profili',
                  })
                }
              />
            </div>
          </>
        )}
      </div>

      {conferma && (
        <Finestra titolo={conferma.titolo} testo={conferma.testo} onChiudi={chiudiConferma}>
          <AzioniConferma
            azione={conferma.azione}
            onOk={() => {
              conferma.ok()
              chiudiConferma()
            }}
            onAnnulla={chiudiConferma}
          />
        </Finestra>
      )}
      {nuovo !== null && (
        <Finestra
          titolo="Nuovo profilo"
          larghezza={760}
          onChiudi={() => {
            setNuovo(null)
            setTimeout(() => mettiId('pr-aggiungi'))
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
                setTimeout(() => mettiId('pr-' + id))
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

function AzioniConferma({ azione, onOk, onAnnulla }: { azione: string; onOk: () => void; onAnnulla: () => void }) {
  useFuocoIniziale('cf-annulla')
  return (
    <div className="finestra__azioni">
      <Pulsante fid="cf-ok" tipo="principale" onOk={onOk}>{azione}</Pulsante>
      <Pulsante fid="cf-annulla" onOk={onAnnulla}>Annulla</Pulsante>
    </div>
  )
}
