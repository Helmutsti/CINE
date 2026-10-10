/*
 * SC-18 Cambia immagini: si sceglie la locandina o lo sfondo del titolo fra quelli che il server
 * trova online (TheMovieDb, Fanart…). OK su un'immagine la scarica sul server e la mette in uso.
 */
import { useState, type ReactNode } from 'react'
import { getRemoteImageApi } from '@jellyfin/sdk/lib/utils/api/remote-image-api'
import type { BaseItemDto, RemoteImageInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { Card, Finestra, Icona, Scelta } from '../componenti'
import { api, locandina, sfondo, useCarica } from '../jf'
import { mettiId } from '../fuoco'
import { useFuocoIniziale } from '../nav'

type Tipo = 'Primary' | 'Backdrop'
const SCHEDE: { id: Tipo; nome: string }[] = [
  { id: 'Primary', nome: 'Locandina' },
  { id: 'Backdrop', nome: 'Sfondo' },
]

const dettagli = (i: RemoteImageInfo) => [i.Language?.toUpperCase(), i.Width && i.Height ? `${i.Width} × ${i.Height}` : null].filter(Boolean).join(' · ')

export function CambiaImmagini({ t, onFatto, onChiudi }: { t: BaseItemDto; onFatto: () => void; onChiudi: () => void }) {
  const [tipo, setTipo] = useState<Tipo>('Primary')
  const [applico, setApplico] = useState(false)
  const remote = getRemoteImageApi(api)
  const immagini = useCarica(`immagini:${t.Id}:${tipo}`, async () => (await remote.getRemoteImages({ itemId: t.Id!, type: tipo, includeAllLanguages: true, limit: 40 })).data.Images ?? [])
  const el = immagini.dati ?? []
  const locand = tipo === 'Primary'
  const inUso = locand ? locandina(t, 480) : sfondo(t, 800)
  useFuocoIniziale('img-uso')

  const applica = async (i: RemoteImageInfo) => {
    if (!i.Url) return
    setApplico(true)
    try {
      await remote.downloadRemoteImage({ itemId: t.Id!, type: tipo, imageUrl: i.Url })
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
        {SCHEDE.map((s) => (
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
          {!immagini.pronto && <p className="t-meta c-2" style={{ margin: 0, gridColumn: '2 / -1' }}>Cerco le immagini…</p>}
          {immagini.pronto && el.length === 0 && <p className="t-meta c-2" style={{ margin: 0, gridColumn: '2 / -1' }}>Nessuna immagine trovata online per questo titolo.</p>}
          {el.map((i, n) => card('img-' + n, i.ThumbnailUrl || i.Url || null, i.ProviderName ?? 'Online', dettagli(i), () => applica(i)))}
        </div>
      )}
    </Finestra>
  )
}
