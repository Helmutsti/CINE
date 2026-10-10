/*
 * SC-13 Player · SC-14 opzioni · SC-15 Prossimo episodio (schema E).
 * Il video è sempre lo stesso corto (Caminandes, Blender Foundation, CC BY) che gira in loop:
 * tempi e barra seguono invece la durata finta del titolo.
 */
import { useEffect, useRef, useState } from 'react'
import { Avanzamento, Finestra, Pulsante, Scelta } from '../componenti'
import { NON_RIPRODUCIBILE, episodioDopo, sigla, titolo as cercaTitolo, trovaEpisodio } from '../dati'
import { corrente, mettiId } from '../fuoco'
import { useFuocoIniziale, useNav, useTasti, type Voce } from '../nav'
import { useStato } from '../stato'

const OPZIONI = {
  sottotitoli: { nome: 'Sottotitoli', scelte: ['Nessuno', 'Italiano', 'Inglese', 'Italiano · non udenti'] },
  audio: { nome: 'Audio', scelte: ['Italiano · 5.1', 'Inglese · 5.1', 'Italiano · audiodescrizione'] },
  velocita: { nome: 'Velocità', scelte: ['0,5×', '0,75×', 'Normale', '1,25×', '1,5×', '2×'] },
  transcodifica: { nome: 'Transcodifica', scelte: ['Automatica', 'Spenta', 'Sempre'] },
} as const
type Scheda = keyof typeof OPZIONI
const VELOCITA = [0.5, 0.75, 1, 1.25, 1.5, 2]
const CAPITOLI = 6

