/* SC-04 Film · SC-05 Serie · SC-08 La mia lista (schema B · Griglia) */
import { useState } from 'react'
import { Card, FilaGeneri, Menu, OrdinaFiltra, Pulsante } from '../componenti'
import { film, serie, titolo as cercaTitolo, type Titolo } from '../dati'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'

const COLONNE = 7

const ORDINI = [
  { id: 'recenti', testo: 'Aggiunti di recente' },
  { id: 'titolo', testo: 'Titolo' },
  { id: 'anno', testo: 'Anno' },
]
export function ordina(el: Titolo[], ordine: string, lista?: string[]) {
  const c = [...el]
  if (ordine === 'titolo') c.sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'))
  else if (ordine === 'anno') c.sort((a, b) => (b.anno ?? 0) - (a.anno ?? 0))
  else if (lista) c.sort((a, b) => lista.indexOf(a.id) - lista.indexOf(b.id))
  else c.sort((a, b) => b.aggiunto - a.aggiunto)
  return c
}

export function Griglia({ sezione }: { sezione: 'film' | 'serie' | 'lista' }) {
  const nav = useNav()
  const { dati, puo } = useStato()
  const [ordine, setOrdine] = useState('recenti')
  const [gen, setGen] = useState('tutti')
  const [tipo, setTipo] = useState('tutto')
  const [riga, setRiga] = useState(0)

  const base: Titolo[] =
    sezione === 'film' ? film : sezione === 'serie' ? serie : dati.lista.map((id) => cercaTitolo(id)!).filter(Boolean)
  const visibili = base.filter(puo)
  const generi = [...new Set(visibili.flatMap((t) => t.generi))].sort((a, b) => a.localeCompare(b, 'it'))
  const el = ordina(
    visibili.filter(
      (t) =>
        (gen === 'tutti' || t.generi.includes(gen)) &&
        (tipo === 'tutto' || t.tipo === tipo),
    ),
    ordine,
    sezione === 'lista' ? dati.lista : undefined,
  )
  const nome = sezione === 'film' ? 'Film' : sezione === 'serie' ? 'Serie' : 'La mia lista'
  const conta = `${el.length} ${el.length === 1 ? 'titolo' : 'titoli'}`
  const listaVuota = sezione === 'lista' && visibili.length === 0

  useFuocoIniziale(listaVuota ? 'vai-film' : el[0] ? 'g-' + el[0].id : 'togli', [ordine, tipo])

  return (
    <div className="schermata" data-livello>
      <Menu attiva={sezione} nascosto={riga > 1} />
      {listaVuota ? (
        <div className="vuoto">
          <h1 className="t-titolo-pagina" style={{ margin: 0 }}>La tua lista è vuota</h1>
          <p className="t-sinossi c-2">Dalla scheda di un film o di una serie scegli «La mia lista»: lo ritrovi qui.</p>
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
              {/* niente filtro per anno (2026-10-10): Film e Serie hanno solo l'ordine */}
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
            <div style={{ marginTop: 32 }}>
              <FilaGeneri generi={generi} valore={gen} onScegli={setGen} />
            </div>
          </header>
          {el.length === 0 ? (
            <div style={{ padding: '120px 96px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24 }}>
              <p className="t-sinossi c-2" style={{ margin: 0 }}>Nessun titolo con questi filtri.</p>
              <Pulsante fid="togli" onOk={() => (setGen('tutti'), setTipo('tutto'))}>
                Togli i filtri
              </Pulsante>
            </div>
          ) : (
            <div
              data-griglia style={{ display: 'grid', gridTemplateColumns: `repeat(${COLONNE}, 1fr)`, columnGap: 'var(--rail-gap)', rowGap: 32, padding: '0 96px 400px' }}
              onFocus={(e) => {
                const i = Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i ?? 0)
                setRiga(Math.floor(i / COLONNE) + 1)
              }}
            >
              {el.map((t, i) => (
                <div key={t.id} data-i={i} data-y={i < COLONNE ? 'cima' : undefined}>
                  <Card fid={'g-' + t.id} formato="locandina" larghezza="100%" img={t.poster ?? t.sfondo} titolo={t.titolo} onOk={() => nav.vai({ s: 'titolo', id: t.id })} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
