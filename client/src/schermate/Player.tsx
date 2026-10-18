/*
 * SC-13 Player (menu e capitoli) · SC-14 Sottotitoli e Impostazioni (pannelli laterali) ·
 * SC-15 Prossimo episodio (schema E), con i video del server Jellyfin.
 * Il punto raggiunto si salva sul profilo Jellyfin ogni 10 secondi e all'uscita.
 */
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api'
import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models'
import { Avanzamento, Card, Finestra, Pulsante, Scelta } from '../componenti'
import { api, BASE, dimentica, orizzontale, secondi, TICK, useCarica } from '../jf'
import { corrente, mettiId } from '../fuoco'
import { useFuocoIniziale, useNav, useTasti, type Voce } from '../nav'
import { useStato } from '../stato'
import { ALTEZZE, chiediSorgente, fermaConversione, urlSottotitoli, type Qualita, type Sorgente } from '../riproduzione'
import { sigla } from './comune'

const VELOCITA = [0.5, 0.75, 1, 1.25, 1.5, 2]
const NOMI_VELOCITA = ['0,5×', '0,75×', 'Normale', '1,25×', '1,5×', '2×']
type Pannello = 'sottotitoli' | 'impostazioni'
/** il tasto da cui si apre ogni riga di scelte: chiudendola si torna lì */
const TASTO_PANNELLO: Record<Pannello, string> = { sottotitoli: 'pl-sottotitoli', impostazioni: 'pl-impostazioni' }

function tempo(s: number) {
  s = Math.max(0, Math.round(s))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

const lingua = (s: MediaStream) => s.DisplayTitle || s.Language || `Traccia ${s.Index}`

export function Player({ voce }: { voce: Extract<Voce, { s: 'player' }> }) {
  if (voce.trailer?.youtube) return <TrailerYoutube url={voce.trailer.youtube} titolo={voce.trailer.titolo} />
  return <PlayerJellyfin voce={voce} />
}

/** I trailer che stanno su YouTube: si guardano nel loro riquadro, Indietro torna alla scheda. */
function TrailerYoutube({ url, titolo }: { url: string; titolo: string }) {
  const nav = useNav()
  useTasti((t) => (t === 'indietro' ? (nav.indietro(), true) : false))
  const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]
  return (
    <div className="schermata" data-livello style={{ background: 'var(--bg-player)' }}>
      {id ? (
        <iframe title={`Trailer · ${titolo}`} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; fullscreen" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      ) : (
        <div className="vuoto">
          <p className="t-sinossi c-2">Questo trailer non si può aprire qui.</p>
        </div>
      )}
    </div>
  )
}

