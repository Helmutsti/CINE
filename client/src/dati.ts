/* Funzioni comuni: testi, generi e mood. */

export function iniziali(nome: string) {
  const parti = nome.trim().split(/\s+/)
  return (parti.length > 1 ? parti[0][0] + parti[1][0] : nome.slice(0, 2)).toUpperCase()
}

export function durata(minuti: number | null | undefined) {
  if (!minuti) return ''
  const h = Math.floor(minuti / 60)
  const m = minuti % 60
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Illustrazione di ogni genere (public/media/illustrazioni/genere-*.svg).
 * Jellyfin scrive i generi nella lingua dei metadati: si accettano italiano e inglese.
 */
const ILLUSTRAZIONI: [string, string[]][] = [
  ['drammatico', ['dramma', 'drama', 'drammatico']],
  ['commedia', ['commedia', 'comedy']],
  ['fantascienza', ['fantascienza', 'science fiction', 'sci-fi & fantasy', 'sci-fi']],
  ['giallo', ['mistero', 'mystery', 'giallo']],
  ['horror', ['horror', 'orrore']],
  ['noir', ['noir', 'film-noir']],
  ['poliziesco', ['crime', 'poliziesco']],
  ['azione', ['azione', 'action', 'action & adventure']],
  ['fantasy', ['fantasy', 'fantastico']],
  ['animazione', ['animazione', 'animation']],
  ['muto', ['muto', 'silent']],
  ['thriller', ['thriller']],
  ['famiglia', ['famiglia', 'family', 'kids', 'bambini']],
  ['storico', ['storia', 'history', 'storico', 'guerra', 'war', 'war & politics']],
  ['sentimentale', ['romance', 'romantico', 'sentimentale']],
  ['avventura', ['avventura', 'adventure']],
  ['western', ['western']],
  ['documentario', ['documentario', 'documentary']],
  ['musica', ['musica', 'music', 'musical']],
]

export function illustrazioneGenere(nome: string): string {
  const n = norm(nome)
  const trovata = ILLUSTRAZIONI.find(([, nomi]) => nomi.includes(n))
  return `media/illustrazioni/genere-${trovata ? trovata[0] : 'altro'}.svg`
}

/** I mood: ognuno raccoglie alcuni generi (in automatico, scelta del 2026-10-10). */
export const MOOD: { id: string; nome: string; generi: string[] }[] = [
  { id: 'ridere', nome: 'Da ridere', generi: ['commedia', 'comedy'] },
  { id: 'brividi', nome: 'Brividi', generi: ['horror', 'thriller'] },
  { id: 'mistero', nome: 'Un mistero da risolvere', generi: ['mistero', 'mystery', 'crime', 'giallo', 'noir', 'poliziesco'] },
  { id: 'famiglia', nome: 'In famiglia', generi: ['animazione', 'animation', 'famiglia', 'family', 'kids', 'avventura', 'adventure'] },
  { id: 'lontani', nome: 'Mondi lontani', generi: ['fantascienza', 'science fiction', 'sci-fi & fantasy', 'fantasy'] },
  { id: 'emozioni', nome: 'Emozioni forti', generi: ['dramma', 'drama', 'romance', 'guerra', 'war', 'storia', 'history'] },
]

/** I nomi reali dei generi del server che appartengono a un mood. */
export function generiDelMood(mood: (typeof MOOD)[number], generiServer: string[]) {
  return generiServer.filter((g) => mood.generi.includes(norm(g)))
}
