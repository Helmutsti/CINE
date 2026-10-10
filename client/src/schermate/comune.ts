/* Testi e azioni condivisi fra le schermate. */
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { durata } from '../dati'
import { api, minuti, secondi, useCarica } from '../jf'
import type { Voce } from '../nav'
import { useStato } from '../stato'

export const CAMPI = ['Overview', 'Genres', 'ChildCount', 'PrimaryImageAspectRatio'] as const

export function restano(sec: number) {
  return `mancano ${Math.max(1, Math.round(sec / 60))}m`
}

export function sigla(ep: BaseItemDto) {
  return `S${ep.ParentIndexNumber ?? 1} E${ep.IndexNumber ?? 1}`
}

/** "2024 · Thriller" (con `lungo`: anche durata o stagioni ed età). */
export function metaBreve(t: BaseItemDto, lungo = false) {
  const parti: string[] = []
  if (t.ProductionYear) parti.push(String(t.ProductionYear))
  if (t.Genres?.[0]) parti.push(t.Genres[0])
  if (lungo) {
    if (t.Type === 'Movie' && t.RunTimeTicks) parti.push(durata(minuti(t)))
    if (t.Type === 'Series' && t.ChildCount) parti.push(t.ChildCount === 1 ? '1 stagione' : `${t.ChildCount} stagioni`)
    if (t.OfficialRating) parti.push(t.OfficialRating)
  }
  return parti.join(' · ')
}

/** Per una serie: l'episodio da cui ripartire (iniziato, poi il prossimo, poi il primo). */
export async function episodioDaGuardare(uid: string, serieId: string): Promise<BaseItemDto | null> {
  const iniziati = await getLibraryApi(api).getItems({
    userId: uid,
    parentId: serieId,
    recursive: true,
    includeItemTypes: ['Episode'],
    filters: ['IsResumable'],
    sortBy: ['DatePlayed'],
    sortOrder: ['Descending'],
    limit: 1,
  })
  if (iniziati.data.Items?.[0]) return iniziati.data.Items[0]
  const prossimo = await getShowApi(api).getNextUp({ userId: uid, seriesId: serieId, limit: 1, enableResumable: false })
  if (prossimo.data.Items?.[0]) return prossimo.data.Items[0]
  const primi = await getShowApi(api).getEpisodes({ seriesId: serieId, userId: uid, limit: 1 })
  return primi.data.Items?.[0] ?? null
}

export interface Azione {
  testo: string
  iniziato: boolean
  voce: Extract<Voce, { s: 'player' }>
  pos: number
  durata: number
  cosa: string
}

function azioneDi(t: BaseItemDto, cosa: string): Azione {
  const pos = secondi(t.UserData?.PlaybackPositionTicks)
  const tot = secondi(t.RunTimeTicks)
  const iniziato = pos > 0
  return {
    testo: iniziato ? `Riprendi (${restano(tot - pos)})` : 'Guarda',
    iniziato,
    voce: { s: 'player', id: t.Id! },
    pos,
    durata: tot,
    cosa,
  }
}

/** Il pulsante principale di un titolo: "Riprendi (mancano 34m)" se iniziato, altrimenti "Guarda". */
export function useAzionePrincipale(t: BaseItemDto | undefined | null): Azione | null {
  const { uid } = useStato()
  const serie = t?.Type === 'Series' ? t.Id! : null
  const ep = useCarica(serie ? `prossimo:${uid}:${serie}` : null, () => episodioDaGuardare(uid, serie!))
  if (!t) return null
  if (t.Type !== 'Series') return azioneDi(t, t.Name ?? '')
  if (!ep.dati) return null
  return azioneDi(ep.dati, `${t.Name} · ${sigla(ep.dati)}`)
}
