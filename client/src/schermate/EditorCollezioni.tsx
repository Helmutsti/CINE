/*
 * Editor delle collezioni: SC-19 Nome della collezione (nuova o rinomina) · SC-20 Titoli della collezione.
 * Solo per i profili con il permesso "Gestione collezioni" di Jellyfin (o amministratori).
 */
import { useEffect, useState } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getCollectionApi } from '@jellyfin/sdk/lib/utils/api/collection-api'
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Campo, Card, Icona, Pulsante } from '../componenti'
import { api, dimentica, orizzontale, useCarica } from '../jf'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI } from './comune'
import { Tastiera } from './Tastiera'

/** dopo una modifica le collezioni si rileggono dal server */
function dimenticaCollezioni(uid: string, id?: string) {
  dimentica(`collezioni:${uid}:`)
  if (id) {
    dimentica(`collezione:${uid}:${id}`)
    dimentica(`collezione-film:${uid}:${id}`)
  }
}

export function NomeCollezione({ id, nome }: { id?: string; nome?: string }) {
  const nav = useNav()
  const { uid } = useStato()
  const [testo, setTesto] = useState(nome ?? '')
  const [salvo, setSalvo] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  useFuocoIniziale('tasto-a')
  const rinomina = !!id

  const continua = async () => {
    const n = testo.trim()
    if (!n || salvo) return
    setSalvo(true)
    setErrore(null)
    try {
      if (rinomina) {
        const t = (await getLibraryApi(api).getItem({ itemId: id!, userId: uid })).data
        await getItemUpdateApi(api).updateItem({ itemId: id!, baseItemDto: { ...t, Name: n } })
        dimenticaCollezioni(uid, id)
        nav.indietro()
      } else {
        const r = await getCollectionApi(api).createCollection({ name: n, isLocked: false })
        dimenticaCollezioni(uid)
        nav.sostituisci({ s: 'titoli-collezione', id: r.data.Id!, nuova: true })
      }
    } catch {
      setSalvo(false)
      setErrore(rinomina ? 'Il server non ha rinominato la collezione.' : 'Il server non ha creato la collezione.')
    }
  }

  return (
    <div className="schermata" data-livello>
      <h1 className="t-titolo-pagina" style={{ position: 'absolute', left: 96, top: 64, margin: 0 }}>{rinomina ? 'Rinomina' : 'Nuova collezione'}</h1>
      <div style={{ position: 'absolute', left: 96, top: 172, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Campo testo={testo} suggerimento="Nome della collezione" larghezza={608} />
        <Tastiera testo={testo} onCambia={setTesto} />
      </div>
      <div style={{ position: 'absolute', left: 776, top: 186, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <p className="t-meta c-2" style={{ margin: 0 }}>
          {rinomina ? 'Scrivi il nuovo nome della collezione.' : 'Scrivi il nome della collezione. Dopo scegli i titoli da metterci.'}
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <Pulsante fid="nc-continua" tipo="principale" onOk={continua}>
            {salvo ? (rinomina ? 'Salvo…' : 'Creo…') : rinomina ? 'Salva' : 'Continua'}
          </Pulsante>
          <Pulsante fid="nc-annulla" onOk={() => nav.indietro()}>
            Annulla
          </Pulsante>
        </div>
        {!testo.trim() && <p className="t-meta c-3" style={{ margin: 0 }}>Il nome non può essere vuoto.</p>}
        {errore && <p className="t-meta c-2" style={{ margin: 0 }}>{errore}</p>}
      </div>
    </div>
  )
}

export function TitoliCollezione({ id, nuova }: { id: string; nuova?: boolean }) {
  const nav = useNav()
  const { uid } = useStato()
  const lib = getLibraryApi(api)
  const [q, setQ] = useState('')
  const [cercato, setCercato] = useState('')
  useFuocoIniziale('tasto-a')
  useEffect(() => {
    const t = setTimeout(() => setCercato(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const col = useCarica(`collezione:${uid}:${id}`, async () => (await lib.getItem({ itemId: id, userId: uid })).data)
  const dentro = useCarica(`collezione-film:${uid}:${id}`, async () => (await lib.getItems({ userId: uid, parentId: id, sortBy: ['PremiereDate', 'ProductionYear', 'SortName'], fields: [...CAMPI] })).data.Items ?? [])
  const trovati = useCarica(cercato ? `cerca:${uid}:${cercato}` : null, async () => (await lib.getItems({ userId: uid, searchTerm: cercato, includeItemTypes: ['Movie', 'Series'], recursive: true, limit: 60, fields: [...CAMPI] })).data.Items ?? [])

  /** i titoli nella collezione, aggiornati subito a ogni OK (il server segue) */
  const [ids, setIds] = useState<Set<string> | null>(null)
  useEffect(() => {
    if (dentro.dati && !ids) setIds(new Set(dentro.dati.map((t) => t.Id!)))
  }, [dentro.dati, ids])
  const [errore, setErrore] = useState<string | null>(null)

  const cambia = async (t: BaseItemDto) => {
    if (!ids) return
    const c = getCollectionApi(api)
    const era = ids.has(t.Id!)
    const nuovi = new Set(ids)
    if (era) nuovi.delete(t.Id!)
    else nuovi.add(t.Id!)
    setIds(nuovi)
    setErrore(null)
    try {
      if (era) await c.removeFromCollection({ collectionId: id, ids: [t.Id!] })
      else await c.addToCollection({ collectionId: id, ids: [t.Id!] })
      dimenticaCollezioni(uid, id)
    } catch {
      setIds(ids)
      setErrore(`Il server non ha ${era ? 'tolto' : 'aggiunto'} «${t.Name}».`)
    }
  }
  const fine = () => (nuova ? nav.sostituisci({ s: 'collezione', id }) : nav.indietro())

  // senza ricerca: i titoli già nella collezione (anche quelli tolti adesso, per poterli rimettere)
  const elenco = cercato ? trovati.dati ?? [] : dentro.dati ?? []
  const quanti = ids?.size ?? 0

  return (
    <div className="schermata" data-livello>
      <div style={{ position: 'absolute', left: 96, right: 96, top: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <h1 className="t-titolo-pagina" style={{ margin: 0 }}>{col.dati?.Name ?? ''}</h1>
          <span className="t-meta c-2">{quanti === 1 ? '1 titolo' : `${quanti} titoli`}</span>
        </div>
        <Pulsante fid="tc-fine" tipo="principale" onOk={fine}>
          Fine
        </Pulsante>
      </div>
      <div style={{ position: 'absolute', left: 96, top: 172, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Campo testo={q} suggerimento="Cerca un film o una serie" larghezza={608} />
        <Tastiera testo={q} onCambia={setQ} />
        {errore && <p className="t-meta c-2" style={{ margin: 0, width: 608 }}>{errore}</p>}
      </div>
      <div className="scorre" data-yscroll="0" style={{ left: 744, top: 140, padding: '32px 96px 300px 32px' }}>
        {!cercato && dentro.pronto && elenco.length === 0 ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>La collezione è vuota. Scrivi per cercare i film e le serie da aggiungere.</p>
        ) : cercato && !trovati.pronto ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>Cerco…</p>
        ) : cercato && elenco.length === 0 ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>Nessun risultato per «{cercato}».</p>
        ) : (
          <>
            <h2 className="t-titolo-riga" style={{ margin: '0 0 24px' }}>{cercato ? 'Risultati' : 'Nella collezione'}</h2>
            <div data-griglia style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 'var(--rail-gap)', rowGap: 32 }}>
              {elenco.map((t) => (
                <div key={t.Id} style={{ position: 'relative' }}>
                  <Card fid={'tc-' + t.Id} formato="orizzontale" larghezza="100%" sempre piccolo img={orizzontale(t)} titolo={t.Name ?? ''} onOk={() => cambia(t)} />
                  {ids?.has(t.Id!) && (
                    <span className="spunta-collezione" aria-label="Nella collezione">
                      <Icona nome="spunta" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
