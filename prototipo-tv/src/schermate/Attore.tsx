/* SC-12 Pagina attore (schema C, senza menu in alto) */
import { Card, Riga } from '../componenti'
import { persone, titolo as cercaTitolo } from '../dati'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { metaBreve } from './comune'

export function PaginaAttore({ id }: { id: string }) {
  const nav = useNav()
  const { puo } = useStato()
  const p = persone.get(id)!
  const el = p.titoli.map((x) => cercaTitolo(x)).filter(puo)
  const film = el.filter((t) => t.tipo === 'film')
  const serie = el.filter((t) => t.tipo === 'serie')
  useFuocoIniziale(el[0] && 'a-' + el[0].id)

  const nata = p.sesso === 'F' ? 'nata' : 'nato'
  const meta = [
    `${el.length} ${el.length === 1 ? 'titolo' : 'titoli'} nella tua libreria`,
    p.nascita ? `${nata}${p.luogo ? ` in ${p.luogo}` : ''} nel ${p.nascita}` : null,
  ].filter(Boolean)

  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="96">
        <header data-y="cima" style={{ display: 'flex', gap: 64, alignItems: 'center', padding: '140px 96px 72px' }}>
          <div style={{ width: 280, height: 280, borderRadius: 999, background: 'var(--surface-art)', overflow: 'hidden', flex: 'none' }}>
            {p.foto && <img src={p.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
            <div className="t-occhiello c-2">{p.sesso === 'F' ? 'Attrice' : 'Attore'}</div>
            <h1 className="t-titolo-pagina" style={{ margin: 0 }}>{p.nome}</h1>
            <div className="t-meta c-2">{meta.join(' · ')}</div>
            {p.bio && <p className="t-sinossi c-2" style={{ margin: 0 }}>{p.bio}</p>}
          </div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56, paddingBottom: 400 }}>
          {film.length > 0 && (
            <Riga g="a-film" titolo="Film" y="cima">
              {film.map((t) => (
                <Card key={t.id} fid={'a-' + t.id} formato="orizzontale" img={t.sfondo ?? t.poster} titolo={t.titolo} meta={metaBreve(t)} onOk={() => nav.vai({ s: 'titolo', id: t.id })} />
              ))}
            </Riga>
          )}
          {serie.length > 0 && (
            <Riga g="a-serie" titolo="Serie" y={film.length ? 'inizio' : 'cima'}>
              {serie.map((t) => (
                <Card key={t.id} fid={'a-' + t.id} formato="orizzontale" img={t.sfondo ?? t.poster} titolo={t.titolo} meta={metaBreve(t)} onOk={() => nav.vai({ s: 'titolo', id: t.id })} />
              ))}
            </Riga>
          )}
        </div>
      </div>
    </div>
  )
}
