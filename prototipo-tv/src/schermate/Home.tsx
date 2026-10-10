/* SC-03 Home (schema A · Vetrina) */
import { useEffect, useState } from 'react'
import { Card, Menu, Pulsante, Riga } from '../componenti'
import { MOOD, collezioni, film, generiPrincipali, inEvidenza, serie, titoli, titolo as cercaTitolo, trovaEpisodio, sigla, type Titolo } from '../dati'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato, type Avanzamento } from '../stato'
import { azionePrincipale, metaBreve, restano } from './comune'
import { useRipresa } from './Ripresa'

export function Home() {
  const nav = useNav()
  const s = useStato()
  const { dati, azioni, puo, riprendi } = s
  const evidenza = inEvidenza.filter(puo)
  const [n, setN] = useState(0)
  const ripresa = useRipresa()
  const [riga, setRiga] = useState(-1) // -1: menu o titolo in evidenza
  const vuota = evidenza.length === 0 && !film.some(puo)

  const corrente = evidenza[n % Math.max(1, evidenza.length)] as Titolo | undefined

  // il titolo in evidenza cambia da solo ogni 8 s, ma non mentre si sceglie fra i suoi pulsanti
  useEffect(() => {
    if (riga === -2 || evidenza.length < 2) return
    const t = setInterval(() => setN((x) => x + 1), 8000)
    return () => clearInterval(t)
  }, [riga, evidenza.length])

  useFuocoIniziale(vuota ? 'vuota-impostazioni' : riprendi.length ? 'r0-0' : 'ev-principale')

  if (vuota) {
    return (
      <div className="schermata" data-livello>
        <Menu attiva="home" />
        <div className="vuoto">
          <h1 className="t-titolo-pagina" style={{ margin: 0 }}>La libreria è vuota</h1>
          <p className="t-sinossi c-2">Aggiungi una cartella con i tuoi film e le tue serie: i titoli compariranno qui.</p>
          <Pulsante fid="vuota-impostazioni" tipo="principale" onOk={() => nav.vai({ s: 'impostazioni', sezione: 'libreria' })}>
            Vai alle impostazioni della libreria
          </Pulsante>
        </div>
      </div>
    )
  }

  const apri = (t: Titolo) => nav.vai({ s: 'titolo', id: t.id })
  const riprendiCard = (t: Titolo, av: Avanzamento, i: number) => {
    const ep = t.tipo === 'serie' ? trovaEpisodio(av.id) : null
    const durata = (ep ? ep.episodio.minuti : t.tipo === 'film' ? t.minuti ?? 90 : 50) * 60
    return (
      <Card
        key={t.id}
        fid={`r0-${i}`}
        formato="orizzontale"
        img={ep?.episodio.img ?? t.sfondo ?? t.poster}
        titolo={t.titolo}
        meta={
          <span className="card__riga-meta">
            {ep && <span>{sigla(av.id)} ·</span>}
            <span>{restano(durata - av.pos)}</span>
          </span>
        }
        avanzamento={av.pos / durata}
        onOk={() => nav.vai({ s: 'player', id: t.id, episodio: ep?.episodio.id })}
      />
    )
  }
  const card = (r: number) => (t: Titolo, i: number) => (
    <Card key={t.id} fid={`r${r}-${i}`} formato="orizzontale" img={t.sfondo ?? t.poster} titolo={t.titolo} meta={metaBreve(t)} onOk={() => apri(t)} />
  )

  // la riga La mia lista resta com'era all'apertura della Home: premendo + cambia solo l'icona (2026-10-10)
  const [listaAllApertura] = useState(dati.lista)
  const lista = listaAllApertura.map((id) => cercaTitolo(id)).filter(puo)
  const recenti = [...film, ...serie].filter(puo).sort((a, b) => b.aggiunto - a.aggiunto).slice(0, 12)
  const righe: { titolo: string; contenuto: React.ReactNode[] }[] = []
  if (riprendi.length) righe.push({ titolo: 'Riprendi da dove eri', contenuto: riprendi.map((x, i) => riprendiCard(x.titolo, x.av, i)) })
  const add = (titolo: string, el: Titolo[]) => el.length && righe.push({ titolo, contenuto: el.map(card(righe.length)) })
  add('La mia lista', lista)
  add('Aggiunti di recente', recenti)
  // Film e Serie non stanno nella Home: sono già nel menu (2026-10-10). Al loro posto Generi e Mood.
  // illustrazioni monocromatiche disegnate apposta (public/media/illustrazioni)
  const illustrazione = (file: string) => `media/illustrazioni/${file}.svg`
  const conta = (generi: string[]) => titoli.filter((x) => puo(x) && x.generi.some((g) => generi.includes(g))).length
  const raccolta = (nome: string, occhiello: string, generi: string[], file: string, r: number, i: number) => (
    <Card
      key={nome}
      fid={`r${r}-${i}`}
      formato="collezione"
      larghezza={400}
      img={illustrazione(file)}
      titolo={nome}
      meta={`${conta(generi)} titoli`}
      onOk={() => nav.vai({ s: 'raccolta', nome, occhiello, generi })}
    />
  )
  const generi = generiPrincipali().filter((g) => conta([g]) > 0)
  if (generi.length) {
    const r = righe.length
    righe.push({ titolo: 'Generi', contenuto: generi.map((g, i) => raccolta(g, 'Genere', [g], 'genere-' + g.toLowerCase(), r, i)) })
  }
  const mood = MOOD.filter((m) => conta(m.generi) > 0)
  if (mood.length) {
    const r = righe.length
    righe.push({ titolo: 'Mood', contenuto: mood.map((m, i) => raccolta(m.nome, 'Mood', m.generi, 'mood-' + m.id, r, i)) })
  }
  const cols = collezioni.filter((c) => c.film.some((id) => puo(cercaTitolo(id))))
  if (cols.length) {
    const r = righe.length
    righe.push({
      titolo: 'Collezioni',
      contenuto: cols.map((c, i) => {
        const primo = cercaTitolo(c.film[0])
        return (
          <Card key={c.id} fid={`r${r}-${i}`} formato="collezione" larghezza={400} img={primo?.sfondo ?? primo?.poster ?? null} titolo={c.nome} meta={`${c.film.length} film`} onOk={() => nav.vai({ s: 'collezione', id: c.id })} />
        )
      }),
    })
  }

  const principale = corrente ? azionePrincipale(corrente, s) : null
  const inLista = corrente ? dati.lista.includes(corrente.id) : false

  return (
    <div className="schermata" data-livello>
      <Menu attiva="home" nascosto={riga > 0} />
      <div
        className="scorre"
        data-yscroll="140"
        onFocus={(e) => {
          const el = (e.target as HTMLElement).closest<HTMLElement>('[data-riga]')
          setRiga(el ? Number(el.dataset.riga) : -1)
        }}
      >
        {/* titolo in evidenza */}
        <section data-y="cima" data-riga="-2" style={{ position: 'relative', height: 690 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1080 }}>
            {corrente && (
              <div className="sfondo">
                {corrente.sfondo && <img key={corrente.id} src={corrente.sfondo} alt="" />}
              </div>
            )}
          </div>
          {corrente && (
            <div style={{ position: 'absolute', left: 96, bottom: 64, width: 900, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="t-occhiello c-2">{corrente.tipo === 'serie' ? 'Serie · Nuovi episodi' : 'Film · In evidenza'}</div>
              <h1 className="t-titolo-evidenza" style={{ margin: 0 }}>{corrente.titolo}</h1>
              <div className="t-meta c-2">{metaBreve(corrente, true)}</div>
              <p className="t-sinossi c-2" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {corrente.trama}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 24 }} data-g="evidenza">
                <Pulsante fid="ev-principale" tipo="principale" icona="play" pref onOk={() => principale && ripresa.avvia(principale.voce, principale.iniziato, principale, 'ev-principale')}>
                  {principale?.testo}
                </Pulsante>
                <Pulsante fid="ev-lista" tipo="icona" icona={inLista ? 'spunta' : 'piu'} etichetta={inLista ? 'Nella mia lista' : 'Aggiungi alla mia lista'} onOk={() => azioni.cambiaLista(corrente.id)} />
              </div>
            </div>
          )}
          {evidenza.length > 1 && (
            <div style={{ position: 'absolute', right: 96, bottom: 90, display: 'flex', gap: 6 }} aria-hidden>
              {evidenza.map((t, i) => (
                <div key={t.id} style={{ width: i === n % evidenza.length ? 40 : 16, height: 4, borderRadius: 999, background: i === n % evidenza.length ? 'var(--text)' : 'var(--indicator)', transition: 'width 150ms' }} />
              ))}
            </div>
          )}
        </section>

        {/* righe */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 56, paddingBottom: 400 }}>
          {righe.map((r, i) => (
            <div key={r.titolo} data-riga={i}>
              <Riga g={'riga-' + i} titolo={r.titolo} y={i === 0 ? 'cima' : 'inizio'}>
                {r.contenuto}
              </Riga>
            </div>
          ))}
        </div>
      </div>
      {ripresa.finestra}
    </div>
  )
}
