/*
 * Editor delle collezioni, come le playlist: "+ Nuova collezione" la crea subito e apre la sua pagina,
 * dove si aggiungono i suggeriti o si cerca (SC-20). SC-19 serve solo a rinominare.
 * Dalla scheda di un titolo: la finestra Aggiungi a collezione.
 * Solo per i profili con il permesso "Gestione collezioni" di Jellyfin (o amministratori).
 */
import { useEffect, useState } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getCollectionApi } from '@jellyfin/sdk/lib/utils/api/collection-api'
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Campo, Card, Finestra, Icona, Pulsante, Scelta } from '../componenti'
import { api, dimentica, orizzontale, useCarica } from '../jf'
import { mettiId } from '../fuoco'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI } from './comune'
import { Tastiera } from './Tastiera'
import { copiaImmagini } from './Immagini'

/** dopo una modifica le collezioni si rileggono dal server */
export function dimenticaCollezioni(uid: string, id?: string) {
  dimentica(`collezioni:${uid}:`)
  dimentica(`home:collezioni:${uid}`)
  if (id) {
    dimentica(`collezione:${uid}:${id}`)
    dimentica(`collezione-film:${uid}:${id}`)
  }
}

/** Crea una collezione vuota (o con dei titoli) con il primo nome libero: "Nuova collezione", "Nuova collezione 2"… */
export async function creaCollezione(uid: string, titoli: string[] = []): Promise<string> {
  const esistenti = new Set(
    ((await getLibraryApi(api).getItems({ userId: uid, includeItemTypes: ['BoxSet'], recursive: true })).data.Items ?? []).map((c) => c.Name),
  )
  let nome = 'Nuova collezione'
  for (let n = 2; esistenti.has(nome); n++) nome = `Nuova collezione ${n}`
  const r = await getCollectionApi(api).createCollection({ name: nome, ids: titoli, isLocked: false })
  dimenticaCollezioni(uid)
  return r.data.Id!
}

export async function aggiungiAllaCollezione(uid: string, collezione: string, titolo: string) {
  await getCollectionApi(api).addToCollection({ collectionId: collezione, ids: [titolo] })
  await copertinaSeManca(uid, collezione, titolo)
  dimenticaCollezioni(uid, collezione)
}

/** Una collezione senza immagini prende quelle del primo titolo che ci entra: la card non resta grigia. */
export async function copertinaSeManca(uid: string, collezione: string, titolo: string) {
  try {
    const lib = getLibraryApi(api)
    const c = (await lib.getItem({ itemId: collezione, userId: uid })).data
    if (c.BackdropImageTags?.length) return
    await copiaImmagini((await lib.getItem({ itemId: titolo, userId: uid })).data, collezione)
  } catch {
    /* senza copertina la collezione funziona lo stesso */
  }
}

/**
 * Suggeriti per una collezione: se è vuota, i titoli che somigliano al nome (se non è quello di partenza)
 * e poi titoli a caso; se ha già dei titoli, i simili ai suoi ultimi tre.
 */
export function useSuggeriti(uid: string, collezione: BaseItemDto | undefined, dentro: BaseItemDto[] | undefined, giro: number) {
  const lib = getLibraryApi(api)
  const chiave = collezione && dentro ? `suggeriti:${uid}:${collezione.Id}:${dentro.length}:${giro}` : null
  return useCarica(chiave, async () => {
    const gia = new Set(dentro!.map((t) => t.Id))
    const out: BaseItemDto[] = []
    const metti = (el: BaseItemDto[]) => el.forEach((t) => !gia.has(t.Id) && !out.some((x) => x.Id === t.Id) && out.push(t))
    if (dentro!.length) {
      for (const t of dentro!.slice(-3)) metti((await lib.getSimilarItems({ itemId: t.Id!, userId: uid, limit: 12, fields: [...CAMPI] })).data.Items ?? [])
    } else {
      const nome = (collezione!.Name ?? '').replace(/^Nuova collezione( \d+)?$/, '').trim()
      if (nome) metti((await lib.getItems({ userId: uid, searchTerm: nome, includeItemTypes: ['Movie', 'Series'], recursive: true, limit: 12, fields: [...CAMPI] })).data.Items ?? [])
    }
    if (out.length < 12) metti((await lib.getItems({ userId: uid, includeItemTypes: ['Movie'], recursive: true, sortBy: ['Random'], limit: 16, fields: [...CAMPI] })).data.Items ?? [])
    return out.slice(0, 16)
  })
}

