/* SC-01 Scelta profilo. I profili sono gli utenti del server Jellyfin. */
import { useEffect } from 'react'
import { Avatar, Pulsante } from '../componenti'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'

/** la prima volta che si apre la scelta, cioè all'avvio dell'app */
let primaApertura = true

export function SceltaProfilo() {
  const { profili, errore, riprova, ultimoProfiloId, entra } = useStato()
  const nav = useNav()
  const scegli = (id: string) => {
    entra(id)
    nav.ricomincia({ s: 'home' })
  }

  // con un solo profilo non c'è niente da scegliere; all'avvio si rientra col profilo dell'ultima volta
  // («Cambia profilo» invece mostra sempre la scelta)
  useEffect(() => {
    if (!profili) return
    const avvio = primaApertura
    primaApertura = false
    const salvato = avvio ? profili.find((p) => p.id === ultimoProfiloId) : undefined
    if (salvato) scegli(salvato.id)
    else if (profili.length === 1) scegli(profili[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profili])

  useFuocoIniziale(errore ? 'riprova' : profili ? 'p-' + (profili.find((p) => p.id === ultimoProfiloId)?.id ?? profili[0]?.id) : null, [profili, errore])

  return (
    <div className="schermata" data-livello style={{ background: 'var(--bg)' }}>
      {errore ? (
        <div className="vuoto">
          <h1 className="t-titolo-pagina" style={{ margin: 0 }}>Non riesco a collegarmi</h1>
          <p className="t-sinossi c-2">{errore}</p>
          <Pulsante fid="riprova" tipo="principale" onOk={riprova}>
            Riprova
          </Pulsante>
        </div>
      ) : !profili ? (
        <div className="vuoto">
          <p className="t-sinossi c-2">Collegamento al server…</p>
        </div>
      ) : (
        <>
          <h1 className="t-titolo-pagina" style={{ position: 'absolute', top: 200, left: 0, right: 0, margin: 0, textAlign: 'center' }}>Chi guarda?</h1>
          <div style={{ position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 64, alignItems: 'flex-start' }}>
            {profili.map((p) => (
              <Avatar key={p.id} ritratto fid={'p-' + p.id} nome={p.nome} foto={p.foto ?? undefined} nota={p.limitato ? 'Contenuti limitati' : undefined} onOk={() => scegli(p.id)} />
            ))}
          </div>
          <div style={{ position: 'absolute', top: 880, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <Pulsante fid="p-gestisci" onOk={() => nav.vai({ s: 'impostazioni', sezione: 'profili' })}>
              Gestisci profili
            </Pulsante>
          </div>
        </>
      )}
    </div>
  )
}
