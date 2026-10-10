/* Pagina di un genere o di un mood: griglia di locandine, film e serie insieme (schema B, senza menu). */
import { Card } from '../componenti'
import { titoli } from '../dati'
import { useFuocoIniziale, useNav, type Voce } from '../nav'
import { useStato } from '../stato'
import { ordina } from './Griglia'

export function Raccolta({ voce }: { voce: Extract<Voce, { s: 'raccolta' }> }) {
  const nav = useNav()
  const { puo } = useStato()
  // un genere o mood (per generi), oppure un elenco preciso ("Vedi tutti" dei risultati di Cerca)
  const el = voce.ids
    ? voce.ids.map((id) => titoli.find((t) => t.id === id)!).filter(puo)
    : ordina(titoli.filter(puo).filter((t) => t.generi.some((x) => voce.generi.includes(x))), 'recenti')
  useFuocoIniziale(el[0] && 'ra-' + el[0].id)
  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="0">
        <header data-y="cima" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '120px 96px 48px' }}>
          <div className="t-occhiello c-2">{voce.occhiello}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <h1 className="t-titolo-pagina" style={{ margin: 0 }}>{voce.nome}</h1>
            <span className="t-meta c-2">{el.length} {el.length === 1 ? 'titolo' : 'titoli'}</span>
          </div>
        </header>
        <div data-griglia style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', columnGap: 'var(--rail-gap)', rowGap: 40, padding: '0 96px 400px' }}>
          {el.map((t, i) => (
            <div key={t.id} data-y={i < 7 ? 'cima' : undefined}>
              <Card fid={'ra-' + t.id} formato="locandina" larghezza="100%" img={t.poster ?? t.sfondo} titolo={t.titolo} onOk={() => nav.vai({ s: 'titolo', id: t.id })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
