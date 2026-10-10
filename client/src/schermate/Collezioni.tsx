/* SC-06 Collezioni (schema B) · SC-07 Pagina collezione (schema C), con i dati del server. */
import { useState } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api'
import { Card, Menu, OrdinaFiltra, Pulsante, Riga, Sfondo } from '../componenti'
import { api, orizzontale, secondi, sfondo, useCarica } from '../jf'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI } from './comune'
import { useRipresa } from './Ripresa'

export function Collezioni() {
  const nav = useNav()
  const { uid } = useStato()
  const [ordine, setOrdine] = useState('nome')
  const [riga, setRiga] = useState(0)
  const c = useCarica(`collezioni:${uid}:${ordine}`, async () =>
    (
      await getLibraryApi(api).getItems({
        userId: uid,
        includeItemTypes: ['BoxSet'],
        recursive: true,
        sortBy: ordine === 'nome' ? ['SortName'] : ['DateCreated'],
        sortOrder: ordine === 'nome' ? ['Ascending'] : ['Descending'],
        fields: ['ChildCount'],
      })
    ).data.Items ?? [],
  )
  const el = c.dati ?? []
  useFuocoIniziale(!c.pronto ? null : el[0] ? 'c-' + el[0].Id : 'f-ordine', [c.pronto])

  return (
    <div className="schermata" data-livello>
      <Menu attiva="collezioni" nascosto={riga > 1} />
      <div className="scorre" data-yscroll="0">
        <header
          data-y="cima"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '172px 96px 40px', position: 'relative', zIndex: 5 }}
          onFocus={() => setRiga(0)}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <h1 className="t-titolo-pagina" style={{ margin: 0 }}>Collezioni</h1>
            {c.pronto && <span className="t-meta c-2">{el.length} collezioni</span>}
          </div>
          <OrdinaFiltra
            fid="f-ordine"
            testo="Ordina"
            gruppi={[
              {
                nome: 'Ordina',
                scelte: [
                  { id: 'nome', testo: 'Nome' },
                  { id: 'recenti', testo: 'Aggiunte di recente' },
                ],
                valore: ordine,
                base: 'nome',
                onScegli: setOrdine,
              },
            ]}
          />
        </header>
        {c.pronto && el.length === 0 ? (
          <p className="t-sinossi c-2" style={{ padding: '0 96px', margin: 0 }}>
            Sul server non ci sono collezioni.
          </p>
        ) : (
          <div
            data-griglia
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 'var(--rail-gap)', rowGap: 40, padding: '0 96px 400px' }}
            onFocus={(e) => setRiga(Math.floor(Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i ?? 0) / 4) + 1)}
          >
            {el.map((x, i) => (
              <div key={x.Id} data-i={i} data-y={i < 4 ? 'cima' : undefined}>
                <Card
                  fid={'c-' + x.Id}
                  formato="collezione"
                  larghezza="100%"
                  img={orizzontale(x)}
                  titolo={x.Name ?? ''}
                  meta={x.ChildCount ? `${x.ChildCount} film` : undefined}
                  onOk={() => nav.vai({ s: 'collezione', id: x.Id! })}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function PaginaCollezione({ id }: { id: string }) {
  const nav = useNav()
  const { uid } = useStato()
  const ripresa = useRipresa()
  const lib = getLibraryApi(api)
  const c = useCarica(`collezione:${uid}:${id}`, async () => (await lib.getItem({ itemId: id, userId: uid })).data)
  const film = useCarica(
    `collezione-film:${uid}:${id}`,
    async () => (await lib.getItems({ userId: uid, parentId: id, sortBy: ['PremiereDate', 'ProductionYear', 'SortName'], fields: [...CAMPI] })).data.Items ?? [],
  )
  const [preferita, setPreferita] = useState<boolean | null>(null)
  const el = film.dati ?? []
  const anni = el.map((f) => f.ProductionYear ?? 0).filter(Boolean)
  const primoNonVisto = el.find((f) => !f.UserData?.Played) ?? el[0]
  const inLista = preferita ?? !!c.dati?.UserData?.IsFavorite
  useFuocoIniziale(film.pronto ? 'col-guarda' : null, [film.pronto])

  const meta = [
    `${el.length} film`,
    anni.length ? (Math.min(...anni) === Math.max(...anni) ? `${anni[0]}` : `${Math.min(...anni)} – ${Math.max(...anni)}`) : null,
  ].filter(Boolean)

  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="96">
        <section data-y="cima" style={{ position: 'relative', height: 700 }}>
          <div style={{ position: 'absolute', inset: '0 0 auto', height: 1080 }}>
            <Sfondo img={(c.dati && sfondo(c.dati)) || (el[0] && sfondo(el[0])) || null} />
          </div>
          <div style={{ position: 'absolute', left: 96, bottom: 48, width: 1100, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="t-occhiello c-2">Collezione</div>
            <h1 className="t-titolo-scheda" style={{ margin: 0 }}>{c.dati?.Name}</h1>
            <div className="t-meta c-2">{meta.join(' · ')}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
              <Pulsante
                fid="col-guarda"
                tipo="principale"
                icona="play"
                onOk={() => {
                  if (!primoNonVisto) return
                  const pos = secondi(primoNonVisto.UserData?.PlaybackPositionTicks)
                  ripresa.avvia({ s: 'player', id: primoNonVisto.Id! }, pos > 0, { pos, durata: secondi(primoNonVisto.RunTimeTicks), cosa: primoNonVisto.Name ?? '' }, 'col-guarda')
                }}
              >
                Guarda dal primo
              </Pulsante>
              <Pulsante
                fid="col-lista"
                tipo="icona"
                icona={inLista ? 'spunta' : 'piu'}
                etichetta={inLista ? 'Nella mia lista' : 'Aggiungi alla mia lista'}
                onOk={async () => {
                  setPreferita(!inLista)
                  const ud = getUserDataApi(api)
                  if (inLista) await ud.unmarkFavoriteItem({ itemId: id, userId: uid })
                  else await ud.markFavoriteItem({ itemId: id, userId: uid })
                }}
              />
            </div>
          </div>
        </section>
        <div style={{ position: 'relative', paddingTop: 40, paddingBottom: 400 }}>
          <Riga g="col-film" titolo="I film, in ordine">
            {el.map((f, i) => (
              <Card key={f.Id} fid={'cf-' + f.Id} formato="orizzontale" numero={i + 1} img={orizzontale(f)} titolo={f.Name ?? ''} meta={f.ProductionYear ?? undefined} onOk={() => nav.vai({ s: 'titolo', id: f.Id! })} />
            ))}
          </Riga>
        </div>
      </div>
      {ripresa.finestra}
    </div>
  )
}
