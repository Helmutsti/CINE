/* SC-04 Film · SC-05 Serie · SC-08 La mia lista (schema B · Griglia), con i dati del server. */
import { useEffect, useState } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api'
import type { BaseItemDto, BaseItemKind, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import { Card, FilaGeneri, Menu, OrdinaFiltra, Pulsante, CaricamentoPagina } from '../componenti'
import { api, locandina, useCarica } from '../jf'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI } from './comune'

const COLONNE = 7
const BLOCCO = 70

const ORDINI = [
  { id: 'recenti', testo: 'Aggiunti di recente' },
  { id: 'titolo', testo: 'Titolo' },
  { id: 'anno', testo: 'Anno' },
]
export const ORDINE: Record<string, { sortBy: ItemSortBy[]; sortOrder: SortOrder[] }> = {
  recenti: { sortBy: ['DateCreated', 'SortName'], sortOrder: ['Descending', 'Ascending'] },
  titolo: { sortBy: ['SortName'], sortOrder: ['Ascending'] },
  anno: { sortBy: ['ProductionYear', 'SortName'], sortOrder: ['Descending', 'Ascending'] },
}

/** Griglia di locandine che si carica a blocchi mentre si scende. */
export function useGriglia(chiave: string, carica: (start: number, quanti: number) => Promise<{ el: BaseItemDto[]; totale: number }>) {
  const [el, setEl] = useState<BaseItemDto[]>([])
  const [totale, setTotale] = useState<number | null>(null)
  const [occupato, setOccupato] = useState(false)
  useEffect(() => {
    let vivo = true
    setEl([])
    setTotale(null)
    carica(0, BLOCCO).then((r) => {
      if (!vivo) return
      setEl(r.el)
      setTotale(r.totale)
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave])
  const altri = () => {
    if (occupato || totale === null || el.length >= totale) return
    setOccupato(true)
    carica(el.length, BLOCCO).then((r) => {
      setEl((x) => [...x, ...r.el])
      setOccupato(false)
    })
  }
  return { el, totale, altri }
}

export function GrigliaLocandine({ el, prefisso, altri, onRiga, continua }: { el: BaseItemDto[]; prefisso: string; altri?: () => void; onRiga?: (r: number) => void; continua?: boolean }) {
  const nav = useNav()
  return (
    <div
      data-griglia={continua ? 'continua' : ''}
      style={{ display: 'grid', gridTemplateColumns: `repeat(${COLONNE}, 1fr)`, columnGap: 'var(--rail-gap)', rowGap: 32, padding: '0 96px 400px' }}
      onFocus={(e) => {
        const i = Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i ?? 0)
        onRiga?.(Math.floor(i / COLONNE) + 1)
        if (i >= el.length - COLONNE * 2) altri?.()
      }}
    >
      {el.map((t, i) => (
        <div key={t.Id} data-i={i} data-y={i < COLONNE ? 'cima' : undefined}>
          <Card fid={prefisso + t.Id} formato="locandina" larghezza="100%" img={locandina(t)} titolo={t.Name ?? ''} onOk={() => nav.vai({ s: t.Type === 'BoxSet' ? 'collezione' : 'titolo', id: t.Id! })} />
        </div>
      ))}
    </div>
  )
}

export function Griglia({ sezione }: { sezione: 'film' | 'serie' | 'lista' }) {
  const nav = useNav()
  const { uid } = useStato()
  const [ordine, setOrdine] = useState('recenti')
  const [gen, setGen] = useState('tutti')
  const [tipo, setTipo] = useState('tutto')
  const [riga, setRiga] = useState(0)

  const tipi: BaseItemKind[] =
    sezione === 'film' ? ['Movie'] : sezione === 'serie' ? ['Series'] : tipo === 'film' ? ['Movie'] : tipo === 'serie' ? ['Series'] : ['Movie', 'Series']
  const generi = useCarica(`generi:${uid}:${sezione}`, async () =>
    ((await getGenreApi(api).getGenres({ userId: uid, includeItemTypes: sezione === 'lista' ? ['Movie', 'Series'] : tipi, sortBy: ['SortName'] })).data.Items ?? []).map((g) => g.Name!).filter(Boolean),
  )
  const g = useGriglia(`griglia:${sezione}:${uid}:${ordine}:${gen}:${tipo}`, async (start, quanti) => {
    const r = await getLibraryApi(api).getItems({
      userId: uid,
      includeItemTypes: tipi,
      recursive: true,
      isFavorite: sezione === 'lista' ? true : undefined,
      genres: gen === 'tutti' ? undefined : [gen],
      ...ORDINE[ordine],
      startIndex: start,
      limit: quanti,
      fields: [...CAMPI],
      enableTotalRecordCount: true,
    })
    return { el: r.data.Items ?? [], totale: r.data.TotalRecordCount ?? 0 }
  })

  const nome = sezione === 'film' ? 'Film' : sezione === 'serie' ? 'Serie' : 'La mia lista'
  const conta = g.totale === null ? '' : `${g.totale} ${g.totale === 1 ? 'titolo' : 'titoli'}`
  const listaVuota = sezione === 'lista' && g.totale === 0 && gen === 'tutti' && tipo === 'tutto'
  const pronto = g.totale !== null

  useFuocoIniziale(!pronto ? null : listaVuota ? 'vai-film' : g.el[0] ? 'g-' + g.el[0].Id : 'togli', [pronto])

  return (
    <div className="schermata" data-livello>
      {!pronto && <CaricamentoPagina />}
      <Menu attiva={sezione} nascosto={riga > 1} />
      {listaVuota ? (
        <div className="vuoto">
          <h1 className="t-titolo-pagina" style={{ margin: 0 }}>La tua lista è vuota</h1>
          <p className="t-sinossi c-2">Dalla scheda di un film o di una serie premi «+»: lo ritrovi qui.</p>
          <Pulsante fid="vai-film" tipo="principale" onOk={() => nav.vai({ s: 'film' })}>
            Vai a Film
          </Pulsante>
        </div>
      ) : (
        <div className="scorre" data-yscroll="0" style={{ paddingTop: 0 }}>
          <header data-y="cima" style={{ padding: '172px 0 40px', position: 'relative', zIndex: 5 }} onFocus={() => setRiga(0)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 96px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
                <h1 className="t-titolo-pagina" style={{ margin: 0 }}>{nome}</h1>
                <span className="t-meta c-2">{conta}</span>
              </div>
              {/* niente filtro per anno: Film e Serie hanno solo l'ordine */}
              <OrdinaFiltra
                fid="f-ordina"
                testo={sezione === 'lista' ? 'Ordina e filtra' : 'Ordina'}
                gruppi={[
                  { nome: 'Ordina', scelte: ORDINI, valore: ordine, base: 'recenti', onScegli: setOrdine },
                  ...(sezione === 'lista'
                    ? [{ nome: 'Tipo', scelte: [{ id: 'tutto', testo: 'Film e serie' }, { id: 'film', testo: 'Solo film' }, { id: 'serie', testo: 'Solo serie' }], valore: tipo, base: 'tutto', onScegli: setTipo }]
                    : []),
                ]}
              />
            </div>
            {!!generi.dati?.length && (
              <div style={{ marginTop: 32 }}>
                <FilaGeneri generi={generi.dati} valore={gen} onScegli={setGen} />
              </div>
            )}
          </header>
          {pronto && g.el.length === 0 ? (
            <div style={{ padding: '120px 96px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24 }}>
              <p className="t-sinossi c-2" style={{ margin: 0 }}>Nessun titolo con questi filtri.</p>
              <Pulsante fid="togli" onOk={() => (setGen('tutti'), setTipo('tutto'))}>
                Togli i filtri
              </Pulsante>
            </div>
          ) : (
            // solo Film: → a fine riga continua nella riga sotto (2026-10-16)
            <GrigliaLocandine el={g.el} prefisso="g-" altri={g.altri} onRiga={setRiga} continua={sezione === 'film'} />
          )}
        </div>
      )}
    </div>
  )
}
