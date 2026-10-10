/* SC-10 Scheda film · SC-11 Scheda serie (schema C) · SC-16 Aggiorna metadati */
import { useState } from 'react'
import { Card, Etichetta, Finestra, PersonaCast, Pulsante, Riga, Scelta, Sfondo, Tendina, VoceElenco, Campo } from '../componenti'
import { altri, durata, persone, sigla, titoli, titolo as cercaTitolo, type Serie } from '../dati'
import { mettiId } from '../fuoco'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { azionePrincipale, metaBreve } from './comune'
import { useRipresa } from './Ripresa'
import { Tastiera } from './Tastiera'

export function Scheda({ id }: { id: string }) {
  const nav = useNav()
  const s = useStato()
  const { dati, azioni, puo } = s
  const t = cercaTitolo(id)!
  const principale = azionePrincipale(t, s)
  const ripresa = useRipresa()
  const inLista = dati.lista.includes(t.id)
  const [altro, setAltro] = useState(false)
  const [metadati, setMetadati] = useState<null | 'scegli' | 'correggi' | 'in-corso'>(null)
  const av = dati.avanzamenti[t.id]
  const [stagione, setStagione] = useState(() => {
    if (t.tipo !== 'serie') return 0
    const n = av ? t.stagioni.findIndex((st) => st.episodi.some((e) => e.id === av.id)) : 0
    return Math.max(0, n)
  })
  useFuocoIniziale('s-principale')

  const meta = [metaBreve(t, true)]
  if (t.tipo === 'film' && t.regia[0]) meta.push(`Regia di ${t.regia[0]}`)
  const altriTitoli = altri(t).filter(puo)
  const cast = t.cast.map((p) => persone.get(p)!).filter(Boolean)

  const chiudiMetadati = () => {
    setMetadati(null)
    setTimeout(() => mettiId('s-altro'))
  }
  const aggiornato = s.st.aggiornatoIl[t.id]

  return (
    <div className="schermata" data-livello>
      <div className="scorre" data-yscroll="96">
        <section data-y="cima" style={{ position: 'relative', height: 820 }}>
          <div style={{ position: 'absolute', inset: '0 0 auto', height: 1080 }}>
            <Sfondo img={t.sfondo ?? t.poster} />
          </div>
          <div style={{ position: 'absolute', left: 96, bottom: 40, width: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="t-occhiello c-2">{t.tipo === 'film' ? 'Film' : 'Serie'}</div>
            <h1 className="t-titolo-scheda" style={{ margin: 0 }}>{t.titolo}</h1>
            <div className="t-meta c-2">{meta.join(' · ')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {t.tecnici.map((x) => (
                <Etichetta key={x}>{x}</Etichetta>
              ))}
            </div>
            <p className="t-sinossi c-2" style={{ margin: '8px 0 0', maxWidth: 900, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {t.trama}
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 40 }} data-g="azioni">
              <Pulsante fid="s-principale" tipo="principale" icona="play" pref onOk={() => ripresa.avvia(principale.voce, principale.iniziato, principale, 's-principale')}>
                {principale.testo}
              </Pulsante>
              <Pulsante fid="s-trailer" onOk={() => nav.vai({ s: 'player', id: t.id, trailer: true })}>
                Trailer
              </Pulsante>
              <Pulsante fid="s-lista" tipo="icona" icona={inLista ? 'spunta' : 'piu'} etichetta={inLista ? 'Nella mia lista' : 'Aggiungi alla mia lista'} onOk={() => azioni.cambiaLista(t.id)} />
              <div style={{ position: 'relative' }}>
                <Pulsante fid="s-altro" tipo="icona" icona="matita" etichetta="Modifica" onOk={() => setAltro(true)} />
                {altro && (
                  <Tendina
                    voci={[{ id: 'metadati', testo: 'Aggiorna metadati' }]}
                    stile={{ top: 76, left: 0 }}
                    onChiudi={() => {
                      setAltro(false)
                      setTimeout(() => mettiId('s-altro'))
                    }}
                    onScegli={() => {
                      setAltro(false)
                      setMetadati('scegli')
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 56, paddingTop: 64, paddingBottom: 400 }}>
          {t.tipo === 'serie' && <Episodi serie={t} stagione={stagione} setStagione={setStagione} avvia={ripresa.avvia} />}
          {cast.length > 0 && (
            <Riga g="cast" titolo="Cast">
              {cast.map((p) => (
                <PersonaCast key={p.id} fid={'cast-' + p.id} nome={p.nome} foto={p.foto} onOk={() => nav.vai({ s: 'attore', id: p.id })} />
              ))}
            </Riga>
          )}
          {altriTitoli.length > 0 && (
            <Riga g="altri" titolo={t.tipo === 'film' ? 'Altri film' : 'Altre serie'}>
              {altriTitoli.map((x) => (
                <Card key={x.id} fid={'altri-' + x.id} formato="orizzontale" img={x.sfondo ?? x.poster} titolo={x.titolo} meta={metaBreve(x)} onOk={() => nav.vai({ s: 'titolo', id: x.id })} />
              ))}
            </Riga>
          )}
        </div>
      </div>

      {ripresa.finestra}
      {metadati === 'scegli' && (
        <Finestra
          titolo="Aggiorna metadati"
          testo={
            <>
              {t.titolo} è riconosciuto come «{t.titolo}» ({t.anno}){t.tipo === 'film' && t.regia[0] ? `, regia di ${t.regia[0]}` : ''}.
              <br />
              Ultimo aggiornamento: {aggiornato ? 'adesso' : '3 giorni fa'}.
            </>
          }
          onChiudi={chiudiMetadati}
        >
          <AzioniMetadati
            onAggiorna={() => {
              setMetadati('in-corso')
              setTimeout(() => {
                azioni.segnaAggiornato(t.id)
                chiudiMetadati()
              }, 1200)
            }}
            onCorreggi={() => setMetadati('correggi')}
            onAnnulla={chiudiMetadati}
          />
        </Finestra>
      )}
      {metadati === 'in-corso' && (
        <Finestra titolo="Aggiorna metadati" testo="Rileggo trama, locandina e cast…" onChiudi={() => {}}>
          <div />
        </Finestra>
      )}
      {metadati === 'correggi' && (
        <Correggi
          id={t.id}
          onScegli={() => {
            azioni.segnaAggiornato(t.id)
            chiudiMetadati()
          }}
          onChiudi={chiudiMetadati}
        />
      )}
    </div>
  )
}

function AzioniMetadati(p: { onAggiorna: () => void; onCorreggi: () => void; onAnnulla: () => void }) {
  useFuocoIniziale('m-aggiorna')
  return (
    <div className="finestra__azioni">
      <Pulsante fid="m-aggiorna" tipo="principale" onOk={p.onAggiorna}>
        Aggiorna
      </Pulsante>
      <Pulsante fid="m-correggi" onOk={p.onCorreggi}>
        Correggi titolo
      </Pulsante>
      <Pulsante fid="m-annulla" onOk={p.onAnnulla}>
        Annulla
      </Pulsante>
    </div>
  )
}

/** SC-16 · Correggi titolo: a sinistra il nome da cercare, a destra i titoli trovati. */
function Correggi({ id, onScegli, onChiudi }: { id: string; onScegli: () => void; onChiudi: () => void }) {
  const t = cercaTitolo(id)!
  const [q, setQ] = useState(t.titolo.toLowerCase())
  const n = q.trim().toLowerCase()
  const trovati = titoli.filter((x) => x.tipo === t.tipo && n && x.titolo.toLowerCase().includes(n.split(' ')[0] ?? ''))
  if (!trovati.includes(t) && n && t.titolo.toLowerCase().includes(n)) trovati.unshift(t)
  // qualche omonimo finto, per vedere un elenco vero
  const omonimi = n
    ? [
        { id: 'o1', titolo: `${q.trim()[0]?.toUpperCase()}${q.trim().slice(1)}`, anno: (t.anno ?? 2000) + 31, poster: null as string | null },
        { id: 'o2', titolo: `${q.trim()[0]?.toUpperCase()}${q.trim().slice(1)} (documentario)`, anno: (t.anno ?? 2000) + 54, poster: null as string | null },
      ]
    : []
  useFuocoIniziale(trovati[0] ? 'cor-' + trovati[0].id : 'tasto-a')
  return (
    <Finestra titolo="Correggi titolo" larghezza={1640} onChiudi={onChiudi}>
      <div style={{ display: 'flex', gap: 64, marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Campo testo={q} suggerimento="Titolo da cercare" larghezza={608} />
          <Tastiera testo={q} onCambia={setQ} g="tastiera-correggi" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 640, overflow: 'auto', scrollbarWidth: 'none' }}>
          <div className="t-meta c-3" style={{ margin: '0 0 12px 24px' }}>Titoli trovati</div>
          {trovati.slice(0, 5).map((x) => (
            <VoceElenco key={x.id} fid={'cor-' + x.id} testo={x.titolo} dettaglio={`${x.anno ?? ''} · ${x.generi[0] ?? ''}`} locandina={x.poster} attuale={x.id === t.id} onOk={onScegli} />
          ))}
          {omonimi.map((o) => (
            <VoceElenco key={o.id} fid={'cor-' + o.id} testo={o.titolo} dettaglio={String(o.anno)} locandina={o.poster} onOk={onScegli} />
          ))}
        </div>
      </div>
    </Finestra>
  )
}

function Episodi({ serie: t, stagione, setStagione, avvia }: { serie: Serie; stagione: number; setStagione: (n: number) => void; avvia: ReturnType<typeof useRipresa>['avvia'] }) {
  const { dati } = useStato()
  const st = t.stagioni[stagione]
  const av = dati.avanzamenti[t.id]
  return (
    <>
      <section data-y="inizio" style={{ display: 'flex', gap: 16, padding: '0 96px' }} data-g="stagioni">
        {t.stagioni.map((x, i) => (
          <Scelta key={x.numero} fid={'st-' + i} testo={`Stagione ${x.numero}`} selezionata={i === stagione} pref={i === stagione} onFuoco={() => setStagione(i)} onOk={() => setStagione(i)} />
        ))}
      </section>
      <Riga g={'episodi-' + stagione} y="inizio" stile={{ marginTop: -24 }}>
        {st.episodi.map((e) => {
          const visto = dati.visti.includes(e.id)
          const pos = av?.id === e.id ? av.pos / (e.minuti * 60) : visto ? 1 : undefined
          return (
            <Card
              key={e.id}
              fid={'ep-' + e.id}
              formato="episodio"
              img={e.img}
              titolo={`E${e.numero} · ${e.titolo}`}
              meta={durata(e.minuti)}
              avanzamento={pos}
              onOk={() =>
                avvia({ s: 'player', id: t.id, episodio: e.id }, av?.id === e.id, { pos: av?.pos ?? 0, durata: e.minuti * 60, cosa: `${t.titolo} · ${sigla(e.id)}` }, 'ep-' + e.id)
              }
            />
          )
        })}
      </Riga>
    </>
  )
}
