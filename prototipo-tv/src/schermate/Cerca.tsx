/*
 * SC-09 Cerca (schema D): tastiera a sinistra, risultati a destra.
 * Niente filtri (2026-10-10): i risultati sono raggruppati in Film, Serie (griglie) e Attori (riga che scorre).
 */
import { useState, type ReactNode } from 'react'
import { Campo, Card, Menu, PersonaCast } from '../componenti'
import { persone, titoli, titolo as cercaTitolo, type Titolo } from '../dati'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { Tastiera } from './Tastiera'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function Gruppo({ titolo, conta, primo, tutti, children }: { titolo: string; conta: number; primo: boolean; tutti?: () => void; children: ReactNode }) {
  return (
    <section data-y="inizio" style={{ marginTop: primo ? 0 : 56, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="t-titolo-riga" style={{ margin: 0 }}>
        {titolo} <span className="t-meta c-2">{conta}</span>
      </h2>
      {children}
      {/* link semplice e discreto sotto la griglia (2026-10-10) */}
      {tutti && (
        <button data-f={'tutti-' + titolo} className="link t-meta" onClick={tutti}>
          Vedi tutti i {conta} {titolo.toLowerCase()} ›
        </button>
      )}
    </section>
  )
}

export function Cerca() {
  const nav = useNav()
  const { puo } = useStato()
  const [q, setQ] = useState('')
  useFuocoIniziale('tasto-a')

  const nq = norm(q.trim())
  const trovati = nq ? titoli.filter(puo).filter((t) => norm(t.titolo).includes(nq)) : []
  const film = trovati.filter((t) => t.tipo === 'film')
  const serie = trovati.filter((t) => t.tipo === 'serie')
  const attori = nq
    ? [...persone.values()].filter((p) => norm(p.nome).includes(nq) && p.titoli.some((id) => puo(cercaTitolo(id)))).slice(0, 20)
    : []
  const totale = trovati.length + attori.length

  // al massimo due righe per gruppo; gli altri con "Vedi tutti" accanto al titolo del gruppo
  const MAX = 6
  const griglia = (el: Titolo[]) => (
    <div data-griglia style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 'var(--rail-gap)', rowGap: 32 }}>
      {el.slice(0, MAX).map((t) => (
        <Card key={t.id} fid={'cr-' + t.id} formato="orizzontale" larghezza="100%" sempre piccolo img={t.sfondo ?? t.poster} titolo={t.titolo} onOk={() => nav.vai({ s: 'titolo', id: t.id })} />
      ))}
    </div>
  )
  const vediTutti = (el: Titolo[], gruppo: string) =>
    el.length > MAX
      ? () => nav.vai({ s: 'raccolta', nome: `${gruppo} con «${q.trim()}»`, occhiello: 'Risultati', generi: [], ids: el.map((t) => t.id) })
      : undefined

  return (
    <div className="schermata" data-livello>
      <Menu attiva="cerca" />
      <div style={{ position: 'absolute', left: 96, top: 172, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Campo testo={q} suggerimento="Titolo o attore" larghezza={608} />
        <Tastiera testo={q} onCambia={setQ} />
      </div>
      {/* margine di 32 attorno ai risultati: la card a fuoco si ingrandisce e non deve essere tagliata */}
      <div className="scorre" data-yscroll="0" style={{ left: 744, top: 140, padding: '32px 96px 300px 32px' }}>
        {!nq ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>Scrivi per cercare fra film, serie e attori.</p>
        ) : totale === 0 ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>Nessun risultato per «{q.trim()}».</p>
        ) : (
          <>
            {film.length > 0 && (
              <Gruppo titolo="Film" conta={film.length} primo tutti={vediTutti(film, 'Film')}>
                {griglia(film)}
              </Gruppo>
            )}
            {serie.length > 0 && (
              <Gruppo titolo="Serie" conta={serie.length} primo={!film.length} tutti={vediTutti(serie, 'Serie')}>
                {griglia(serie)}
              </Gruppo>
            )}
            {attori.length > 0 && (
              <Gruppo titolo="Attori" conta={attori.length} primo={!trovati.length}>
                <div className="riga__binario" data-g="cerca-attori" data-xscroll="24" style={{ padding: '24px 24px', margin: '-24px -24px' }}>
                  {attori.map((p) => (
                    <PersonaCast key={p.id} fid={'cp-' + p.id} nome={p.nome} foto={p.foto} onOk={() => nav.vai({ s: 'attore', id: p.id })} />
                  ))}
                </div>
              </Gruppo>
            )}
          </>
        )}
      </div>
    </div>
  )
}
