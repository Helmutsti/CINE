/* SC-12 Pagina attore (schema C, senza menu in alto), con i dati del server. */
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { Card, Riga } from '../componenti'
import { api, fotoPersona, orizzontale, useCarica } from '../jf'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI, metaBreve } from './comune'

export function PaginaAttore({ id }: { id: string }) {
  const nav = useNav()
  const { uid } = useStato()
  const lib = getLibraryApi(api)
  const p = useCarica(`persona:${uid}:${id}`, async () => (await lib.getItem({ itemId: id, userId: uid })).data)
  const titoli = useCarica(`persona-titoli:${uid}:${id}`, async () =>
    (await lib.getItems({ userId: uid, personIds: [id], includeItemTypes: ['Movie', 'Series'], recursive: true, sortBy: ['ProductionYear', 'SortName'], sortOrder: ['Descending', 'Ascending'], fields: [...CAMPI] })).data.Items ?? [],
  )
  const el = titoli.dati ?? []
  const film = el.filter((t) => t.Type === 'Movie')
  const serie = el.filter((t) => t.Type === 'Series')
  useFuocoIniziale(titoli.pronto ? (el[0] ? 'a-' + el[0].Id : null) : null, [titoli.pronto])

  const nascita = p.dati?.PremiereDate ? new Date(p.dati.PremiereDate).getFullYear() : null
  const luogo = p.dati?.ProductionLocations?.[0]
  const meta = [
    titoli.pronto ? `${el.length} ${el.length === 1 ? 'titolo' : 'titoli'} nella tua libreria` : null,
    nascita ? `nascita: ${luogo ? luogo + ', ' : ''}${nascita}` : null,
  ].filter(Boolean)
  const foto = fotoPersona(id, p.dati?.ImageTags?.Primary)

  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="96">
        <header data-y="cima" style={{ display: 'flex', gap: 64, alignItems: 'center', padding: '140px 96px 72px' }}>
          <div style={{ width: 280, height: 280, borderRadius: 999, background: 'var(--surface-art)', overflow: 'hidden', flex: 'none' }}>
            {foto && <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
            <div className="t-occhiello c-2">Cast</div>
            <h1 className="t-titolo-pagina" style={{ margin: 0 }}>{p.dati?.Name}</h1>
            <div className="t-meta c-2">{meta.join(' · ')}</div>
            {p.dati?.Overview && (
              <p className="t-sinossi c-2" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.dati.Overview}
              </p>
            )}
          </div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56, paddingBottom: 400 }}>
          {film.length > 0 && (
            <Riga g="a-film" titolo="Film" y="cima">
              {film.map((t) => (
                <Card key={t.Id} fid={'a-' + t.Id} formato="orizzontale" img={orizzontale(t)} titolo={t.Name ?? ''} meta={metaBreve(t)} onOk={() => nav.vai({ s: 'titolo', id: t.Id! })} />
              ))}
            </Riga>
          )}
          {serie.length > 0 && (
            <Riga g="a-serie" titolo="Serie" y={film.length ? 'inizio' : 'cima'}>
              {serie.map((t) => (
                <Card key={t.Id} fid={'a-' + t.Id} formato="orizzontale" img={orizzontale(t)} titolo={t.Name ?? ''} meta={metaBreve(t)} onOk={() => nav.vai({ s: 'titolo', id: t.Id! })} />
              ))}
            </Riga>
          )}
        </div>
      </div>
    </div>
  )
}