/** Finestra della scheda: in quali collezioni sta il titolo. OK mette o toglie; + Nuova collezione la crea con il titolo dentro. */
export function AggiungiACollezione({ titolo, onChiudi }: { titolo: BaseItemDto; onChiudi: () => void }) {
  const { uid } = useStato()
  const lib = getLibraryApi(api)
  const elenco = useCarica(`collezioni-di:${uid}:${titolo.Id}`, async () => {
    const tutte = (await lib.getItems({ userId: uid, includeItemTypes: ['BoxSet'], recursive: true, sortBy: ['SortName'] })).data.Items ?? []
    const con = await Promise.all(tutte.map(async (c) => ((await lib.getItems({ userId: uid, parentId: c.Id! })).data.Items ?? []).some((x) => x.Id === titolo.Id)))
    return tutte.map((c, i) => ({ id: c.Id!, nome: c.Name ?? '', dentro: con[i] }))
  })
  const [stato, setStato] = useState<Record<string, boolean>>({})
  const [occupato, setOccupato] = useState(false)
  const voci = (elenco.dati ?? []).map((c) => ({ ...c, dentro: stato[c.id] ?? c.dentro }))
  useEffect(() => {
    if (elenco.pronto) setTimeout(() => mettiId(voci[0] ? `ac-${voci[0].id}` : 'ac-nuova'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elenco.pronto])

  const cambia = async (c: { id: string; dentro: boolean }) => {
    setStato((s) => ({ ...s, [c.id]: !c.dentro }))
    try {
      const api_ = getCollectionApi(api)
      if (c.dentro) await api_.removeFromCollection({ collectionId: c.id, ids: [titolo.Id!] })
      else await api_.addToCollection({ collectionId: c.id, ids: [titolo.Id!] }).then(() => copertinaSeManca(uid, c.id, titolo.Id!))
      dimenticaCollezioni(uid, c.id)
    } catch {
      setStato((s) => ({ ...s, [c.id]: c.dentro }))
    }
  }
  const nuova = async () => {
    if (occupato) return
    setOccupato(true)
    try {
      const nuovaId = await creaCollezione(uid, [titolo.Id!])
      await copertinaSeManca(uid, nuovaId, titolo.Id!)
      dimentica(`collezioni-di:${uid}:${titolo.Id}`)
      elenco.ricarica()
    } finally {
      setOccupato(false)
    }
  }

  return (
    <Finestra titolo="Aggiungi a collezione" testo={elenco.pronto && !voci.length ? 'Non ci sono ancora collezioni: creane una con questo titolo dentro.' : `Scegli in quali collezioni mettere «${titolo.Name}».`} onChiudi={onChiudi}>
      <div data-g="ac" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {voci.map((c) => (
          <Scelta key={c.id} fid={`ac-${c.id}`} testo={c.nome} selezionata={c.dentro} onOk={() => cambia(c)} />
        ))}
      </div>
      <div className="finestra__azioni">
        <Pulsante fid="ac-nuova" icona="piu" onOk={nuova}>
          {occupato ? 'Creo…' : 'Nuova collezione'}
        </Pulsante>
        <Pulsante fid="ac-fine" tipo="principale" onOk={onChiudi}>
          Fine
        </Pulsante>
      </div>
    </Finestra>
  )
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
      <div data-colonna="tastiera" style={{ position: 'absolute', left: 96, top: 172, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Campo testo={testo} suggerimento="Nome della collezione" larghezza={608} />
        <Tastiera testo={testo} onCambia={setTesto} />
      </div>
      <div data-colonna="azioni" style={{ position: 'absolute', left: 776, top: 186, display: 'flex', flexDirection: 'column', gap: 32 }}>
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
      else await c.addToCollection({ collectionId: id, ids: [t.Id!] }).then(() => copertinaSeManca(uid, id, t.Id!))
      dimenticaCollezioni(uid, id)
    } catch {
      setIds(ids)
      setErrore(`Il server non ha ${era ? 'tolto' : 'aggiunto'} «${t.Name}».`)
    }
  }
  const fine = () => (nuova ? nav.sostituisci({ s: 'collezione', id }) : nav.indietro())
  // da Cerca nella pagina della collezione si torna lì

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
      <div data-colonna="tastiera" style={{ position: 'absolute', left: 96, top: 172, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Campo testo={q} suggerimento="Cerca un film o una serie" larghezza={608} />
        <Tastiera testo={q} onCambia={setQ} />
        {errore && <p className="t-meta c-2" style={{ margin: 0, width: 608 }}>{errore}</p>}
      </div>
      <div data-colonna="risultati" className="scorre" data-yscroll="0" style={{ left: 744, top: 140, padding: '32px 96px 300px 32px' }}>
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
