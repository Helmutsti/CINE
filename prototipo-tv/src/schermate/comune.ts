/* Testi e azioni condivisi fra le schermate. */
import { durata, primoEpisodio, sigla, trovaEpisodio, type Titolo } from '../dati'
import type { Voce } from '../nav'
import type { useStato } from '../stato'

type S = ReturnType<typeof useStato>

export function restano(secondi: number) {
  const m = Math.max(1, Math.round(secondi / 60))
  return `mancano ${m}m`
}

/** "2024 · Thriller" (con `lungo`: anche durata o stagioni ed età). */
export function metaBreve(t: Titolo, lungo = false) {
  const parti: string[] = []
  if (t.anno) parti.push(String(t.anno))
  if (t.generi[0]) parti.push(t.generi[0])
  if (lungo) {
    if (t.tipo === 'film' && t.minuti) parti.push(durata(t.minuti))
    if (t.tipo === 'serie') parti.push(t.stagioniTotali === 1 ? '1 stagione' : `${t.stagioniTotali} stagioni`)
    parti.push(t.eta)
  }
  return parti.join(' · ')
}

/**
 * Il pulsante principale di un titolo: solo "Riprendi" (già iniziato) o "Guarda" (2026-10-10).
 * Se è iniziato, premendolo si chiede se riprendere o ricominciare (vedi Ripresa.tsx).
 */
export function azionePrincipale(t: Titolo, s: S) {
  const av = s.dati.avanzamenti[t.id]
  if (t.tipo === 'film') {
    const durata = (t.minuti ?? 90) * 60
    const voce: Extract<Voce, { s: 'player' }> = { s: 'player', id: t.id }
    return { testo: av ? `Riprendi (${restano(durata - av.pos)})` : 'Guarda', iniziato: !!av, voce, pos: av?.pos ?? 0, durata, cosa: t.titolo }
  }
  if (av) {
    const ep = trovaEpisodio(av.id)!
    return {
      testo: `Riprendi (${restano(ep.episodio.minuti * 60 - av.pos)})`,
      iniziato: true,
      voce: { s: 'player', id: t.id, episodio: av.id } as Extract<Voce, { s: 'player' }>,
      pos: av.pos,
      durata: ep.episodio.minuti * 60,
      cosa: `${t.titolo} · ${sigla(av.id)}`,
    }
  }
  // il primo episodio non visto
  const tutti = t.stagioni.flatMap((st) => st.episodi)
  const prossimo = tutti.find((e) => !s.dati.visti.includes(e.id)) ?? primoEpisodio(t)
  return {
    testo: 'Guarda',
    iniziato: false,
    voce: { s: 'player', id: t.id, episodio: prossimo?.id } as Extract<Voce, { s: 'player' }>,
    pos: 0,
    durata: (prossimo?.minuti ?? 50) * 60,
    cosa: prossimo ? `${sigla(prossimo.id)} · ${prossimo.titolo}` : t.titolo,
  }
}
