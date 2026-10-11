/*
 * SC-18 Cambia immagini: si sceglie la locandina o lo sfondo del titolo fra quelli che il server
 * trova online (TheMovieDb, Fanart…). OK su un'immagine la scarica sul server e la mette in uso.
 * Per una collezione la prima scheda è "Dai film": la copertina si prende da un film che contiene.
 */
import { useState, type ReactNode } from 'react'
import { getRemoteImageApi } from '@jellyfin/sdk/lib/utils/api/remote-image-api'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import type { BaseItemDto, RemoteImageInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { Card, Finestra, Icona, Scelta } from '../componenti'
import { api, BASE, locandina, orizzontale, sfondo, useCarica } from '../jf'
import { useStato } from '../stato'
import { mettiId } from '../fuoco'
import { useFuocoIniziale } from '../nav'

type Tipo = 'Primary' | 'Backdrop' | 'film'
const SCHEDE: { id: Tipo; nome: string }[] = [
  { id: 'film', nome: 'Dai film' },
  { id: 'Primary', nome: 'Locandina' },
  { id: 'Backdrop', nome: 'Sfondo' },
]

/**
 * Copia le immagini di un titolo su un altro (la collezione): lo sfondo diventa lo sfondo,
 * la locandina la locandina. Jellyfin vuole l'immagine in base64 nel corpo della richiesta.
 */
export async function copiaImmagini(da: BaseItemDto, a: string) {
  const copia = async (tipo: 'Backdrop' | 'Primary', url: string | null) => {
    if (!url) return
    const img = await (await fetch(url)).blob()
    const b64 = await new Promise<string>((ok, ko) => {
      const f = new FileReader()
      f.onload = () => ok(String(f.result).split(',')[1] ?? '')
      f.onerror = ko
      f.readAsDataURL(img)
    })
    const r = await fetch(`${BASE}/Items/${a}/Images/${tipo}`, { method: 'POST', headers: { 'Content-Type': img.type || 'image/jpeg' }, body: b64 })
    if (!r.ok) throw new Error(`immagine ${tipo}: ${r.status}`)
  }
  await copia('Backdrop', sfondo(da, 1920))
  await copia('Primary', locandina(da, 1000))
}

const dettagli = (i: RemoteImageInfo) => [i.Language?.toUpperCase(), i.Width && i.Height ? `${i.Width} × ${i.Height}` : null].filter(Boolean).join(' · ')

export function CambiaImmagini({ t, onFatto, onChiudi }: { t: BaseItemDto; onFatto: () => void; onChiudi: () => void }) {
  const { uid } = useStato()
  const collezione = t.Type === 'BoxSet'
  const schede = collezione ? SCHEDE : SCHEDE.filter((s) => s.id !== 'film')
  const [tipo, setTipo] = useState<Tipo>(collezione ? 'film' : 'Primary')
  const [applico, setApplico] = useState(false)
  const remote = getRemoteImageApi(api)
  const immagini = useCarica(tipo === 'film' ? null : `immagini:${t.Id}:${tipo}`, async () => (await remote.getRemoteImages({ itemId: t.Id!, type: tipo as 'Primary' | 'Backdrop', includeAllLanguages: true, limit: 40 })).data.Images ?? [])
  const film = useCarica(tipo === 'film' ? `collezione-film:${uid}:${t.Id}` : null, async () => (await getLibraryApi(api).getItems({ userId: uid, parentId: t.Id!, sortBy: ['PremiereDate', 'ProductionYear', 'SortName'] })).data.Items ?? [])
  const el = immagini.dati ?? []
  const locand = tipo === 'Primary'
  const inUso = locand ? locandina(t, 480) : sfondo(t, 800)
  useFuocoIniziale('img-uso')

  const applica = async (i: RemoteImageInfo) => {
    if (!i.Url) return
    setApplico(true)
    try {
      await remote.downloadRemoteImage({ itemId: t.Id!, type: tipo as 'Primary' | 'Backdrop', imageUrl: i.Url })
    } finally {
      onFatto()
    }
  }
  const daFilm = async (f: BaseItemDto) => {
    setApplico(true)
    try {
      await copiaImmagini(f, t.Id!)
    } finally {
      onFatto()
    }
  }

  const card = (fid: string, img: string | null, titolo: string, meta: ReactNode, onOk: () => void) => (
    <Card key={fid} fid={fid} formato={locand ? 'locandina' : 'orizzontale'} larghezza={locand ? 226 : 400} sempre piccolo img={img} titolo={titolo} meta={meta} onOk={onOk} />
  )

  return (
    <Finestra titolo="Cambia immagini" testo={t.Name} larghezza={1640} onChiudi={onChiudi}>
      <div style={{ display: 'flex', gap: 16 }} data-g="img-schede">
        {schede.map((s) => (
          <Scelta key={s.id} fid={'img-' + s.id} testo={s.nome} selezionata={s.id === tipo} pref={s.id === tipo} onFuoco={() => setTipo(s.id)} onOk={() => mettiId('img-uso')} />
        ))}
      </div>
      {applico ? (
        <p className="t-meta c-2" style={{ margin: 0, height: 640 }}>Applico l'immagine…</p>
      ) : (
        <div
          data-yscroll="0"
          data-g={'img-' + tipo}
          style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, ${locand ? 226 : 400}px)`, gap: '32px var(--rail-gap)', height: 640, overflowY: 'auto', scrollbarWidth: 'none', padding: '24px 24px 120px', margin: '0 -24px' }}
        >
          {card(
            'img-uso',
            inUso,
            'In uso',
            <span className="card__riga-meta">
              <Icona nome="spunta" /> Immagine attuale
            </span>,
            onChiudi,
          )}
          {tipo === 'film' && film.pronto && !film.dati?.length && <p className="t-meta c-2" style={{ margin: 0, gridColumn: '2 / -1' }}>La collezione è vuota: aggiungi prima qualche film.</p>}
          {tipo === 'film' && (film.dati ?? []).map((f) => card('img-f-' + f.Id, orizzontale(f), f.Name ?? '', f.ProductionYear ?? '', () => daFilm(f)))}
          {tipo !== 'film' && !immagini.pronto && <p className="t-meta c-2" style={{ margin: 0, gridColumn: '2 / -1' }}>Cerco le immagini…</p>}
          {tipo !== 'film' && immagini.pronto && el.length === 0 && <p className="t-meta c-2" style={{ margin: 0, gridColumn: '2 / -1' }}>Nessuna immagine trovata online per questo titolo.</p>}
          {el.map((i, n) => card('img-' + n, i.ThumbnailUrl || i.Url || null, i.ProviderName ?? 'Online', dettagli(i), () => applica(i)))}
        </div>
      )}
    </Finestra>
  )
}
