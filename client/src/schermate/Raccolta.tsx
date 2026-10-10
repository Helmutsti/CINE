/* Pagina di un genere, di un mood o di tutti i risultati di una ricerca: griglia di locandine (schema B, senza menu). */
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { api } from '../jf'
import { useFuocoIniziale, type Voce } from '../nav'
import { useStato } from '../stato'
import { CAMPI } from './comune'
import { GrigliaLocandine, ORDINE, useGriglia } from './Griglia'

export function Raccolta({ voce }: { voce: Extract<Voce, { s: 'raccolta' }> }) {
  const { uid } = useStato()
  const g = useGriglia(`raccolta:${uid}:${voce.nome}:${voce.generi?.join('|')}:${voce.ids?.length}`, async (start, quanti) => {
    const r = await getLibraryApi(api).getItems({
      userId: uid,
      includeItemTypes: ['Movie', 'Series'],
      recursive: true,
      ...(voce.ids ? { ids: voce.ids.slice(start, start + quanti) } : { genres: voce.generi, startIndex: start, limit: quanti, ...ORDINE.recenti }),
      fields: [...CAMPI],
      enableTotalRecordCount: true,
    })
    const el = r.data.Items ?? []
    // con gli id si tiene l'ordine dei risultati
    if (voce.ids) el.sort((a, b) => voce.ids!.indexOf(a.Id!) - voce.ids!.indexOf(b.Id!))
    return { el, totale: voce.ids ? voce.ids.length : r.data.TotalRecordCount ?? 0 }
  })
  useFuocoIniziale(g.el[0] ? 'ra-' + g.el[0].Id : null, [g.el.length > 0])
  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="0">
        <header data-y="cima" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '120px 96px 48px' }}>
          <div className="t-occhiello c-2">{voce.occhiello}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <h1 className="t-titolo-pagina" style={{ margin: 0 }}>{voce.nome}</h1>
            {g.totale !== null && (
              <span className="t-meta c-2">
                {g.totale} {g.totale === 1 ? 'titolo' : 'titoli'}
              </span>
            )}
          </div>
        </header>
        <GrigliaLocandine el={g.el} prefisso="ra-" altri={g.altri} />
      </div>
    </div>
  )
}
