/* SC-03 Home (schema A · Vetrina), con i dati del server Jellyfin. */
import { useEffect, useState, type ReactNode } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Card, Menu, Pulsante, Riga } from '../componenti'
import { MOOD, generiDelMood, illustrazioneGenere } from '../dati'
import { api, dimentica, orizzontale, secondi, sfondo, useCarica } from '../jf'
import { useFuocoIniziale, useNav } from '../nav'
import { useStato } from '../stato'
import { CAMPI, metaBreve, restano, sigla, useAzionePrincipale } from './comune'
import { useRipresa } from './Ripresa'

export function Home() {
  const nav = useNav()
  const { uid } = useStato()
  const ripresa = useRipresa()
  const lib = getLibraryApi(api)
  const [n, setN] = useState(0)
  const [riga, setRiga] = useState(-1) // -1: menu o titolo in evidenza

  const evidenza = useCarica(`home:evidenza:${uid}`, async () =>
    (await lib.getItems({ userId: uid, includeItemTypes: ['Movie', 'Series'], recursive: true, sortBy: ['Random'], limit: 6, imageTypes: ['Backdrop'], hasOverview: true, fields: [...CAMPI] })).data.Items ?? [],
  )
  const riprendi = useCarica(`home:riprendi:${uid}`, async () =>
    (await lib.getResumeItems({ userId: uid, mediaTypes: ['Video'], limit: 16, fields: [...CAMPI], enableUserData: true })).data.Items ?? [],
  )
  const lista = useCarica(`home:lista:${uid}`, async () =>
    (await lib.getItems({ userId: uid, isFavorite: true, includeItemTypes: ['Movie', 'Series'], recursive: true, sortBy: ['DateCreated'], sortOrder: ['Descending'], limit: 20, fields: [...CAMPI] })).data.Items ?? [],
  )
  const recenti = useCarica(`home:recenti:${uid}`, async () =>
    (await lib.getLatestMedia({ userId: uid, includeItemTypes: ['Movie', 'Series'], limit: 16, fields: [...CAMPI] })).data,
  )
  const generi = useCarica(`home:generi:${uid}`, async () =>
    (await getGenreApi(api).getGenres({ userId: uid, includeItemTypes: ['Movie', 'Series'], sortBy: ['SortName'], fields: ['ItemCounts'] })).data.Items ?? [],
  )
  const collezioni = useCarica(`home:collezioni:${uid}`, async () =>
    (await lib.getItems({ userId: uid, includeItemTypes: ['BoxSet'], recursive: true, sortBy: ['SortName'], limit: 20, fields: ['ChildCount'] })).data.Items ?? [],
  )

  const titoli = evidenza.dati ?? []
  const corrente: BaseItemDto | undefined = titoli[n % Math.max(1, titoli.length)]
  const principale = useAzionePrincipale(corrente)
  const [inLista, setInLista] = useState<Record<string, boolean>>({})
  const preferito = (t?: BaseItemDto) => (t ? inLista[t.Id!] ?? !!t.UserData?.IsFavorite : false)

  // il titolo in evidenza cambia da solo ogni 8 s, ma non mentre si sceglie fra i suoi pulsanti
  useEffect(() => {
    if (riga === -2 || titoli.length < 2) return
    const t = setInterval(() => setN((x) => x + 1), 8000)
    return () => clearInterval(t)
  }, [riga, titoli.length])

  const caricato = evidenza.pronto && riprendi.pronto
  const vuota = caricato && titoli.length === 0 && !(recenti.dati?.length)
  useFuocoIniziale(!caricato ? null : vuota ? 'vuota-impostazioni' : riprendi.dati?.length ? 'r0-0' : 'ev-principale', [caricato, vuota])

  if (vuota) {
    return (
      <div className="schermata" data-livello>
        <Menu attiva="home" />
        <div className="vuoto">
          <h1 className="t-titolo-pagina" style={{ margin: 0 }}>La libreria è vuota</h1>
          <p className="t-sinossi c-2">Sul server Jellyfin non ci sono ancora film o serie per questo profilo.</p>
          <Pulsante fid="vuota-impostazioni" tipo="principale" onOk={() => nav.vai({ s: 'impostazioni', sezione: 'libreria' })}>
            Vai alle impostazioni della libreria
          </Pulsante>
        </div>
      </div>
    )
  }

  const apri = (t: BaseItemDto) => nav.vai({ s: t.Type === 'BoxSet' ? 'collezione' : 'titolo', id: t.Id! })
  const righe: { titolo: string; contenuto: ReactNode[] }[] = []

  // Riprendi da dove eri: riparte subito, senza chiedere
  if (riprendi.dati?.length) {
    righe.push({
      titolo: 'Riprendi da dove eri',
      contenuto: riprendi.dati.map((t, i) => {
        const pos = secondi(t.UserData?.PlaybackPositionTicks)
        const tot = secondi(t.RunTimeTicks)
        const ep = t.Type === 'Episode'
        return (
          <Card
            key={t.Id}
            fid={`r0-${i}`}
            formato="orizzontale"
            img={orizzontale(t)}
            titolo={ep ? t.SeriesName ?? t.Name ?? '' : t.Name ?? ''}
            meta={
              <span className="card__riga-meta">
                {ep && <span>{sigla(t)} ·</span>}
                <span>{restano(tot - pos)}</span>
              </span>
            }
            avanzamento={tot ? pos / tot : 0}
            onOk={() => nav.vai({ s: 'player', id: t.Id! })}
          />
        )
      }),
    })
  }
  const card = (r: number) => (t: BaseItemDto, i: number) => (
    <Card key={t.Id} fid={`r${r}-${i}`} formato="orizzontale" img={orizzontale(t)} titolo={t.Name ?? ''} meta={metaBreve(t)} onOk={() => apri(t)} />
  )
  const add = (titolo: string, el?: BaseItemDto[]) => el?.length && righe.push({ titolo, contenuto: el.map(card(righe.length)) })
  add('La mia lista', lista.dati)
  add('Aggiunti di recente', recenti.dati)

  // Generi e Mood con le illustrazioni monocromatiche
  const nomiGeneri = (generi.dati ?? []).map((g) => g.Name ?? '').filter(Boolean)
  const raccolta = (nome: string, occhiello: string, gg: string[], img: string, r: number, i: number, meta?: string) => (
    <Card key={nome} fid={`r${r}-${i}`} formato="collezione" larghezza={400} img={img} titolo={nome} meta={meta} onOk={() => nav.vai({ s: 'raccolta', nome, occhiello, generi: gg })} />
  )
  if (generi.dati?.length) {
    const r = righe.length
    const ordinati = [...generi.dati].sort((a, b) => (b.MovieCount ?? 0) + (b.SeriesCount ?? 0) - ((a.MovieCount ?? 0) + (a.SeriesCount ?? 0)))
    righe.push({
      titolo: 'Generi',
      contenuto: ordinati.map((g, i) => {
        const conta = (g.MovieCount ?? 0) + (g.SeriesCount ?? 0)
        return raccolta(g.Name!, 'Genere', [g.Name!], illustrazioneGenere(g.Name!), r, i, conta ? `${conta} titoli` : undefined)
      }),
    })
  }
  const mood = MOOD.map((m) => ({ ...m, reali: generiDelMood(m, nomiGeneri) })).filter((m) => m.reali.length)
  if (mood.length) {
    const r = righe.length
    righe.push({ titolo: 'Mood', contenuto: mood.map((m, i) => raccolta(m.nome, 'Mood', m.reali, `media/illustrazioni/mood-${m.id}.svg`, r, i)) })
  }
  if (collezioni.dati?.length) {
    const r = righe.length
    righe.push({
      titolo: 'Collezioni',
      contenuto: collezioni.dati.map((c, i) => (
        <Card key={c.Id} fid={`r${r}-${i}`} formato="collezione" larghezza={400} img={orizzontale(c)} titolo={c.Name ?? ''} meta={c.ChildCount ? `${c.ChildCount} film` : undefined} onOk={() => apri(c)} />
      )),
    })
  }

  const cambiaLista = async (t: BaseItemDto) => {
    const ora = preferito(t)
    setInLista((x) => ({ ...x, [t.Id!]: !ora }))
    const ud = getUserDataApi(api)
    if (ora) await ud.unmarkFavoriteItem({ itemId: t.Id!, userId: uid })
    else await ud.markFavoriteItem({ itemId: t.Id!, userId: uid })
    // la riga La mia lista si aggiorna al prossimo rientro nella Home (cambia solo l'icona)
    dimentica(`home:lista:${uid}`)
    dimentica(`griglia:lista:${uid}`)
  }

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
            <div className="sfondo">{corrente && <img key={corrente.Id} src={sfondo(corrente) ?? ''} alt="" />}</div>
          </div>
          {corrente && (
            <div style={{ position: 'absolute', left: 96, bottom: 64, width: 900, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="t-occhiello c-2">{corrente.Type === 'Series' ? 'Serie' : 'Film'}</div>
              <h1 className="t-titolo-evidenza" style={{ margin: 0 }}>{corrente.Name}</h1>
              <div className="t-meta c-2">{metaBreve(corrente, true)}</div>
              <p className="t-sinossi c-2" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {corrente.Overview}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 24 }} data-g="evidenza">
                <Pulsante fid="ev-principale" tipo="principale" icona="play" pref onOk={() => principale && ripresa.avvia(principale.voce, principale.iniziato, principale, 'ev-principale')}>
                  {principale?.testo ?? 'Guarda'}
                </Pulsante>
                <Pulsante fid="ev-lista" tipo="icona" icona={preferito(corrente) ? 'spunta' : 'piu'} etichetta={preferito(corrente) ? 'Nella mia lista' : 'Aggiungi alla mia lista'} onOk={() => cambiaLista(corrente)} />
              </div>
            </div>
          )}
          {titoli.length > 1 && (
            <div style={{ position: 'absolute', right: 96, bottom: 90, display: 'flex', gap: 6 }} aria-hidden>
              {titoli.map((t, i) => (
                <div key={t.Id} style={{ width: i === n % titoli.length ? 40 : 16, height: 4, borderRadius: 999, background: i === n % titoli.length ? 'var(--text)' : 'var(--indicator)', transition: 'width 150ms' }} />
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
