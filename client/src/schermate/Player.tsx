/*
 * SC-13 Player · SC-14 opzioni · SC-15 Prossimo episodio (schema E), con i video del server Jellyfin.
 * Il punto raggiunto si salva sul profilo Jellyfin ogni 10 secondi e all'uscita.
 */
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api'
import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models'
import { Avanzamento, Finestra, Pulsante, Scelta } from '../componenti'
import { api, dimentica, orizzontale, secondi, TICK, useCarica } from '../jf'
import { corrente, mettiId } from '../fuoco'
import { useFuocoIniziale, useNav, useTasti, type Voce } from '../nav'
import { useStato } from '../stato'
import { chiediSorgente, urlSottotitoli, type Conversione, type Sorgente } from '../riproduzione'
import { sigla } from './comune'

const VELOCITA = [0.5, 0.75, 1, 1.25, 1.5, 2]
const NOMI_VELOCITA = ['0,5×', '0,75×', 'Normale', '1,25×', '1,5×', '2×']
const CONVERSIONI: { id: Conversione; testo: string }[] = [
  { id: 'auto', testo: 'Automatica' },
  { id: 'mai', testo: 'Spenta' },
  { id: 'sempre', testo: 'Sempre' },
]
type Scheda = 'sottotitoli' | 'audio' | 'velocita' | 'transcodifica'
const SCHEDE: { id: Scheda; nome: string }[] = [
  { id: 'sottotitoli', nome: 'Sottotitoli' },
  { id: 'audio', nome: 'Audio' },
  { id: 'velocita', nome: 'Velocità' },
  { id: 'transcodifica', nome: 'Transcodifica' },
]

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
  const [pannello, setPannello] = useState(false)
  const [scheda, setScheda] = useState<Scheda>('sottotitoli')
  const [velocita, setVelocita] = useState(2)
  const [conversione, setConversione] = useState<Conversione>('auto')
  const [audio, setAudio] = useState<number | undefined>(undefined)
  const [sotto, setSotto] = useState<number>(-1)
  const [sorgente, setSorgente] = useState<Sorgente | null>(null)
  const [nonRiproducibile, setNonRiproducibile] = useState(false)
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
  const pannelloRef = useRef(pannello)
  pannelloRef.current = pannello

  // ---------- apre lo stream (e lo riapre quando cambiano audio, sottotitoli impressi o conversione) ----------
  const inizio = useRef<number | null>(null)
  if (inizio.current === null && t) inizio.current = voce.daCapo || trailer ? 0 : secondi(t.UserData?.PlaybackPositionTicks)
  const [giro, setGiro] = useState(0)
  useEffect(() => {
    if (!t) return
    let vivo = true
    const da = giro === 0 ? inizio.current ?? 0 : posizione()
    const sottoImpresso = sotto >= 0 && t.MediaStreams?.find((s) => s.Index === sotto)?.IsTextSubtitleStream === false ? sotto : undefined
    setNonRiproducibile(false)
    chiediSorgente({ itemId: voce.id, uid, inizio: da, audio, sottotitoli: sottoImpresso, conversione })
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
  }, [t?.Id, giro, audio, conversione])

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
    const chiudi = sorgente
      ? getSessionApi(api)
          .reportPlaybackStopped({ playbackStopInfo: { ItemId: voce.id, MediaSourceId: sorgente.media.Id, PlaySessionId: sorgente.playSessionId, PositionTicks: Math.round(p * TICK) } })
          .catch(() => {})
      : Promise.resolve()
    chiudi.finally(() => salva(fine, p))
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
    timer.current = window.setTimeout(() => !pannelloRef.current && setComandi(false), 4000)
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
  const salta = (sec: number) => {
    const v = video.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min((durata || v.duration) - 1, v.currentTime + sec))
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

  useTasti((tasto, e) => {
    if (nonRiproducibile || titoliDiCoda) return false
    if (pannello) {
      const suTab = corrente()?.dataset.f?.startsWith('tab-')
      if (tasto === 'indietro' || (tasto === 'su' && suTab)) {
        setPannello(false)
        mostra()
        setTimeout(() => mettiId('pl-pausa'))
        return true
      }
      return false
    }
    const eraNascosto = !comandi
    mostra()
    if (eraNascosto) {
      if (tasto === 'ok') pausa(!inPausa)
      if (tasto === 'sinistra' || tasto === 'destra') salta((tasto === 'destra' ? 1 : -1) * (e.repeat ? 30 : 10))
      if (tasto === 'indietro') return esci(), true
      setTimeout(() => mettiId('pl-pausa'))
      return true
    }
    if (tasto === 'indietro') return esci(), true
    const f = corrente()?.dataset.f
    if (f === 'pl-barra' && (tasto === 'sinistra' || tasto === 'destra')) {
      salta((tasto === 'destra' ? 1 : -1) * durata * (e.repeat ? 0.04 : 0.02))
      return true
    }
    if (tasto === 'giu' && f !== 'pl-barra' && !trailer) {
      setPannello(true)
      setTimeout(() => mettiId('tab-' + scheda))
      return true
    }
    return false
  })

  // ---------- opzioni ----------
  const flussi = sorgente?.media.MediaStreams ?? t?.MediaStreams ?? []
  const subs = flussi.filter((s) => s.Type === 'Subtitle')
  const audios = flussi.filter((s) => s.Type === 'Audio')
  const audioAttivo = audio ?? sorgente?.media.DefaultAudioStreamIndex ?? audios[0]?.Index
  const scelte: Record<Scheda, { id: string; testo: string; attiva: boolean; ok: () => void }[]> = {
    sottotitoli: [{ id: '-1', testo: 'Nessuno', attiva: sotto < 0, ok: () => cambiaSottotitoli(-1) }, ...subs.map((s) => ({ id: String(s.Index), testo: lingua(s), attiva: sotto === s.Index, ok: () => cambiaSottotitoli(s.Index!) }))],
    audio: audios.map((s) => ({ id: String(s.Index), testo: lingua(s), attiva: audioAttivo === s.Index, ok: () => setAudio(s.Index!) })),
    velocita: NOMI_VELOCITA.map((n, i) => ({ id: String(i), testo: n, attiva: velocita === i, ok: () => setVelocita(i) })),
    transcodifica: CONVERSIONI.map((c) => ({ id: c.id, testo: c.testo, attiva: conversione === c.id, ok: () => setConversione(c.id) })),
  }

  const capitoli = (t?.Chapters ?? []).map((c) => secondi(c.StartPositionTicks)).filter((s) => s > 0 && s < durata)
  const punti = [0, ...capitoli, durata]
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
        onEnded={() => (prossimo.dati && !trailer ? vaiAlProssimo() : (fermaESalva(true), nav.indietro()))}
        onError={() => !hls.current && setNonRiproducibile(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: nonRiproducibile ? 0 : 1 }}
      >
        {urlSub && <track key={urlSub} kind="subtitles" src={urlSub} default />}
      </video>

      {!nonRiproducibile && !pannello && (
        <div style={{ position: 'absolute', inset: 0, opacity: comandi ? 1 : 0, transition: 'opacity 300ms', background: 'linear-gradient(to bottom, var(--scrim), transparent 22%, transparent 70%, var(--scrim))' }}>
          <div style={{ position: 'absolute', left: 96, top: 64, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="t-titolo-riga">{titoloSopra}</div>
            {sottotitolo && <div className="t-meta c-2">{sottotitolo}</div>}
          </div>
          <div style={{ position: 'absolute', left: 96, right: 96, bottom: 72, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button data-f="pl-barra" className="anello" aria-label="Posizione" style={{ position: 'relative', height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              {punti.slice(0, -1).map((da, i) => {
                const a = punti[i + 1]
                return <Avanzamento key={i} valore={(pos - da) / Math.max(1, a - da)} stile={{ flex: a - da, background: 'var(--track)' }} />
              })}
            </button>
            <div className="t-meta" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-on-image)' }}>
              <span>{tempo(pos)}</span>
              <span>−{tempo(durata - pos)}</span>
            </div>
            <div style={{ position: 'relative', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 8 }}>
              {!trailer && (
                <div className="t-meta" style={{ position: 'absolute', left: 0, color: 'var(--text-on-image)' }}>
                  ↓ Sottotitoli · Audio · Velocità · Transcodifica
                </div>
              )}
              <Pulsante fid="pl-indietro" onOk={() => salta(-10)}>− 10 s</Pulsante>
              <Pulsante fid="pl-pausa" tipo="icona" chiaro icona={inPausa ? 'play' : 'pausa'} etichetta={inPausa ? 'Riproduci' : 'Pausa'} onOk={() => pausa(!inPausa)} />
              <Pulsante fid="pl-avanti" onOk={() => salta(10)}>+ 10 s</Pulsante>
              {prossimo.dati && (
                <div style={{ position: 'absolute', right: 0 }}>
                  <Pulsante fid="pl-successivo" onOk={vaiAlProssimo}>Episodio successivo</Pulsante>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pannello && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, var(--scrim) 55%, var(--bg-player))' }}>
          <div style={{ position: 'absolute', left: 96, right: 96, bottom: 120, display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div className="t-meta c-2">{[titoloSopra, sottotitolo].filter(Boolean).join(' · ')}</div>
            <div style={{ display: 'flex', gap: 16 }} data-g="tab">
              {SCHEDE.map((k) => (
                <button
                  key={k.id}
                  data-f={'tab-' + k.id}
                  data-fpref={k.id === scheda ? '' : undefined}
                  className={`voce-tab t-pulsante ${k.id === scheda ? 'voce-tab--attiva' : ''}`}
                  onFocus={() => setScheda(k.id)}
                  onClick={() => mettiId(`op-${k.id}-${scelte[k.id].find((s) => s.attiva)?.id ?? scelte[k.id][0]?.id}`)}
                >
                  {k.nome}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} data-g={'scelte-' + scheda}>
              {scelte[scheda].length === 0 && <span className="t-meta c-2">Nessuna traccia disponibile.</span>}
              {scelte[scheda].map((s) => (
                <Scelta key={s.id} fid={`op-${scheda}-${s.id}`} testo={s.testo} selezionata={s.attiva} pref={s.attiva} onOk={s.ok} />
              ))}
            </div>
            {scheda === 'transcodifica' && sorgente && <div className="t-meta c-2">Adesso: {sorgente.modo === 'diretta' ? 'riproduzione diretta' : sorgente.modo === 'parziale' ? 'conversione leggera' : 'conversione completa'} · {sorgente.dettaglio}</div>}
          </div>
        </div>
      )}

      {titoliDiCoda && prossimo.dati && <ProssimoEpisodio e={prossimo.dati} conto={conto} onGuarda={vaiAlProssimo} onChiudi={() => setProssimoChiuso(true)} />}

      {nonRiproducibile && (
        <Finestra
          titolo="Questo titolo non si può riprodurre"
          testo={conversione === 'mai' ? 'Il file usa un formato che questo dispositivo non legge e la transcodifica è spenta.' : 'Il file usa un formato che questo dispositivo non legge. Puoi provare a convertirlo mentre lo guardi.'}
          onChiudi={() => nav.indietro()}
        >
          <NonRiproducibileAzioni
            onProva={() => {
              setConversione('sempre')
              setGiro((g) => g + 1)
            }}
            onTorna={() => nav.indietro()}
          />
        </Finestra>
      )}
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
