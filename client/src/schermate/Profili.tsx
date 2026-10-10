/* SC-01 Scelta profilo. I profili sono gli utenti del server Jellyfin. */
import { useEffect } from 'react'
import { Avatar, Pulsante } from '../componenti'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'

export function SceltaProfilo() {
  const { profili, errore, riprova, ultimoProfiloId, entra } = useStato()
  const nav = useNav()
  const scegli = (id: string) => {
    entra(id)
    nav.ricomincia({ s: 'home' })
  }

  // con un solo profilo non c'è niente da scegliere
  useEffect(() => {
    if (profili?.length === 1) scegli(profili[0].id)
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
          <h1 className="t-titolo-pagina" style={{ position: 'absolute', top: 300, left: 0, right: 0, margin: 0, textAlign: 'center' }}>Chi guarda?</h1>
          <div style={{ position: 'absolute', top: 430, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 80, alignItems: 'flex-start' }}>
            {profili.map((p) => (
              <Avatar key={p.id} fid={'p-' + p.id} nome={p.nome} foto={p.foto ?? undefined} nota={p.limitato ? 'Contenuti limitati' : undefined} onOk={() => scegli(p.id)} />
            ))}
          </div>
          <div style={{ position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <Pulsante fid="p-gestisci" onOk={() => nav.vai({ s: 'impostazioni', sezione: 'profili' })}>
              Gestisci profili
            </Pulsante>
          </div>
        </>
      )}
    </div>
  )
}
