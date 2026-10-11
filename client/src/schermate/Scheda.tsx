/* SC-10 Scheda film · SC-11 Scheda serie (schema C) · SC-16 Aggiorna metadati, con i dati del server. */
import { useState } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api'
import { getItemLookupApi } from '@jellyfin/sdk/lib/utils/api/item-lookup-api'
import type { BaseItemDto, RemoteSearchResult } from '@jellyfin/sdk/lib/generated-client/models'
import { Campo, Card, Finestra, PersonaCast, Pulsante, Riga, Scelta, Sfondo, Tendina, VoceElenco } from '../componenti'
import { durata } from '../dati'
import { api, dimentica, fotoPersona, minuti, orizzontale, secondi, sfondo, useCarica } from '../jf'
import { mettiId } from '../fuoco'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI, metaBreve, sigla, useAzionePrincipale } from './comune'
import { useRipresa } from './Ripresa'
import { Tastiera } from './Tastiera'
import { CambiaImmagini } from './Immagini'
import { PannelloTrama, RigaDati, TramaBreve } from './Titolo'
import { AggiungiACollezione } from './EditorCollezioni'

export function Scheda({ id }: { id: string }) {
  const nav = useNav()
  const { uid, profilo } = useStato()
  const ripresa = useRipresa()
  const lib = getLibraryApi(api)
  const voce = useCarica(`titolo:${uid}:${id}`, async () => (await lib.getItem({ itemId: id, userId: uid })).data)
  const simili = useCarica(`simili:${uid}:${id}`, async () => (await lib.getSimilarItems({ itemId: id, userId: uid, limit: 12, fields: [...CAMPI] })).data.Items ?? [])
  const t = voce.dati
  const principale = useAzionePrincipale(t)
  const [preferito, setPreferito] = useState<boolean | null>(null)
  const [altro, setAltro] = useState(false)
  const [metadati, setMetadati] = useState<null | 'scegli' | 'correggi' | 'in-corso' | 'immagini'>(null)
  const [trama, setTrama] = useState(false)
  const [collezione, setCollezione] = useState(false)
  useFuocoIniziale(t && principale ? 's-principale' : null, [!!t, !!principale])

  if (!t) {
    return (
      <div className="schermata" data-livello>
        <div className="vuoto">
          <p className="t-sinossi c-2">{voce.errore ? 'Non riesco a leggere questo titolo dal server.' : 'Carico…'}</p>
        </div>
      </div>
    )
  }

  const inLista = preferito ?? !!t.UserData?.IsFavorite
  const regia = t.People?.find((p) => p.Type === 'Director')
  const cast = (t.People ?? []).filter((p) => p.Type === 'Actor').slice(0, 20)
  const trailerYoutube = t.RemoteTrailers?.find((r) => r.Url?.includes('youtu'))?.Url

  const apriTrailer = async () => {
    if (t.LocalTrailerCount) {
      const tr = (await lib.getLocalTrailers({ itemId: t.Id!, userId: uid })).data[0]
      if (tr) return nav.vai({ s: 'player', id: tr.Id!, trailer: { id: tr.Id!, titolo: t.Name ?? '' } })
    }
    if (trailerYoutube) nav.vai({ s: 'player', id: t.Id!, trailer: { youtube: trailerYoutube, titolo: t.Name ?? '' } })
  }

  const cambiaLista = async () => {
    setPreferito(!inLista)
    const ud = getUserDataApi(api)
    if (inLista) await ud.unmarkFavoriteItem({ itemId: t.Id!, userId: uid })
    else await ud.markFavoriteItem({ itemId: t.Id!, userId: uid })
    dimentica(`home:lista:${uid}`)
  }

  const chiudiMetadati = () => {
    setMetadati(null)
    setTimeout(() => mettiId('s-altro'))
  }
  const aggiornaMetadati = async () => {
    setMetadati('in-corso')
    try {
      await lib.refreshItem({ itemId: t.Id!, metadataRefreshMode: 'FullRefresh', imageRefreshMode: 'FullRefresh', replaceAllMetadata: false, replaceAllImages: false })
    } finally {
      // il server aggiorna in background: si rilegge la scheda poco dopo
      setTimeout(() => {
        dimentica(`titolo:${uid}:${id}`)
        voce.ricarica()
        chiudiMetadati()
      }, 2500)
    }
  }

  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="96">
        <section data-y="cima" style={{ position: 'relative', height: 820 }}>
          <div style={{ position: 'absolute', inset: '0 0 auto', height: 1080 }}>
            <Sfondo img={sfondo(t)} />
          </div>
          <div style={{ position: 'absolute', left: 96, bottom: 40, width: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h1 className="t-titolo-scheda" style={{ margin: 0 }}>{t.Name}</h1>
            <RigaDati t={t} />
            {t.Overview && <TramaBreve fid="s-trama" testo={t.Overview} onLeggi={() => setTrama(true)} />}
            <div style={{ display: 'flex', gap: 16, marginTop: 40 }} data-g="azioni">
              <Pulsante fid="s-principale" tipo="principale" icona="play" pref onOk={() => principale && ripresa.avvia(principale.voce, principale.iniziato, principale, 's-principale')}>
                {principale?.testo ?? 'Guarda'}
              </Pulsante>
              {(!!t.LocalTrailerCount || trailerYoutube) && (
                <Pulsante fid="s-trailer" onOk={apriTrailer}>
                  Trailer
                </Pulsante>
              )}
              {profilo?.collezioni && (
                <Pulsante fid="s-collezione" onOk={() => setCollezione(true)}>
                  Aggiungi a collezione
                </Pulsante>
              )}
              <Pulsante fid="s-lista" tipo="icona" icona={inLista ? 'spunta' : 'piu'} etichetta={inLista ? 'Nella mia lista' : 'Aggiungi alla mia lista'} onOk={cambiaLista} />
              <div style={{ position: 'relative' }}>
                <Pulsante fid="s-altro" tipo="icona" icona="matita" etichetta="Modifica" onOk={() => setAltro(true)} />
                {altro && (
                  <Tendina
                    voci={[
                      { id: 'metadati', testo: 'Aggiorna metadati' },
                      { id: 'immagini', testo: 'Cambia immagini' },
                    ]}
                    stile={{ top: 76, left: 0 }}
                    onChiudi={() => {
                      setAltro(false)
                      setTimeout(() => mettiId('s-altro'))
                    }}
                    onScegli={(v) => {
                      setAltro(false)
                      setMetadati(v === 'immagini' ? 'immagini' : 'scegli')
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 56, paddingTop: 64, paddingBottom: 400 }}>
          {t.Type === 'Series' && <Episodi serie={t} avvia={ripresa.avvia} />}
          {cast.length > 0 && (
            <Riga g="cast" titolo="Cast">
              {cast.map((p) => (
                <PersonaCast key={p.Id} fid={'cast-' + p.Id} nome={p.Name ?? ''} foto={fotoPersona(p.Id, p.PrimaryImageTag)} ruolo={p.Role} onOk={() => nav.vai({ s: 'attore', id: p.Id! })} />
              ))}
            </Riga>
          )}
          {!!simili.dati?.length && (
            <Riga g="altri" titolo={t.Type === 'Series' ? 'Altre serie' : 'Altri film'}>
              {simili.dati.map((x) => (
                <Card key={x.Id} fid={'altri-' + x.Id} formato="orizzontale" img={orizzontale(x)} titolo={x.Name ?? ''} meta={metaBreve(x)} onOk={() => nav.vai({ s: 'titolo', id: x.Id! })} />
              ))}
            </Riga>
          )}
        </div>
      </div>

      {collezione && (
        <AggiungiACollezione
          titolo={t}
          onChiudi={() => {
            setCollezione(false)
            setTimeout(() => mettiId('s-collezione'))
          }}
        />
      )}
      {trama && (
        <PannelloTrama
          id={t.Id!}
          onChiudi={() => {
            setTrama(false)
            setTimeout(() => mettiId('s-trama'))
          }}
        />
      )}
      {metadati === 'scegli' && (
        <Finestra
          titolo="Aggiorna metadati"
          testo={
            <>
              {t.Name} è riconosciuto come «{t.Name}»{t.ProductionYear ? ` (${t.ProductionYear})` : ''}
              {regia ? `, regia di ${regia.Name}` : ''}.
            </>
          }
          onChiudi={chiudiMetadati}
        >
          <AzioniMetadati onAggiorna={aggiornaMetadati} onCorreggi={() => setMetadati('correggi')} onAnnulla={chiudiMetadati} />
        </Finestra>
      )}
      {metadati === 'in-corso' && (
        <Finestra titolo="Aggiorna metadati" testo="Il server sta rileggendo trama, immagini e cast…" onChiudi={() => {}}>
          <div />
        </Finestra>
      )}
      {metadati === 'correggi' && (
        <Correggi
          t={t}
          onFatto={() => {
            dimentica(`titolo:${uid}:${id}`)
            voce.ricarica()
            chiudiMetadati()
          }}
          onChiudi={chiudiMetadati}
        />
      )}
      {metadati === 'immagini' && (
        <CambiaImmagini
          t={t}
          onFatto={() => {
            // le immagini cambiano anche nelle righe delle altre schermate
            dimentica('')
            voce.ricarica()
            chiudiMetadati()
          }}
          onChiudi={chiudiMetadati}
        />
      )}
      {ripresa.finestra}
    </div>
  )
}

function AzioniMetadati(p: { onAggiorna: () => void; onCorreggi: () => void; onAnnulla: () => void }) {
  useFuocoIniziale('m-aggiorna')
  return (
    <div className="finestra__azioni">
      <Pulsante fid="m-aggiorna" tipo="principale" onOk={p.onAggiorna}>
        Aggiorna
      </Pulsante>
      <Pulsante fid="m-correggi" onOk={p.onCorreggi}>
        Correggi titolo
      </Pulsante>
      <Pulsante fid="m-annulla" onOk={p.onAnnulla}>
        Annulla
      </Pulsante>
    </div>
  )
}

/** SC-16 · Correggi titolo: si cerca il titolo giusto nei cataloghi online del server e lo si applica. */
function Correggi({ t, onFatto, onChiudi }: { t: BaseItemDto; onFatto: () => void; onChiudi: () => void }) {
  const [q, setQ] = useState(t.Name ?? '')
  const [cerca, setCerca] = useState(t.Name ?? '')
  const [applico, setApplico] = useState(false)
  const lookup = getItemLookupApi(api)
  const risultati = useCarica(cerca ? `correggi:${t.Id}:${cerca}` : null, async () => {
    const info = { ItemId: t.Id!, SearchInfo: { Name: cerca } }
    const r = t.Type === 'Series' ? await lookup.getSeriesRemoteSearchResults({ seriesInfoRemoteSearchQuery: info }) : await lookup.getMovieRemoteSearchResults({ movieInfoRemoteSearchQuery: info })
    return r.data
  })
  const el: RemoteSearchResult[] = risultati.dati ?? []
  useFuocoIniziale(el[0] ? 'cor-0' : 'tasto-a', [el.length > 0])
  const applica = async (r: RemoteSearchResult) => {
    setApplico(true)
    await lookup.applySearchCriteria({ itemId: t.Id!, remoteSearchResult: r, replaceAllImages: true })
    setTimeout(onFatto, 2500)
  }
  return (
    <Finestra titolo="Correggi titolo" larghezza={1640} onChiudi={onChiudi}>
      <div style={{ display: 'flex', gap: 64, marginTop: 16 }}>
        <div data-colonna="tastiera" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Campo testo={q} suggerimento="Titolo da cercare" larghezza={608} />
          <Tastiera testo={q} onCambia={setQ} g="tastiera-correggi" />
          <Pulsante fid="cor-cerca" onOk={() => setCerca(q.trim())}>
            Cerca
          </Pulsante>
        </div>
        <div data-colonna="risultati" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 700, overflow: 'auto', scrollbarWidth: 'none' }}>
          <div className="t-meta c-2" style={{ margin: '0 0 12px 24px' }}>
            {applico ? 'Applico il titolo scelto…' : !risultati.pronto ? 'Cerco…' : el.length ? 'Titoli trovati' : 'Nessun titolo trovato.'}
          </div>
          {!applico &&
            el.slice(0, 8).map((r, i) => (
              <VoceElenco key={i} fid={'cor-' + i} testo={r.Name ?? ''} dettaglio={[r.ProductionYear, r.SearchProviderName].filter(Boolean).join(' · ')} locandina={r.ImageUrl ?? null} onOk={() => applica(r)} />
            ))}
        </div>
      </div>
    </Finestra>
  )
}

function Episodi({ serie: t, avvia }: { serie: BaseItemDto; avvia: ReturnType<typeof useRipresa>['avvia'] }) {
  const nav = useNav()
  const { uid } = useStato()
  const show = getShowApi(api)
  const stagioni = useCarica(`stagioni:${uid}:${t.Id}`, async () => (await show.getSeasons({ seriesId: t.Id!, userId: uid })).data.Items ?? [])
  const [scelta, setScelta] = useState<string | null>(null)
  const st = stagioni.dati ?? []
  const stagioneId = scelta ?? st.find((s) => !s.UserData?.Played)?.Id ?? st[0]?.Id ?? null
  const episodi = useCarica(stagioneId ? `episodi:${uid}:${stagioneId}` : null, async () => (await show.getEpisodes({ seriesId: t.Id!, seasonId: stagioneId!, userId: uid, fields: ['Overview'] })).data.Items ?? [])
  // mentre carica una stagione, tanti segnaposto quanti episodi ci si aspetta: la riga non si svuota e la pagina non salta
  const [ultimoNumero, setUltimoNumero] = useState(6)
  if (episodi.dati?.length && episodi.dati.length !== ultimoNumero) setUltimoNumero(episodi.dati.length)
  const attesi = st.find((s) => s.Id === stagioneId)?.ChildCount || ultimoNumero
  if (!st.length) return null
  return (
    <>
      <section data-y="inizio" style={{ display: 'flex', gap: 16, padding: '0 96px', flexWrap: 'wrap' }} data-g="stagioni">
        {st.map((s) => (
          <Scelta key={s.Id} fid={'st-' + s.Id} testo={s.Name ?? `Stagione ${s.IndexNumber}`} selezionata={s.Id === stagioneId} pref={s.Id === stagioneId} onFuoco={() => setScelta(s.Id!)} onOk={() => setScelta(s.Id!)} />
        ))}
      </section>
      <Riga g={'episodi-' + stagioneId} y="inizio" stile={{ marginTop: -24 }}>
        {!episodi.dati && Array.from({ length: attesi }, (_, i) => <CardInCaricamento key={i} />)}
        {(episodi.dati ?? []).map((e) => {
          const pos = secondi(e.UserData?.PlaybackPositionTicks)
          const tot = secondi(e.RunTimeTicks)
          const avanz = pos > 0 && tot ? pos / tot : e.UserData?.Played ? 1 : undefined
          return (
            <Card
              key={e.Id}
              fid={'ep-' + e.Id}
              formato="episodio"
              img={orizzontale(e)}
              titolo={`E${e.IndexNumber ?? ''} · ${e.Name ?? ''}`}
              meta={durata(minuti(e))}
              avanzamento={avanz}
              onOk={() => (pos > 0 ? avvia({ s: 'player', id: e.Id! }, true, { pos, durata: tot, cosa: `${t.Name} · ${sigla(e)}` }, 'ep-' + e.Id) : nav.vai({ s: 'player', id: e.Id! }))}
            />
          )
        })}
      </Riga>
    </>
  )
}

/** Segnaposto di una card episodio mentre la stagione carica: stesse misure, pulsa. */
function CardInCaricamento() {
  return (
    <div className="card card--sempre card--caricamento" style={{ width: 336 }} aria-hidden>
      <div className="card__img" />
      <div className="card__testo">
        <div className="t-card-titolo">
          <span className="card__riga-vuota" style={{ width: '70%' }}>&nbsp;</span>
        </div>
        <div className="t-meta-card">
          <span className="card__riga-vuota" style={{ width: '30%' }}>&nbsp;</span>
        </div>
      </div>
    </div>
  )
}

