/*
 * SC-09 Cerca (schema D): tastiera a sinistra, risultati a destra, dal server mentre si scrive.
 * Niente filtri: i risultati sono raggruppati in Film, Serie (griglie) e Attori (riga che scorre).
 */
import { useEffect, useState, type ReactNode } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getPersonApi } from '@jellyfin/sdk/lib/utils/api/person-api'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Campo, Card, Menu, PersonaCast } from '../componenti'
import { api, fotoPersona, orizzontale, useCarica } from '../jf'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI } from './comune'
import { Tastiera } from './Tastiera'

const MAX = 6

function Gruppo({ titolo, conta, primo, tutti, children }: { titolo: string; conta: number; primo: boolean; tutti?: () => void; children: ReactNode }) {
  return (
    <section data-y="inizio" style={{ marginTop: primo ? 0 : 56, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="t-titolo-riga" style={{ margin: 0 }}>
        {titolo} <span className="t-meta c-2">{conta}</span>
      </h2>
      {children}
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
  const { uid } = useStato()
  const [q, setQ] = useState('')
  const [cercato, setCercato] = useState('')
  useFuocoIniziale('tasto-a')

  // si cerca dopo una breve pausa nella scrittura
  useEffect(() => {
    const t = setTimeout(() => setCercato(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const titoli = useCarica(cercato ? `cerca:${uid}:${cercato}` : null, async () => {
    const r = await getLibraryApi(api).getItems({ userId: uid, searchTerm: cercato, includeItemTypes: ['Movie', 'Series'], recursive: true, limit: 200, fields: [...CAMPI] })
    return r.data.Items ?? []
  })
  const persone = useCarica(cercato ? `cerca-persone:${uid}:${cercato}` : null, async () => {
    const r = await getPersonApi(api).getPersons({ userId: uid, searchTerm: cercato, limit: 20 })
    return r.data.Items ?? []
  })

  const film = (titoli.dati ?? []).filter((t) => t.Type === 'Movie')
  const serie = (titoli.dati ?? []).filter((t) => t.Type === 'Series')
  const attori = persone.dati ?? []
  const totale = film.length + serie.length + attori.length
  const pronto = !cercato || (titoli.pronto && persone.pronto)

  const griglia = (el: BaseItemDto[]) => (
    <div data-griglia style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 'var(--rail-gap)', rowGap: 32 }}>
      {el.slice(0, MAX).map((t) => (
        <Card key={t.Id} fid={'cr-' + t.Id} formato="orizzontale" larghezza="100%" sempre piccolo img={orizzontale(t)} titolo={t.Name ?? ''} onOk={() => nav.vai({ s: 'titolo', id: t.Id! })} />
      ))}
    </div>
  )
  const vediTutti = (el: BaseItemDto[], gruppo: string) =>
    el.length > MAX ? () => nav.vai({ s: 'raccolta', nome: `${gruppo} con «${cercato}»`, occhiello: 'Risultati', ids: el.map((t) => t.Id!) }) : undefined

  return (
    <div className="schermata" data-livello>
      <Menu attiva="cerca" />
      <div data-colonna="tastiera" style={{ position: 'absolute', left: 96, top: 172, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Campo testo={q} suggerimento="Titolo o attore" larghezza={608} />
        <Tastiera testo={q} onCambia={setQ} />
      </div>
      {/* margine di 32 attorno ai risultati: la card a fuoco si ingrandisce e non deve essere tagliata */}
      <div data-colonna="risultati" className="scorre" data-yscroll="0" style={{ left: 744, top: 140, padding: '32px 96px 300px 32px' }}>
        {!cercato ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>Scrivi per cercare fra film, serie e attori.</p>
        ) : !pronto ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>Cerco…</p>
        ) : totale === 0 ? (
          <p className="t-sinossi c-2" style={{ margin: '12px 0' }}>Nessun risultato per «{cercato}».</p>
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
              <Gruppo titolo="Attori" conta={attori.length} primo={!film.length && !serie.length}>
                <div className="riga__binario" data-g="cerca-attori" data-xscroll="24" style={{ padding: '24px 24px', margin: '-24px -24px' }}>
                  {attori.map((p) => (
                    <PersonaCast key={p.Id} fid={'cp-' + p.Id} nome={p.Name ?? ''} foto={fotoPersona(p.Id, p.ImageTags?.Primary)} onOk={() => nav.vai({ s: 'attore', id: p.Id! })} />
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
