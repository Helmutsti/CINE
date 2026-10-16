/* Parti comuni del titolo nella Scheda (SC-10, SC-11) e nel titolo in evidenza della Home (SC-03):
   la riga sotto il titolo, la trama breve con "Leggi altro" e il pannello della trama. */
import { useLayoutEffect, useRef, useState } from 'react'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Etichetta } from '../componenti'
import { durata } from '../dati'
import { api, minuti, tecnici, useCarica } from '../jf'
import { useTasti } from '../nav'
import { useStato } from '../stato'

/** Bollino dell'età · ★ voto della community · anno · generi · durata (serie: stagioni) · etichette tecniche. */
export function RigaDati({ t }: { t: BaseItemDto }) {
  const dati = [
    t.ProductionYear ? String(t.ProductionYear) : null,
    t.Genres?.slice(0, 2).join(', ') || null,
    t.Type === 'Movie' && t.RunTimeTicks ? durata(minuti(t)) : null,
    t.Type === 'Series' && t.ChildCount ? (t.ChildCount === 1 ? '1 stagione' : `${t.ChildCount} stagioni`) : null,
  ].filter(Boolean)
  const voto = t.CommunityRating ? t.CommunityRating.toFixed(1).replace('.', ',') : null
  return (
    <div className="t-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-dati-gap)', flexWrap: 'wrap' }}>
      {t.OfficialRating && <span className="bollino-eta t-etichetta">{t.OfficialRating}</span>}
      {voto && <span>★ {voto}</span>}
      {dati.length > 0 && <span>{dati.join('  ·  ')}</span>}
      {tecnici(t).map((x) => (
        <Etichetta key={x}>{x}</Etichetta>
      ))}
    </div>
  )
}

/** La trama in 3 righe al massimo; se è più lunga finisce con il link "Leggi altro". */
export function TramaBreve({ fid, testo, onLeggi }: { fid: string; testo: string; onLeggi: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const parole = testo.split(/\s+/)
  /** quante parole stanno prima del link; null = la trama sta tutta */
  const [taglio, setTaglio] = useState<number | null>(null)
  useLayoutEffect(() => {
    const p = ref.current
    if (!p) return
    const prova = p.cloneNode(false) as HTMLParagraphElement
    prova.style.cssText += `;position:absolute;visibility:hidden;width:${p.clientWidth}px;max-width:none`
    p.parentElement!.appendChild(prova)
    const max = parseFloat(getComputedStyle(p).lineHeight) * 3 + 2
    const sta = (n: number | null) => {
      prova.textContent = n == null ? testo : parole.slice(0, n).join(' ') + '…  Leggi altro'
      return prova.offsetHeight <= max
    }
    let n: number | null = null
    if (!sta(null)) {
      let lo = 0
      let hi = parole.length
      while (lo < hi) {
        const m = Math.ceil((lo + hi) / 2)
        if (sta(m)) lo = m
        else hi = m - 1
      }
      n = lo
    }
    prova.remove()
    setTaglio(n)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testo])
  return (
    <p ref={ref} className="t-sinossi c-2" style={{ margin: '8px 0 0', maxWidth: 900 }}>
      {taglio == null ? testo : parole.slice(0, taglio).join(' ') + '… '}
      {taglio != null && (
        <>
          {' '}
          <button data-f={fid} className="link-trama anello" onClick={onLeggi}>
            Leggi altro
          </button>
        </>
      )}
    </p>
  )
}

const nomeLingua = (codice?: string | null) => {
  if (!codice) return null
  try {
    const n = new Intl.DisplayNames(['it'], { type: 'language' }).of(codice)
    return n ? n[0].toUpperCase() + n.slice(1) : codice
  } catch {
    return codice.toUpperCase()
  }
}

/** SC-10 Trama: la trama intera in un pannello a destra, con regia, attori, audio e sottotitoli. */
export function PannelloTrama({ id, onChiudi }: { id: string; onChiudi: () => void }) {
  const { uid } = useStato()
  // la scheda completa (regia, attori, flussi): la stessa che legge la Scheda
  const voce = useCarica(`titolo:${uid}:${id}`, async () => (await getLibraryApi(api).getItem({ itemId: id, userId: uid })).data)
  const scorre = useRef<HTMLDivElement>(null)
  useTasti((tasto) => {
    if (tasto === 'indietro') return onChiudi(), true
    if (tasto === 'su' || tasto === 'giu') {
      scorre.current?.scrollBy({ top: tasto === 'giu' ? 160 : -160, behavior: 'smooth' })
      return true
    }
    return true
  })
  const t = voce.dati
  if (!t) return <div data-livello style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--scrim)' }} />
  const flussi = t.MediaSources?.[0]?.MediaStreams ?? t.MediaStreams ?? []
  const lingue = (tipo: string) => [...new Set(flussi.filter((s) => s.Type === tipo).map((s) => nomeLingua(s.Language)).filter(Boolean))].join(' · ')
  const crediti = [
    ['Regia', (t.People ?? []).filter((p) => p.Type === 'Director').map((p) => p.Name).join(', ')],
    ['Con', (t.People ?? []).filter((p) => p.Type === 'Actor').slice(0, 4).map((p) => p.Name).join(', ')],
    ['Audio', lingue('Audio')],
    ['Sottotitoli', lingue('Subtitle')],
  ].filter(([, v]) => v)
  return (
    <div data-livello style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--scrim)' }}>
      <div ref={scorre} role="dialog" aria-label={`Trama · ${t.Name}`} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 800, padding: 'var(--sp-64)', background: 'var(--surface)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-24)' }}>
        <div className="t-occhiello c-3">Trama</div>
        <h2 className="t-titolo-sezione" style={{ margin: 0 }}>{t.Name}</h2>
        {(t.Overview ?? '').split(/\n+/).map((x, i) => (
          <p key={i} className="t-sinossi c-2" style={{ margin: 0 }}>
            {x}
          </p>
        ))}
        {crediti.length > 0 && <div style={{ height: 1.5, background: 'var(--line)', flex: 'none' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {crediti.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="t-occhiello c-3">{k}</div>
              <div className="t-meta">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
