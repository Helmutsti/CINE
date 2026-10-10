/*
 * SC-17 Impostazioni (schema F · a pannelli). Libreria e profili stanno sul server Jellyfin:
 * qui si vedono, si aggiorna la libreria; cartelle e utenti si gestiscono dal pannello di Jellyfin.
 */
import { useState } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api'
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api'
import { Pulsante, VoceElenco } from '../componenti'
import { api, dimentica, useCarica } from '../jf'
import { corrente, mettiId } from '../fuoco'
import { useFuocoIniziale, useTasti, type Voce } from '../nav'
import { useStato } from '../stato'

export function Impostazioni({ voce }: { voce: Extract<Voce, { s: 'impostazioni' }> }) {
  const { profili } = useStato()
  const [sezione, setSezione] = useState<'libreria' | 'profili'>(voce.sezione ?? 'libreria')
  const [aggiorna, setAggiorna] = useState<'mai' | 'in-corso' | 'fatto' | 'errore'>('mai')
  const cartelle = useCarica('libreria:cartelle', async () => (await getLibraryStructureApi(api).getVirtualFolders()).data)
  const server = useCarica('server:info', async () => (await getSystemApi(api).getPublicSystemInfo()).data)
  useFuocoIniziale('sez-' + sezione)

  useTasti((t) => {
    const f = corrente()?.dataset.f
    if (t === 'destra' && f?.startsWith('sez-')) {
      return sezione === 'libreria' ? mettiId('lib-aggiorna') : mettiId('pr-' + profili?.[0]?.id)
    }
  })

  return (
    <div className="schermata" data-livello>
      <h1 className="t-titolo-pagina" style={{ position: 'absolute', left: 96, top: 120, margin: 0 }}>Impostazioni</h1>
      <div style={{ position: 'absolute', left: 96, top: 240, width: 448, display: 'flex', flexDirection: 'column', gap: 4 }} data-g="sezioni">
        <VoceElenco fid="sez-libreria" testo="Libreria" selezionata={sezione === 'libreria'} pref={sezione === 'libreria'} onFuoco={() => setSezione('libreria')} onOk={() => mettiId('lib-aggiorna')} />
        <VoceElenco fid="sez-profili" testo="Profili" selezionata={sezione === 'profili'} pref={sezione === 'profili'} onFuoco={() => setSezione('profili')} onOk={() => mettiId('pr-' + profili?.[0]?.id)} />
        {server.dati && (
          <p className="t-meta c-2" style={{ margin: '32px 24px 0' }}>
            Server {server.dati.ServerName} · Jellyfin {server.dati.Version}
            <br />
            Cineteca {__VERSIONE__}
          </p>
        )}
      </div>

      <div style={{ position: 'absolute', left: 640, right: 96, top: 240, padding: 40, borderRadius: 'var(--r-finestra)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sezione === 'libreria' && (
          <>
            <h2 className="t-titolo-riga" style={{ margin: 0 }}>Cartelle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(cartelle.dati ?? []).map((c) => (
                <div key={c.ItemId ?? c.Name} className="voce" style={{ cursor: 'default' }}>
                  <div className="voce__testi">
                    <span className="t-pulsante">{c.Name}</span>
                    <span className="voce__dettaglio t-meta">{(c.Locations ?? []).join(' · ')}</span>
                  </div>
                </div>
              ))}
              {cartelle.pronto && !cartelle.dati?.length && <p className="t-meta c-2" style={{ margin: '8px 24px' }}>Il server non ha ancora cartelle: aggiungile dal pannello di Jellyfin.</p>}
            </div>
            <p className="t-meta c-2" style={{ margin: 0 }}>Le cartelle si aggiungono e si tolgono dal pannello di controllo di Jellyfin.</p>
            <div>
              <Pulsante
                fid="lib-aggiorna"
                onOk={async () => {
                  if (aggiorna === 'in-corso') return
                  setAggiorna('in-corso')
                  try {
                    await getLibraryApi(api).refreshLibrary()
                    dimentica('home:')
                    setAggiorna('fatto')
                  } catch {
                    setAggiorna('errore')
                  }
                }}
              >
                {aggiorna === 'in-corso' ? 'Avvio l’aggiornamento…' : aggiorna === 'fatto' ? 'Aggiornamento avviato sul server' : aggiorna === 'errore' ? 'Non riuscito: riprova' : 'Aggiorna tutta la libreria'}
              </Pulsante>
            </div>
          </>
        )}

        {sezione === 'profili' && (
          <>
            <h2 className="t-titolo-riga" style={{ margin: 0 }}>Profili</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(profili ?? []).map((p) => (
                <VoceElenco
                  key={p.id}
                  fid={'pr-' + p.id}
                  testo={p.nome}
                  dettaglio={[p.amministratore ? 'Amministratore' : null, p.limitato ? 'Contenuti limitati dal controllo parentale' : 'Tutti i contenuti'].filter(Boolean).join(' · ')}
                />
              ))}
            </div>
            <p className="t-meta c-2" style={{ margin: 0 }}>I profili sono gli utenti di Jellyfin: si creano e si limitano (controllo parentale) dal pannello di controllo del server.</p>
          </>
        )}
      </div>
    </div>
  )
}
