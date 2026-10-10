/* SC-06 Collezioni (schema B) · SC-07 Pagina collezione (schema C) */
import { useState } from 'react'
import { Card, Filtro, Menu, Pulsante, Riga, Sfondo } from '../componenti'
import { collezione, collezioni, titolo as cercaTitolo, type Film } from '../dati'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'

export function Collezioni() {
  const nav = useNav()
  const { puo } = useStato()
  const [ordine, setOrdine] = useState('nome')
  const [riga, setRiga] = useState(0)
  const el = collezioni
    .map((c) => ({ ...c, film: c.film.filter((id) => puo(cercaTitolo(id))) }))
    .filter((c) => c.film.length)
  if (ordine === 'nome') el.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
  else if (ordine === 'numero') el.sort((a, b) => b.film.length - a.film.length)
  useFuocoIniziale(el[0] && 'c-' + el[0].id, [ordine])

  return (
    <div className="schermata" data-livello>
      <Menu attiva="collezioni" nascosto={riga > 1} />
      <div className="scorre" data-yscroll="0">
        <header data-y="cima" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '172px 96px 40px', position: 'relative', zIndex: 5 }} onFocus={() => setRiga(0)}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <h1 className="t-titolo-pagina" style={{ margin: 0 }}>Collezioni</h1>
            <span className="t-meta c-3">{el.length} collezioni</span>
          </div>
          <Filtro
            fid="f-ordine"
            nome="Ordina"
            valore={ordine}
            allineaDestra
            scelte={[
              { id: 'nome', testo: 'Nome' },
              { id: 'numero', testo: 'Numero di film' },
              { id: 'recenti', testo: 'Aggiunte di recente' },
            ]}
            onScegli={setOrdine}
          />
        </header>
        <div
          data-griglia style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 'var(--rail-gap)', rowGap: 40, padding: '0 96px 400px' }}
          onFocus={(e) => setRiga(Math.floor(Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i ?? 0) / 4) + 1)}
        >
          {el.map((c, i) => {
            const primo = cercaTitolo(c.film[0])
            return (
              <div key={c.id} data-i={i} data-y={i < 4 ? 'cima' : undefined}>
                <Card fid={'c-' + c.id} formato="collezione" larghezza="100%" img={primo?.sfondo ?? primo?.poster ?? null} titolo={c.nome} meta={`${c.film.length} film`} onOk={() => nav.vai({ s: 'collezione', id: c.id })} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function PaginaCollezione({ id }: { id: string }) {
  const nav = useNav()
  const { dati, puo, azioni } = useStato()
  const c = collezione(id)!
  const el = c.film.map((x) => cercaTitolo(x) as Film).filter(puo)
  const anni = el.map((f) => f.anno ?? 0).filter(Boolean)
  const registi = [...new Set(el.flatMap((f) => f.regia))]
  const primoNonVisto = el.find((f) => !dati.visti.includes(f.id)) ?? el[0]
  const inLista = el.every((f) => dati.lista.includes(f.id))
  useFuocoIniziale('col-guarda')

  const meta = [
    `${el.length} film`,
    anni.length ? (Math.min(...anni) === Math.max(...anni) ? `${anni[0]}` : `${Math.min(...anni)} – ${Math.max(...anni)}`) : null,
    registi.length === 1 ? `Regia di ${registi[0]}` : null,
  ].filter(Boolean)

  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="96">
        <section data-y="cima" style={{ position: 'relative', height: 700 }}>
          <div style={{ position: 'absolute', inset: '0 0 auto', height: 1080 }}>
            <Sfondo img={el[0]?.sfondo ?? null} />
          </div>
          <div style={{ position: 'absolute', left: 96, bottom: 48, width: 1000, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="t-occhiello c-2">Collezione</div>
            <h1 className="t-titolo-scheda" style={{ margin: 0 }}>{c.nome}</h1>
            <div className="t-meta c-2">{meta.join(' · ')}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
              <Pulsante fid="col-guarda" tipo="principale" icona="play" onOk={() => primoNonVisto && nav.vai({ s: 'player', id: primoNonVisto.id })}>
                Guarda dal primo
              </Pulsante>
              <Pulsante fid="col-lista" tipo="icona" icona={inLista ? 'spunta' : 'piu'} etichetta={inLista ? 'Nella mia lista' : 'Aggiungi alla mia lista'} onOk={() => el.forEach((f) => (dati.lista.includes(f.id) === inLista ? azioni.cambiaLista(f.id) : null))} />
            </div>
          </div>
        </section>
        <div style={{ position: 'relative', paddingTop: 40, paddingBottom: 400 }}>
          <Riga g="col-film" titolo="I film, in ordine">
            {el.map((f, i) => (
              <Card key={f.id} fid={'cf-' + f.id} formato="orizzontale" numero={i + 1} img={f.sfondo ?? f.poster} titolo={f.titolo} meta={f.anno ?? undefined} onOk={() => nav.vai({ s: 'titolo', id: f.id })} />
            ))}
          </Riga>
        </div>
      </div>
    </div>
  )
}