function PlayerJellyfin({ voce }: { voce: Extract<Voce, { s: 'player' }> }) {
  const nav = useNav()
  const { uid } = useStato()
  const trailer = !!voce.trailer
  const video = useRef<HTMLVideoElement>(null)
  const hls = useRef<Hls | null>(null)

  const elemento = useCarica(`player:${uid}:${voce.id}`, async () => (await getLibraryApi(api).getItem({ itemId: voce.id, userId: uid })).data)
  const t = elemento.dati
  const ep = t?.Type === 'Episode'
  const prossimo = useCarica(ep && !trailer ? `dopo:${uid}:${voce.id}` : null, async () => {
    const r = await getShowApi(api).getEpisodes({ seriesId: t!.SeriesId!, userId: uid, startItemId: voce.id, limit: 2 })
    return (r.data.Items ?? []).find((x) => x.Id !== voce.id) ?? null
  })

  const durata = secondi(t?.RunTimeTicks) || video.current?.duration || 0
  const [pos, setPos] = useState(0)
  const [inPausa, setInPausa] = useState(false)
  const [comandi, setComandi] = useState(true)
  const [pannello, setPannello] = useState<Pannello | null>(null)
  const [fila, setFila] = useState(false)
  const [velocita, setVelocita] = useState(2)
  const [qualita, setQualita] = useState<Qualita>('auto')
  /** "Prova la transcodifica": converte anche quando il server proverebbe a mandare il file così com'è */
  const [forza, setForza] = useState(false)
  const [audio, setAudio] = useState<number | undefined>(undefined)
  const [sotto, setSotto] = useState<number>(-1)
  const [sorgente, setSorgente] = useState<Sorgente | null>(null)
  const [nonRiproducibile, setNonRiproducibile] = useState(false)
  /** il video sta caricando: si vede il cerchio che gira al posto dello schermo nero */
  const [carica, setCarica] = useState(true)
  const [prossimoChiuso, setProssimoChiuso] = useState(false)
  const posRef = useRef(0)
  posRef.current = pos
  /** il punto raggiunto, letto dal video (il tempo a schermo può essere indietro di un attimo) */
  const posizione = () => video.current?.currentTime || posRef.current
  // l'orologio a schermo segue il video
  useEffect(() => {
    const i = setInterval(() => video.current && setPos(video.current.currentTime), 500)
    return () => clearInterval(i)
  }, [])
  const timer = useRef(0)
  /** con un pannello o i capitoli aperti il menu non si nasconde da solo */
  const apertoRef = useRef(false)
  apertoRef.current = !!pannello || fila

  function chiudiSessione(s: Sorgente, p: number) {
    return Promise.all([
      getSessionApi(api)
        .reportPlaybackStopped({ playbackStopInfo: { ItemId: voce.id, MediaSourceId: s.media.Id, PlaySessionId: s.playSessionId, PositionTicks: Math.round(p * TICK) } })
        .catch(() => {}),
      fermaConversione(s),
    ])
  }

  // ---------- apre lo stream (e lo riapre quando cambiano audio, sottotitoli impressi o qualità) ----------
  const inizio = useRef<number | null>(null)
  if (inizio.current === null && t) inizio.current = voce.daCapo || trailer ? 0 : secondi(t.UserData?.PlaybackPositionTicks)
  const [giro, setGiro] = useState(0)
  /** lo stream è già stato aperto: riaprendolo (audio, qualità, sottotitoli) si riparte dal punto raggiunto */
  const aperto = useRef(false)
  useEffect(() => {
    if (!t) return
    let vivo = true
    const da = aperto.current ? posizione() : inizio.current ?? 0
    aperto.current = true
    // la sessione di prima si chiude: il server smette di convertire e cancella i suoi file
    if (sorgente) {
      hls.current?.destroy()
      hls.current = null
      chiudiSessione(sorgente, da)
    }
    const sottoImpresso = sotto >= 0 && t.MediaStreams?.find((s) => s.Index === sotto)?.IsTextSubtitleStream === false ? sotto : undefined
    setNonRiproducibile(false)
    setCarica(true)
    chiediSorgente({
      itemId: voce.id,
      mediaSourceId: sorgente?.media.Id ?? t.MediaSources?.[0]?.Id ?? undefined,
      uid,
      inizio: da,
      audio,
      sottotitoli: sottoImpresso,
      conversione: forza ? 'sempre' : qualita === 'originale' ? 'mai' : 'auto',
      altezza: typeof qualita === 'number' ? qualita : undefined,
    })
      .then((s) => {
        if (!vivo) return
        if (!s) return setNonRiproducibile(true)
        setSorgente(s)
        const v = video.current!
        hls.current?.destroy()
        hls.current = null
        if (s.hls && Hls.isSupported()) {
          const h = new Hls({ startPosition: da })
          h.loadSource(s.url)
          h.attachMedia(v)
          h.on(Hls.Events.ERROR, (_, d) => d.fatal && setNonRiproducibile(true))
          hls.current = h
        } else {
          v.src = s.url
          v.addEventListener('loadedmetadata', () => (v.currentTime = da), { once: true })
        }
        v.play().catch(() => {})
        getSessionApi(api)
          .reportPlaybackStart({ playbackStartInfo: { ItemId: voce.id, MediaSourceId: s.media.Id, PlaySessionId: s.playSessionId, PositionTicks: Math.round(da * TICK), PlayMethod: s.modo === 'diretta' ? 'DirectPlay' : s.modo === 'parziale' ? 'DirectStream' : 'Transcode' } })
          .catch(() => {})
      })
      .catch(() => vivo && setNonRiproducibile(true))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.Id, giro, audio, qualita, forza])

  // sottotitoli testuali: una <track> sul video, senza riaprire lo stream
  const urlSub = sorgente && sotto >= 0 ? urlSottotitoli(sorgente.media, sotto) : null
  useEffect(() => {
    const v = video.current
    if (!v) return
    for (const tr of Array.from(v.textTracks)) tr.mode = urlSub ? 'showing' : 'disabled'
  }, [urlSub])
  const cambiaSottotitoli = (i: number) => {
    setSotto(i)
    const s = t?.MediaStreams?.find((x) => x.Index === i)
    if (i >= 0 && s && !s.IsTextSubtitleStream) setGiro((g) => g + 1) // i sottotitoli a immagini il server li imprime nel video
  }

  // ---------- salva il punto sul profilo ----------
  const salva = (fine = false, p = posizione()) => {
    if (trailer || !t) return
    const finito = fine || (durata > 0 && p >= durata * 0.95)
    getUserDataApi(api)
      .updateItemUserData({
        itemId: voce.id,
        userId: uid,
        updateUserItemDataDto: finito ? { Played: true, PlaybackPositionTicks: 0, LastPlayedDate: new Date().toISOString() } : { PlaybackPositionTicks: Math.round(p * TICK), LastPlayedDate: new Date().toISOString() },
      })
      .catch(() => {})
    dimentica(`home:riprendi:${uid}`)
    dimentica(`titolo:${uid}:`)
    dimentica(`prossimo:${uid}:`)
    dimentica(`episodi:${uid}:`)
  }
  useEffect(() => {
    const i = setInterval(() => !video.current?.paused && salva(), 10_000)
    return () => clearInterval(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.Id])
  useEffect(
    () => () => {
      hls.current?.destroy()
    },
    [],
  )

  // prima si chiude la sessione sul server, poi si salva il punto: così vale sempre il nostro
  const fermaESalva = (fine = false) => {
    // il punto si legge subito: dopo, uscendo dal player, il video non c'è più
    const p = posizione()
    ;(sorgente ? chiudiSessione(sorgente, p) : Promise.resolve()).finally(() => salva(fine, p))
  }
  const esci = () => {
    fermaESalva()
    nav.indietro()
  }
  const vaiAlProssimo = () => {
    if (!prossimo.dati) return
    fermaESalva(true)
    nav.sostituisci({ s: 'player', id: prossimo.dati.Id! })
  }

  // ---------- comandi ----------
  const mostra = () => {
    setComandi(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => !apertoRef.current && setComandi(false), 4000)
  }
  useEffect(() => {
    mostra()
    return () => clearTimeout(timer.current)
  }, [])
  useEffect(() => {
    if (video.current) video.current.playbackRate = VELOCITA[velocita]
  }, [velocita, sorgente])
  const pausa = (p: boolean) => {
    const v = video.current
    if (!v) return
    if (p) v.pause()
    else v.play().catch(() => {})
    setInPausa(p)
  }
  const vaiA = (sec: number) => {
    const v = video.current
    if (v) v.currentTime = Math.max(0, sec)
  }
  // ← → sulla barra: il punto (e l'anteprima) si sposta subito, il video ci salta quando ci si ferma
  const [meta, setMeta] = useState<number | null>(null)
  const metaRef = useRef<number | null>(null)
  const attesaSalto = useRef(0)
  useEffect(() => () => clearTimeout(attesaSalto.current), [])
  const cerca = (sec: number) => {
    const fine = (durata || video.current?.duration || 0) - 1
    const n = Math.max(0, Math.min(fine, (metaRef.current ?? posizione()) + sec))
    metaRef.current = n
    setMeta(n)
    clearTimeout(attesaSalto.current)
    attesaSalto.current = window.setTimeout(() => {
      vaiA(n)
      metaRef.current = null
      setMeta(null)
    }, 700)
  }

  // SC-15: negli ultimi 40 s di un episodio compare il prossimo, con 10 s di conto alla rovescia
  const titoliDiCoda = !!prossimo.dati && durata > 0 && durata - pos <= 40 && !prossimoChiuso
  const [conto, setConto] = useState(10)
  useEffect(() => {
    if (!titoliDiCoda) return setConto(10)
    setTimeout(() => mettiId('pr-guarda'))
    const i = setInterval(() => setConto((c) => c - 1), 1000)
    return () => clearInterval(i)
  }, [titoliDiCoda])
  useEffect(() => {
    if (titoliDiCoda && conto <= 0) vaiAlProssimo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conto])

  useFuocoIniziale('pl-pausa')
  useEffect(() => {
    if (!nonRiproducibile && !titoliDiCoda) setTimeout(() => mettiId('pl-pausa'))
  }, [nonRiproducibile, titoliDiCoda])

  // ---------- capitoli ----------
  const capitoli = (t?.Chapters ?? [])
    .map((c, i) => ({ i, da: secondi(c.StartPositionTicks), nome: c.Name || `Capitolo ${i + 1}`, img: c.ImageTag ? `${BASE}/Items/${voce.id}/Images/Chapter/${i}?fillWidth=480&quality=80&tag=${c.ImageTag}` : null }))
    .filter((c) => c.da < durata || !durata)
  const inCorso = capitoli.reduce((r, c, k) => (c.da <= pos ? k : r), 0)
  const apriFila = () => {
    if (capitoli.length < 2) return
    setFila(true)
    setTimeout(() => mettiId(`cap-${inCorso}`))
  }
  const chiudiFila = () => {
    setFila(false)
    mostra()
    setTimeout(() => mettiId('pl-pausa'))
  }

  // ---------- pannelli ----------
  const apri = (p: Pannello) => {
    setPannello(p)
    setFila(false)
  }
  const chiudi = () => {
    const da = pannello
    setPannello(null)
    mostra()
    setTimeout(() => mettiId(da ? TASTO_PANNELLO[da] : 'pl-pausa'))
  }

  useTasti((tasto, e) => {
    if (nonRiproducibile || titoliDiCoda) return false
    const eraNascosto = !comandi
    mostra()
    if (pannello) {
      // ↓ dall'ultima riga di scelte (o dall'unica, nei Sottotitoli) chiude e torna al tasto
      const f = corrente()?.dataset.f ?? ''
      const ultima = pannello === 'sottotitoli' || f.startsWith('op-velocita-')
      if (tasto === 'indietro' || (tasto === 'giu' && ultima)) return chiudi(), true
      return false
    }
    // a menu chiuso: OK pausa, ← → saltano di 10 s (30 tenendo premuto) e portano sulla barra,
    // gli altri tasti mostrano il menu
    if (eraNascosto) {
      if (tasto === 'indietro') return esci(), true
      if (tasto === 'sinistra' || tasto === 'destra') {
        cerca((tasto === 'destra' ? 1 : -1) * (e.repeat ? 30 : 10))
        setTimeout(() => mettiId('pl-barra'))
        return true
      }
      if (tasto === 'ok') pausa(!inPausa)
      setTimeout(() => mettiId('pl-pausa'))
      return true
    }
    if (fila) {
      if (tasto === 'indietro' || tasto === 'giu') return chiudiFila(), true
      if (tasto === 'su') return true
      return false
    }
    if (tasto === 'indietro') return esci(), true
    // i tasti stanno sopra la barra: ↑ ↓ passano dagli uni all'altra, ← → sulla barra spostano il punto
    if (corrente()?.dataset.f === 'pl-barra') {
      if (tasto === 'sinistra' || tasto === 'destra') cerca((tasto === 'destra' ? 1 : -1) * durata * (e.repeat ? 0.04 : 0.02))
      if (tasto === 'ok') pausa(!inPausa)
      if (tasto === 'su') mettiId('pl-pausa')
      // ↓ dalla barra chiude il menu
      if (tasto === 'giu') {
        clearTimeout(timer.current)
        setComandi(false)
      }
      return true
    }
    if (tasto === 'su') return apriFila(), true
    if (tasto === 'giu') return mettiId('pl-barra'), true
    return false
  })

  // ---------- scelte dei pannelli ----------
  const flussi = sorgente?.media.MediaStreams ?? t?.MediaStreams ?? []
  const subs = flussi.filter((s) => s.Type === 'Subtitle')
  const audios = flussi.filter((s) => s.Type === 'Audio')
  const audioAttivo = audio ?? sorgente?.media.DefaultAudioStreamIndex ?? audios[0]?.Index
  const altezzaFile = (t?.MediaStreams ?? []).find((s) => s.Type === 'Video')?.Height ?? 1080
  type Opzione = { id: string; testo: string; attiva: boolean; ok: () => void }
  const sceltaSottotitoli: Opzione[] = [{ id: '-1', testo: 'Nessuno', attiva: sotto < 0, ok: () => cambiaSottotitoli(-1) }, ...subs.map((s) => ({ id: String(s.Index), testo: lingua(s), attiva: sotto === s.Index, ok: () => cambiaSottotitoli(s.Index!) }))]
  const gruppi: { id: string; nome: string; scelte: Opzione[] }[] = [
    { id: 'audio', nome: 'Audio', scelte: audios.map((s) => ({ id: String(s.Index), testo: lingua(s), attiva: audioAttivo === s.Index, ok: () => setAudio(s.Index!) })) },
    {
      id: 'qualita',
      nome: 'Qualità',
      scelte: [
        { id: 'auto', testo: 'Automatica', valore: 'auto' as Qualita },
        { id: 'originale', testo: 'Originale', valore: 'originale' as Qualita },
        ...ALTEZZE.filter((h) => h <= altezzaFile).map((h) => ({ id: String(h), testo: `${h}p`, valore: h as Qualita })),
      ].map((q) => ({ id: q.id, testo: q.testo, attiva: qualita === q.valore, ok: () => (setForza(false), setQualita(q.valore)) })),
    },
    { id: 'velocita', nome: 'Velocità', scelte: NOMI_VELOCITA.map((n, i) => ({ id: String(i), testo: n, attiva: velocita === i, ok: () => setVelocita(i) })) },
  ]
  // aprendo un pannello il fuoco va sulla scelta in uso (nelle Impostazioni, quella dell'Audio)
  useEffect(() => {
    if (!pannello) return
    const prima = pannello === 'sottotitoli' ? [{ id: 'sottotitoli', scelte: sceltaSottotitoli }] : gruppi.filter((g) => g.scelte.length)
    const g = prima[0]
    if (g) setTimeout(() => mettiId(`op-${g.id}-${(g.scelte.find((s) => s.attiva) ?? g.scelte[0]).id}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pannello])

  /** il punto a schermo: mentre si cerca con ← →, quello scelto */
  const mostrato = meta ?? pos
  const punti = [0, ...capitoli.map((c) => c.da).filter((s) => s > 0 && s < durata), durata]
  const titoloSopra = trailer ? `Trailer · ${voce.trailer!.titolo}` : ep ? t?.SeriesName : t?.Name
  const sottotitolo = ep && t ? `${sigla(t)} · ${t.Name}` : null

  return (
    <div className="schermata" data-livello style={{ background: 'var(--bg-player)' }}>
      <video
        ref={video}
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onPause={() => setInPausa(true)}
        onPlay={() => setInPausa(false)}
        onWaiting={() => setCarica(true)}
        onPlaying={() => setCarica(false)}
        onCanPlay={() => setCarica(false)}
        onSeeking={() => setCarica(true)}
        onSeeked={() => setCarica(false)}
        onEnded={() => (prossimo.dati && !trailer ? vaiAlProssimo() : (fermaESalva(true), nav.indietro()))}
        onError={() => !hls.current && setNonRiproducibile(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: nonRiproducibile ? 0 : 1 }}
      >
        {urlSub && <track key={urlSub} kind="subtitles" src={urlSub} default />}
      </video>

      {carica && !nonRiproducibile && <div className="caricamento-video" role="status" aria-label="Caricamento" />}

      {!nonRiproducibile && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: comandi ? 1 : 0,
            transition: 'opacity 300ms',
            background: fila || pannello ? 'linear-gradient(to bottom, var(--scrim), transparent 22%, transparent 35%, var(--scrim) 55%, var(--bg-player))' : 'linear-gradient(to bottom, var(--scrim), transparent 22%, transparent 70%, var(--scrim))',
          }}
        >
          <div style={{ position: 'absolute', left: 96, top: 64, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="t-titolo-riga">{titoloSopra}</div>
            {sottotitolo && <div className="t-meta c-2">{sottotitolo}</div>}
          </div>

          {fila && (
            <div data-g="capitoli" data-xscroll="96" style={{ position: 'absolute', left: 0, right: 0, bottom: 260, display: 'flex', gap: 'var(--rail-gap)', padding: '24px 96px', overflow: 'hidden' }}>
              {capitoli.map((c, k) => (
                <Card
                  key={c.i}
                  fid={`cap-${k}`}
                  formato="episodio"
                  img={c.img}
                  titolo={c.nome}
                  meta={tempo(c.da)}
                  onOk={() => {
                    vaiA(c.da)
                    chiudiFila()
                  }}
                />
              ))}
            </div>
          )}

          {pannello && (
            <div style={{ position: 'absolute', left: 96, right: 96, bottom: 268, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {(pannello === 'sottotitoli' ? [{ id: 'sottotitoli', nome: 'Sottotitoli', scelte: sceltaSottotitoli }] : gruppi).map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  <div className="t-meta c-2" style={{ width: 160, flex: 'none' }}>
                    {g.nome}
                  </div>
                  {g.scelte.length === 0 && <span className="t-meta c-3">Nessuna traccia disponibile.</span>}
                  <div data-g={`op-${g.id}`} data-xscroll="0" style={{ display: 'flex', gap: 12, overflow: 'hidden', padding: 8, margin: -8 }}>
                    {g.scelte.map((s) => (
                      <Scelta
                        key={s.id}
                        fid={`op-${g.id}-${s.id}`}
                        testo={s.testo}
                        selezionata={s.attiva}
                        onOk={() => {
                          s.ok()
                          if (pannello === 'sottotitoli') chiudi()
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div data-g="pl-tasti" style={{ position: 'absolute', left: 96, bottom: 152, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Pulsante fid="pl-pausa" tipo="icona" chiaro classe="tasto-player--grande" icona={inPausa ? 'play' : 'pausa'} etichetta={inPausa ? 'Riproduci' : 'Pausa'} onOk={() => pausa(!inPausa)} />
            {prossimo.dati && <Pulsante fid="pl-prossimo" tipo="icona" classe="tasto-player--piccolo" icona="prossimo" etichetta="Episodio successivo" onOk={vaiAlProssimo} />}
            {!trailer && <Pulsante fid="pl-sottotitoli" tipo="icona" classe="tasto-player--piccolo" icona="sottotitoli" etichetta="Sottotitoli" onOk={() => apri('sottotitoli')} />}
            {!trailer && <Pulsante fid="pl-impostazioni" tipo="icona" classe="tasto-player--piccolo" icona="impostazioni" etichetta="Impostazioni" onOk={() => apri('impostazioni')} />}
          </div>
          <div style={{ position: 'absolute', left: 96, right: 96, bottom: 96 }}>
            {meta !== null && t && <Anteprima t={t} sec={meta} durata={durata} />}
            <button data-f="pl-barra" className="anello" aria-label="Posizione" style={{ width: '100%', height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              {punti.slice(0, -1).map((da, i) => {
                const a = punti[i + 1]
                return <Avanzamento key={i} valore={(mostrato - da) / Math.max(1, a - da)} stile={{ flex: a - da, background: 'var(--track)' }} />
              })}
            </button>
            <div className="t-meta" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 12px)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-on-image)' }}>
              <span>{tempo(mostrato)}</span>
              <span>−{tempo(durata - mostrato)}</span>
            </div>
          </div>
        </div>
      )}

      {titoliDiCoda && prossimo.dati && <ProssimoEpisodio e={prossimo.dati} conto={conto} onGuarda={vaiAlProssimo} onChiudi={() => setProssimoChiuso(true)} />}

      {nonRiproducibile && (
        <Finestra
          titolo="Questo titolo non si può riprodurre"
          testo={qualita === 'originale' ? 'Il file usa un formato che questo dispositivo non legge e la qualità è su Originale, senza conversione.' : 'Il file usa un formato che questo dispositivo non legge. Puoi provare a convertirlo mentre lo guardi.'}
          onChiudi={() => nav.indietro()}
        >
          <NonRiproducibileAzioni
            onProva={() => {
              if (qualita === 'originale') setQualita('auto')
              else setForza(true)
              setGiro((g) => g + 1)
            }}
            onTorna={() => nav.indietro()}
          />
        </Finestra>
      )}
    </div>
  )
}

/** Il riquadro sopra la barra mentre si cerca: il fotogramma di quel punto (le immagini «trickplay»
 *  di Jellyfin, se il server le ha preparate) e il tempo. */
function Anteprima({ t, sec, durata }: { t: BaseItemDto; sec: number; durata: number }) {
  const LARGA = 320
  const [mediaId, misure] = Object.entries(t.Trickplay ?? {})[0] ?? []
  // la misura più vicina al riquadro
  const info = Object.values(misure ?? {}).sort((a, b) => Math.abs((a.Width ?? 0) - LARGA) - Math.abs((b.Width ?? 0) - LARGA))[0]
  let quadro = null
  if (info?.Width && info.Height && info.TileWidth && info.TileHeight && info.Interval) {
    // le immagini sono tessere: ogni file ne ha TileWidth × TileHeight, una ogni Interval ms
    const i = Math.min(Math.floor((sec * 1000) / info.Interval), (info.ThumbnailCount ?? 1) - 1)
    const perFile = info.TileWidth * info.TileHeight
    const k = i % perFile
    const alta = (info.Height * LARGA) / info.Width
    quadro = (
      <div
        style={{
          width: LARGA,
          height: alta,
          borderRadius: 'var(--r-card)',
          backgroundColor: 'var(--surface-art)',
          backgroundImage: `url(${BASE}/Videos/${t.Id}/Trickplay/${info.Width}/${Math.floor(i / perFile)}.jpg?mediaSourceId=${mediaId})`,
          backgroundSize: `${info.TileWidth * LARGA}px auto`,
          backgroundPosition: `-${(k % info.TileWidth) * LARGA}px -${Math.floor(k / info.TileWidth) * alta}px`,
        }}
      />
    )
  }
  const x = durata ? (sec / durata) * 100 : 0
  return (
    <div style={{ position: 'absolute', bottom: 'calc(100% + 16px)', left: `clamp(${LARGA / 2}px, ${x}%, calc(100% - ${LARGA / 2}px))`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
      {quadro}
      <div className="t-meta" style={{ color: 'var(--text-on-image)' }}>{tempo(sec)}</div>
    </div>
  )
}

function ProssimoEpisodio({ e, conto, onGuarda, onChiudi }: { e: BaseItemDto; conto: number; onGuarda: () => void; onChiudi: () => void }) {
  useTasti((t) => (t === 'indietro' ? (onChiudi(), true) : false))
  const img = orizzontale(e)
  return (
    <div data-livello style={{ position: 'absolute', right: 96, bottom: 72, width: 520, padding: 24, borderRadius: 'var(--r-finestra)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="t-occhiello c-2">Prossimo episodio · tra {Math.max(0, conto)} s</div>
      <div style={{ aspectRatio: '16 / 9', borderRadius: 'var(--r-card)', background: 'var(--surface-art)', overflow: 'hidden' }}>{img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
      <div className="t-card-titolo">
        {sigla(e)} · {e.Name}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <Pulsante fid="pr-guarda" tipo="principale" onOk={onGuarda}>Guarda ora</Pulsante>
        <Pulsante fid="pr-coda" onOk={onChiudi}>Titoli di coda</Pulsante>
      </div>
    </div>
  )
}

function NonRiproducibileAzioni({ onProva, onTorna }: { onProva: () => void; onTorna: () => void }) {
  useFuocoIniziale('nr-prova')
  return (
    <div className="finestra__azioni">
      <Pulsante fid="nr-prova" tipo="principale" onOk={onProva}>Prova la transcodifica</Pulsante>
      <Pulsante fid="nr-torna" onOk={onTorna}>Torna alla scheda</Pulsante>
    </div>
  )
}
