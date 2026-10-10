/*
 * Collegamento al server Jellyfin.
 *
 * Il browser non parla mai direttamente con Jellyfin: tutte le richieste vanno a /jf/ sullo stesso
 * indirizzo del client. Il contenitore Docker (nginx) le inoltra al server indicato da JELLYFIN_URL
 * e aggiunge lui la chiave API (JELLYFIN_API_KEY): la chiave non arriva mai al browser e non ci sono
 * problemi di indirizzi diversi (CORS). In sviluppo fa lo stesso il server di Vite (vite.config.ts).
 *
 * Senza login, i dati del profilo (avanzamento, La mia lista) si leggono e si scrivono indicando
 * sempre l'utente Jellyfin scelto in "Chi guarda?" (userId).
 */
import { Jellyfin } from '@jellyfin/sdk'
import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models'
import { useEffect, useRef, useState } from 'react'

export const BASE = '/jf'

function idDispositivo() {
  try {
    let id = localStorage.getItem('cineteca-dispositivo')
    if (!id) {
      id = 'cineteca-' + Math.random().toString(36).slice(2, 10)
      localStorage.setItem('cineteca-dispositivo', id)
    }
    return id
  } catch {
    return 'cineteca-web'
  }
}

export const DISPOSITIVO = idDispositivo()

const jellyfin = new Jellyfin({
  clientInfo: { name: 'Cineteca', version: __VERSIONE__ },
  deviceInfo: { name: 'Cineteca web', id: DISPOSITIVO },
})

/** L'istanza delle API: l'autorizzazione la aggiunge il ponte, qui serve solo il percorso. */
export const api = jellyfin.createApi(location.origin + BASE)
// il ponte usa questo valore come DeviceId: ogni browser ha le sue sessioni di riproduzione
api.axiosInstance.defaults.headers.common['X-Cineteca-Device'] = DISPOSITIVO

// ---------- immagini ----------
type TipoImmagine = 'Primary' | 'Backdrop' | 'Thumb' | 'Logo'

export function immagine(id: string | null | undefined, tipo: TipoImmagine, larghezza: number, tag?: string | null) {
  if (!id) return null
  const q = new URLSearchParams({ fillWidth: String(larghezza), quality: '90' })
  if (tag) q.set('tag', tag)
  return `${BASE}/Items/${id}/Images/${tipo}?${q}`
}

/** Immagine orizzontale grande (sfondo a tutto schermo, card 16:9). */
export function sfondo(t: BaseItemDto, larghezza = 1920): string | null {
  if (t.BackdropImageTags?.length) return immagine(t.Id, 'Backdrop', larghezza, t.BackdropImageTags[0])
  if (t.ParentBackdropItemId && t.ParentBackdropImageTags?.length)
    return immagine(t.ParentBackdropItemId, 'Backdrop', larghezza, t.ParentBackdropImageTags[0])
  if (t.ImageTags?.Thumb) return immagine(t.Id, 'Thumb', larghezza, t.ImageTags.Thumb)
  return null
}

/** Immagine di una card 16:9: per gli episodi il loro fotogramma, per il resto lo sfondo. */
export function orizzontale(t: BaseItemDto, larghezza = 640): string | null {
  if (t.Type === 'Episode' && t.ImageTags?.Primary) return immagine(t.Id, 'Primary', larghezza, t.ImageTags.Primary)
  return sfondo(t, larghezza) ?? locandina(t, larghezza)
}

/** Locandina verticale 2:3. */
export function locandina(t: BaseItemDto, larghezza = 480): string | null {
  if (t.Type === 'Episode' && t.SeriesId && t.SeriesPrimaryImageTag)
    return immagine(t.SeriesId, 'Primary', larghezza, t.SeriesPrimaryImageTag)
  if (t.ImageTags?.Primary) return immagine(t.Id, 'Primary', larghezza, t.ImageTags.Primary)
  return null
}

