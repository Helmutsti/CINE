/*
 * Riproduzione con Jellyfin: il browser dice cosa sa leggere (DeviceProfile) e il server sceglie
 * fra riproduzione diretta, conversione del solo contenitore/audio, o conversione completa (HLS).
 */
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api'
import type { DeviceProfile, MediaSourceInfo, PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'
import { api, BASE, DISPOSITIVO, TICK } from './jf'

export type Conversione = 'auto' | 'sempre' | 'mai'

/** Qualità scelta nel player: Automatica, Originale (niente conversione del video) o un'altezza massima. */
export type Qualita = 'auto' | 'originale' | 1080 | 720 | 480 | 360
export const ALTEZZE = [1080, 720, 480, 360] as const
/** bitrate massimo per ogni altezza, quando il server converte */
const BITRATE: Record<number, number> = { 1080: 12_000_000, 720: 6_000_000, 480: 3_000_000, 360: 1_500_000 }

function profilo(): DeviceProfile {
  const v = document.createElement('video')
  const puo = (t: string) => v.canPlayType(t) !== ''
  const hevc = puo('video/mp4; codecs="hvc1.1.6.L120.90"') || puo('video/mp4; codecs="hev1.1.6.L120.90"')
  const av1 = puo('video/mp4; codecs="av01.0.08M.08"')
  const vp9 = puo('video/webm; codecs="vp9"')
  const ac3 = puo('audio/mp4; codecs="ac-3"')
  const eac3 = puo('audio/mp4; codecs="ec-3"')
  const video = ['h264', hevc && 'hevc', av1 && 'av1', vp9 && 'vp9'].filter(Boolean).join(',')
  const audio = ['aac', 'mp3', 'opus', 'flac', ac3 && 'ac3', eac3 && 'eac3'].filter(Boolean).join(',')
  return {
    Name: 'Cineteca web',
    MaxStreamingBitrate: 120_000_000,
    MaxStaticBitrate: 120_000_000,
    DirectPlayProfiles: [
      { Container: 'mp4,m4v,mov', Type: 'Video', VideoCodec: video, AudioCodec: audio },
      { Container: 'webm', Type: 'Video', VideoCodec: ['vp8', vp9 && 'vp9', av1 && 'av1'].filter(Boolean).join(','), AudioCodec: 'vorbis,opus' },
    ],
    TranscodingProfiles: [
      {
        // HLS a pezzi fMP4: il server può copiare il video così com'è e convertire solo ciò che serve
        Container: 'mp4',
        Type: 'Video',
        VideoCodec: ['h264', hevc && 'hevc'].filter(Boolean).join(','),
        AudioCodec: ['aac', ac3 && 'ac3', eac3 && 'eac3'].filter(Boolean).join(','),
        Protocol: 'hls',
        Context: 'Streaming',
        MaxAudioChannels: '6',
        MinSegments: 1,
        BreakOnNonKeyFrames: true,
      },
    ],
    SubtitleProfiles: [
      { Format: 'vtt', Method: 'External' },
      { Format: 'pgssub', Method: 'Encode' },
      { Format: 'dvdsub', Method: 'Encode' },
      { Format: 'dvbsub', Method: 'Encode' },
    ],
    ContainerProfiles: [],
    CodecProfiles: [],
  }
}

export interface Sorgente {
  url: string
  hls: boolean
  /** riprodotto direttamente, convertito solo in parte, o convertito */
  modo: 'diretta' | 'parziale' | 'convertita'
  media: MediaSourceInfo
  playSessionId: string
  dettaglio: string
}

export async function chiediSorgente(p: {
  itemId: string
  /** la versione del file: senza, il server ignora le tracce audio e sottotitoli chieste */
  mediaSourceId?: string
  uid: string
  inizio: number
  audio?: number
  sottotitoli?: number
  conversione: Conversione
  /** altezza massima: il server converte il video a questa risoluzione */
  altezza?: number
}): Promise<Sorgente | null> {
  const conversione = p.altezza ? 'sempre' : p.conversione
  const bitrate = p.altezza ? BITRATE[p.altezza] : 120_000_000
  const s = await chiedi(p, conversione, bitrate, conversione !== 'sempre')
  // il file così com'è suona sempre la sua traccia predefinita: per un'altra lingua il server
  // deve rimandarlo (il video passa intatto, cambia solo l'audio)
  // (il server riscrive DefaultAudioStreamIndex con la traccia chiesta: la predefinita si legge dalle tracce)
  const audio = s?.media.MediaStreams?.filter((x) => x.Type === 'Audio') ?? []
  const predefinita = (audio.find((x) => x.IsDefault) ?? audio[0])?.Index
  if (s?.modo === 'diretta' && p.audio !== undefined && p.audio !== predefinita && conversione !== 'mai')
    return chiedi(p, conversione, bitrate, false)
  return s
}

async function chiedi(p: Parameters<typeof chiediSorgente>[0], conversione: Conversione, bitrate: number, diretta: boolean) {
  const r = await getMediaInfoApi(api).getPostedPlaybackInfo({
    itemId: p.itemId,
    userId: p.uid,
    playbackInfoDto: {
      UserId: p.uid,
      MediaSourceId: p.mediaSourceId,
      DeviceProfile: profilo(),
      StartTimeTicks: Math.round(p.inizio * TICK),
      AudioStreamIndex: p.audio,
      SubtitleStreamIndex: p.sottotitoli,
      EnableDirectPlay: diretta,
      EnableDirectStream: conversione !== 'sempre',
      EnableTranscoding: conversione !== 'mai',
      AllowVideoStreamCopy: conversione !== 'sempre',
      AllowAudioStreamCopy: conversione !== 'sempre',
      AutoOpenLiveStream: true,
      MaxStreamingBitrate: bitrate,
    },
  })
  const s = scegli(r.data, p.itemId)
  // l'altezza massima il server la legge dall'indirizzo della conversione
  if (s && p.altezza && s.modo !== 'diretta') s.url += `&maxHeight=${p.altezza}`
  return s
}

function scegli(info: PlaybackInfoResponse, itemId: string): Sorgente | null {
  const m = info.MediaSources?.[0]
  if (!m || info.ErrorCode) return null
  const playSessionId = info.PlaySessionId ?? ''
  const video = m.MediaStreams?.find((s) => s.Type === 'Video')
  const descr = [video?.Codec?.toUpperCase(), video?.Width ? `${video.Width}×${video.Height}` : null].filter(Boolean).join(' ')
  if (m.SupportsDirectPlay) {
    const q = new URLSearchParams({ static: 'true', mediaSourceId: m.Id ?? '', deviceId: DISPOSITIVO, playSessionId })
    return { url: `${BASE}/Videos/${itemId}/stream.${(m.Container ?? 'mp4').split(',')[0]}?${q}`, hls: false, modo: 'diretta', media: m, playSessionId, dettaglio: `il file arriva così com’è · ${descr}` }
  }
  if (m.TranscodingUrl) {
    // i motivi della conversione il server li scrive nell'indirizzo (TranscodeReasons=…)
    const motivi = (new URLSearchParams(m.TranscodingUrl.split('?')[1] ?? '').get('TranscodeReasons') ?? '').split(',').filter(Boolean)
    const soloAudio = motivi.length > 0 && motivi.every((x) => /Audio|Container/i.test(x))
    return {
      url: BASE + m.TranscodingUrl,
      hls: m.TranscodingSubProtocol === 'hls' || m.TranscodingUrl.includes('.m3u8'),
      modo: soloAudio || m.SupportsDirectStream ? 'parziale' : 'convertita',
      media: m,
      playSessionId,
      dettaglio: soloAudio || m.SupportsDirectStream ? `il video passa intatto, il server cambia contenitore o audio · ${descr}` : `il server converte il video · ${descr}`,
    }
  }
  return null
}

/**
 * Ferma la conversione di una sessione: il server chiude ffmpeg e cancella i pezzi già scritti.
 * Senza, ogni riapertura (lingua, qualità) lascia sul disco del server un film intero.
 */
export function fermaConversione(s: Sorgente) {
  if (s.modo === 'diretta') return Promise.resolve()
  const q = new URLSearchParams({ deviceId: DISPOSITIVO, playSessionId: s.playSessionId })
  return fetch(`${BASE}/Videos/ActiveEncodings?${q}`, { method: 'DELETE' }).catch(() => {})
}

/** Sottotitoli testuali: indirizzo del file VTT da mettere in una <track>. */
export function urlSottotitoli(m: MediaSourceInfo, indice: number): string | null {
  const s = m.MediaStreams?.find((x) => x.Type === 'Subtitle' && x.Index === indice)
  return s?.DeliveryMethod === 'External' && s.DeliveryUrl ? BASE + s.DeliveryUrl : null
}