function tempo(s: number) {
  s = Math.max(0, Math.round(s))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export function Player({ voce }: { voce: Extract<Voce, { s: 'player' }> }) {
  const nav = useNav()
  const { dati, azioni } = useStato()
  const t = cercaTitolo(voce.id)!
  const ep = voce.episodio ? trovaEpisodio(voce.episodio) : null
  const prossimo = ep ? episodioDopo(ep.episodio.id) : null
  const idPunto = ep?.episodio.id ?? t.id
  const video = useRef<HTMLVideoElement>(null)

  const [durataVideo, setDurataVideo] = useState(90)
  const durata = voce.trailer ? durataVideo : (ep ? ep.episodio.minuti : t.tipo === 'film' ? t.minuti ?? 90 : 50) * 60
  const salvato = dati.avanzamenti[t.id]
  const [pos, setPos] = useState(() => (voce.daCapo || voce.trailer || salvato?.id !== idPunto ? 0 : salvato.pos))
  const [inPausa, setInPausa] = useState(false)
  const [comandi, setComandi] = useState(true)
  const [pannello, setPannello] = useState(false)
  const [scheda, setScheda] = useState<Scheda>('sottotitoli')
  const [scelte, setScelte] = useState<Record<Scheda, number>>({
    sottotitoli: 1,
    audio: 0,
    velocita: 2,
    transcodifica: voce.transcodifica ? 2 : 0,
  })
  const [prossimoChiuso, setProssimoChiuso] = useState(false)
  const nonRiproducibile = t.id === NON_RIPRODUCIBILE && scelte.transcodifica === 0 && !voce.trailer
  const timer = useRef<number>(0)
  const posRef = useRef(pos)
  posRef.current = pos

  const titoloSopra = voce.trailer ? `Trailer · ${t.titolo}` : t.titolo
  const sottotitolo = ep ? `${sigla(ep.episodio.id)} · ${ep.episodio.titolo}` : null

  // i comandi spariscono dopo 4 s senza tasti premuti
  const mostra = () => {
    setComandi(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (!pannelloRef.current) setComandi(false)
    }, 4000)
  }
  const pannelloRef = useRef(pannello)
  pannelloRef.current = pannello
  useEffect(() => {
    mostra()
    return () => clearTimeout(timer.current)
  }, [])

  // orologio finto
  const velocita = VELOCITA[scelte.velocita]
  useEffect(() => {
    if (inPausa || nonRiproducibile) return
    const i = setInterval(() => setPos((p) => Math.min(durata, p + 0.25 * velocita)), 250)
    return () => clearInterval(i)
  }, [inPausa, velocita, durata, nonRiproducibile])

  useEffect(() => {
    const v = video.current
    if (!v) return
    v.playbackRate = velocita
    if (inPausa || nonRiproducibile) v.pause()
    else v.play().catch(() => {})
  }, [inPausa, velocita, nonRiproducibile])

  const salta = (sec: number) => {
    const nuovo = Math.max(0, Math.min(durata - 1, posRef.current + sec))
    setPos(nuovo)
    const v = video.current
    if (v && v.duration) v.currentTime = nuovo % v.duration
  }

  const esci = () => {
    if (!voce.trailer) azioni.salvaPunto(t.id, idPunto, posRef.current, durata)
    nav.indietro()
  }
  const vaiAlProssimo = () => {
    if (!prossimo) return
    azioni.salvaPunto(t.id, idPunto, durata, durata)
    nav.sostituisci({ s: 'player', id: t.id, episodio: prossimo.id })
  }

  // fine del titolo
  useEffect(() => {
    if (pos < durata) return
    if (voce.trailer || !prossimo) esci()
    else vaiAlProssimo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos >= durata])

  // SC-15: sui titoli di coda (ultimi 45 s) compare il prossimo episodio, con 10 s di conto alla rovescia
  const titoliDiCoda = !!prossimo && !voce.trailer && durata - pos <= 45 && !prossimoChiuso
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
  // chiusa la finestra o il riquadro, il fuoco torna su Pausa
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
      if (tasto === 'ok') setInPausa((p) => !p)
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
    if (tasto === 'giu' && f !== 'pl-barra') {
      setPannello(true)
      setTimeout(() => mettiId('tab-' + scheda))
      return true
    }
    return false
  })

  const fatto = pos / durata
  const sceltaAttuale = (k: Scheda) => OPZIONI[k].scelte[scelte[k]]

  return (
    <div className="schermata" data-livello style={{ background: 'var(--bg-player)' }}>
      <video
        ref={video}
        src="media/video.mp4"
        autoPlay
        loop
        playsInline
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          setDurataVideo(Math.round(v.duration))
          v.currentTime = posRef.current % v.duration
        }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: nonRiproducibile ? 0 : 1 }}
      />

      {/* sottotitoli finti, per vedere l'effetto della scelta */}
      {scelte.sottotitoli > 0 && !nonRiproducibile && !pannello && (
        <div className="t-titolo-riga" style={{ position: 'absolute', left: 0, right: 0, bottom: comandi ? 260 : 96, textAlign: 'center', textShadow: '0 2px 8px #000', transition: 'bottom 150ms' }}>
          {scelte.sottotitoli === 2 ? '— Where did the grass go?' : scelte.sottotitoli === 3 ? '[vento] — Dov’è finita l’erba?' : '— Dov’è finita l’erba?'}
        </div>
      )}

      {/* comandi */}
      {!nonRiproducibile && !pannello && (
        <div style={{ position: 'absolute', inset: 0, opacity: comandi ? 1 : 0, transition: 'opacity 300ms', background: 'linear-gradient(to bottom, var(--scrim), transparent 22%, transparent 70%, var(--scrim))' }}>
          <div style={{ position: 'absolute', left: 96, top: 64, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="t-titolo-riga">{titoloSopra}</div>
            {sottotitolo && <div className="t-meta c-2">{sottotitolo}</div>}
          </div>
          <div style={{ position: 'absolute', left: 96, right: 96, bottom: 72, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button data-f="pl-barra" className="anello" aria-label="Posizione" style={{ position: 'relative', height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              {Array.from({ length: CAPITOLI }, (_, i) => {
                const da = i / CAPITOLI
                return <Avanzamento key={i} valore={(fatto - da) * CAPITOLI} stile={{ flex: 1, background: 'var(--track)' }} />
              })}
            </button>
            <div className="t-meta" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-on-image)' }}>
              <span>{tempo(pos)}</span>
              <span>−{tempo(durata - pos)}</span>
            </div>
            <div style={{ position: 'relative', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 8 }}>
              <div className="t-meta" style={{ position: 'absolute', left: 0, color: 'var(--text-on-image)' }}>
                ↓ Sottotitoli · Audio · Velocità · Transcodifica
              </div>
              <Pulsante fid="pl-indietro" onOk={() => salta(-10)}>− 10 s</Pulsante>
              <Pulsante fid="pl-pausa" tipo="icona" chiaro icona={inPausa ? 'play' : 'pausa'} etichetta={inPausa ? 'Riproduci' : 'Pausa'} onOk={() => setInPausa((p) => !p)} />
              <Pulsante fid="pl-avanti" onOk={() => salta(10)}>+ 10 s</Pulsante>
              {prossimo && (
                <div style={{ position: 'absolute', right: 0 }}>
                  <Pulsante fid="pl-successivo" onOk={vaiAlProssimo}>Episodio successivo</Pulsante>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SC-14 opzioni */}
      {pannello && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, var(--scrim) 55%, var(--bg-player))' }}>
          <div style={{ position: 'absolute', left: 96, right: 96, bottom: 120, display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div className="t-meta c-2">{[t.titolo, ep && sigla(ep.episodio.id)].filter(Boolean).join(' · ')}</div>
            <div style={{ display: 'flex', gap: 16 }} data-g="tab">
              {(Object.keys(OPZIONI) as Scheda[]).map((k) => (
                <button
                  key={k}
                  data-f={'tab-' + k}
                  data-fpref={k === scheda ? '' : undefined}
                  className={`voce-tab t-pulsante ${k === scheda ? 'voce-tab--attiva' : ''}`}
                  onFocus={() => setScheda(k)}
                  onClick={() => mettiId(`op-${k}-${scelte[k]}`)}
                >
                  {OPZIONI[k].nome}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} data-g={'scelte-' + scheda}>
              {OPZIONI[scheda].scelte.map((s, i) => (
                <Scelta key={s} fid={`op-${scheda}-${i}`} testo={s} selezionata={scelte[scheda] === i} pref={scelte[scheda] === i} onOk={() => setScelte((x) => ({ ...x, [scheda]: i }))} />
              ))}
            </div>
            {scheda === 'transcodifica' && (
              <div className="t-meta c-2">
                Adesso:{' '}
                {scelte.transcodifica === 2
                  ? 'conversione attiva · video H.264 1080p, audio AAC stereo'
                  : 'riproduzione diretta · il file arriva così com’è, nessuna conversione'}
              </div>
            )}
            {scheda !== 'transcodifica' && <div className="t-meta c-3">Scelta attuale: {sceltaAttuale(scheda)}</div>}
          </div>
        </div>
      )}

      {/* SC-15 Prossimo episodio */}
      {titoliDiCoda && prossimo && (
        <div data-livello style={{ position: 'absolute', right: 96, bottom: 72, width: 520, padding: 24, borderRadius: 'var(--r-finestra)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="t-occhiello c-2">Prossimo episodio · tra {Math.max(0, conto)} s</div>
          <div style={{ aspectRatio: '16 / 9', borderRadius: 'var(--r-card)', background: 'var(--surface-art)', overflow: 'hidden' }}>
            {prossimo.img && <img src={prossimo.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div className="t-card-titolo">{sigla(prossimo.id)} · {prossimo.titolo}</div>
          <div className="t-meta-card c-3">{prossimo.minuti} min</div>
          <ProssimoAzioni onGuarda={vaiAlProssimo} onChiudi={() => setProssimoChiuso(true)} />
        </div>
      )}

      {/* titolo non riproducibile */}
      {nonRiproducibile && (
        <Finestra titolo="Questo titolo non si può riprodurre" testo="Il file usa un formato che questo dispositivo non legge. Puoi provare a convertirlo mentre lo guardi." onChiudi={() => nav.indietro()}>
          <NonRiproducibileAzioni onProva={() => setScelte((x) => ({ ...x, transcodifica: 2 }))} onTorna={() => nav.indietro()} />
        </Finestra>
      )}
    </div>
  )
}

function ProssimoAzioni({ onGuarda, onChiudi }: { onGuarda: () => void; onChiudi: () => void }) {
  useTasti((t) => {
    if (t === 'indietro') return onChiudi(), true
  })
  return (
    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
      <Pulsante fid="pr-guarda" tipo="principale" onOk={onGuarda}>Guarda ora</Pulsante>
      <Pulsante fid="pr-coda" onOk={onChiudi}>Titoli di coda</Pulsante>
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