export function fotoPersona(id: string | null | undefined, tag?: string | null) {
  return tag ? immagine(id, 'Primary', 360, tag) : null
}

export function fotoUtente(id: string | null | undefined, tag?: string | null) {
  return id && tag ? `${BASE}/Users/${id}/Images/Primary?fillWidth=200&quality=90&tag=${tag}` : null
}

// ---------- tempi ----------
export const TICK = 10_000_000
export const secondi = (ticks?: number | null) => (ticks ?? 0) / TICK
export const minuti = (t: BaseItemDto) => Math.round(secondi(t.RunTimeTicks) / 60)

// ---------- dati tecnici (etichette della scheda) ----------
const LINGUE: Record<string, string> = { ita: 'ITA', eng: 'ENG', fre: 'FRA', fra: 'FRA', spa: 'ESP', ger: 'DEU', deu: 'DEU', jpn: 'JPN', por: 'POR' }

export function tecnici(t: BaseItemDto): string[] {
  const flussi: MediaStream[] = t.MediaSources?.[0]?.MediaStreams ?? t.MediaStreams ?? []
  const video = flussi.find((s) => s.Type === 'Video')
  const audio = flussi.filter((s) => s.Type === 'Audio')
  const sub = flussi.filter((s) => s.Type === 'Subtitle')
  const out: string[] = []
  if (video?.Width) out.push(video.Width >= 3800 ? '4K' : video.Width >= 1900 ? 'Full HD' : video.Width >= 1200 ? 'HD' : 'SD')
  if (video?.VideoRange && video.VideoRange !== 'SDR' && video.VideoRange !== 'Unknown') out.push(video.VideoRangeType === 'DOVI' ? 'Dolby Vision' : 'HDR')
  const canali = Math.max(0, ...audio.map((a) => a.Channels ?? 0))
  if (canali >= 8) out.push('7.1')
  else if (canali >= 6) out.push('5.1')
  else if (canali === 2) out.push('Stereo')
  const lingue = [...new Set(sub.map((s) => LINGUE[s.Language ?? ''] ?? s.Language?.toUpperCase()).filter(Boolean))]
  if (lingue.length) out.push('Sottotitoli ' + lingue.slice(0, 4).join(' '))
  return out
}

// ---------- caricamento con cache ----------
const cache = new Map<string, unknown>()

/** Dimentica i dati in cache (tutti, o quelli che iniziano con un prefisso). */
export function dimentica(prefisso = '') {
  for (const k of [...cache.keys()]) if (k.startsWith(prefisso)) cache.delete(k)
}

/**
 * Carica dati dal server una volta per chiave e li tiene in memoria:
 * tornando indietro le schermate si riaprono subito.
 */
export function useCarica<T>(chiave: string | null, carica: () => Promise<T>) {
  const [stato, setStato] = useState<{ chiave: string | null; dati?: T; errore?: unknown }>(() => ({
    chiave,
    dati: chiave && cache.has(chiave) ? (cache.get(chiave) as T) : undefined,
  }))
  const fn = useRef(carica)
  fn.current = carica
  const [giro, setGiro] = useState(0)
  useEffect(() => {
    if (!chiave) return
    if (cache.has(chiave) && giro === 0) {
      setStato({ chiave, dati: cache.get(chiave) as T })
      return
    }
    let vivo = true
    fn
      .current()
      .then((d) => {
        cache.set(chiave, d)
        if (vivo) setStato({ chiave, dati: d })
      })
      .catch((e) => vivo && setStato({ chiave, errore: e }))
    return () => {
      vivo = false
    }
  }, [chiave, giro])
  const attuale = stato.chiave === chiave ? stato : { chiave, dati: chiave && cache.has(chiave) ? (cache.get(chiave) as T) : undefined }
  return {
    dati: attuale.dati,
    errore: 'errore' in attuale ? attuale.errore : undefined,
    pronto: attuale.dati !== undefined,
    ricarica: () => {
      if (chiave) cache.delete(chiave)
      setGiro((g) => g + 1)
    },
  }
}
