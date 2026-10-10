/*
 * Dati finti del prototipo. Il catalogo (titoli, trame, immagini, cast) è scaricato da
 * Wikipedia/Wikidata, dal server di prova di Jellyfin e da TVmaze; il resto è inventato qui:
 * collezioni, età, etichette tecniche, avanzamenti, profili.
 */
import grezzo from './catalogo.json'

export interface Episodio {
  id: string
  numero: number
  titolo: string
  minuti: number
  img: string | null
}

export interface Stagione {
  numero: number
  episodi: Episodio[]
}

interface Base {
  id: string
  titolo: string
  anno: number | null
  generi: string[]
  trama: string | null
  poster: string | null
  sfondo: string | null
  cast: string[]
  eta: 'T' | '14+' | '18+'
  tecnici: string[]
  aggiunto: number
}

export interface Film extends Base {
  tipo: 'film'
  minuti: number | null
  regia: string[]
}

export interface Serie extends Base {
  tipo: 'serie'
  stagioni: Stagione[]
  stagioniTotali: number
}

export type Titolo = Film | Serie

export interface Persona {
  id: string
  nome: string
  foto: string | null
  bio: string | null
  nascita: string | null
  luogo: string | null
  sesso: 'F' | 'M' | null
  titoli: string[]
}

export interface Collezione {
  id: string
  nome: string
  film: string[]
}

type Grezzo = {
  film: (Omit<Film, 'eta' | 'tecnici' | 'aggiunto' | 'tipo'> & { tipo: string })[]
  serie: (Omit<Serie, 'eta' | 'tecnici' | 'aggiunto' | 'tipo'> & { tipo: string })[]
  persone: Persona[]
}
const g = grezzo as unknown as Grezzo

const DICIOTTO = ['La notte dei morti viventi', "L'ultimo uomo della Terra", 'Gomorra', 'True Detective', 'Mindhunter']
const QUATTORDICI = ['Dracula', 'Nosferatu il vampiro', 'Carnival of Souls', 'Dark', 'Chernobyl', 'Fargo', 'Babylon Berlin', 'La casa dei fantasmi', 'Il gabinetto del dottor Caligari', 'Detour - Deviazione per l\'inferno', 'La belva dell\'autostrada', 'Due ore ancora']

function eta(t: string): Base['eta'] {
  return DICIOTTO.includes(t) ? '18+' : QUATTORDICI.includes(t) ? '14+' : 'T'
}

function tecniciFilm(anno: number | null): string[] {
  if (anno && anno >= 2005) return ['4K', 'HDR', '5.1', 'Sottotitoli ITA ENG']
  if (anno && anno >= 1929) return ['HD', 'Mono', 'Sottotitoli ITA ENG']
  return ['HD', 'Muto', 'Didascalie ITA']
}

// I generi arrivano da Wikipedia e TVmaze scritti in modi diversi: si riportano a un elenco unico
const GENERE: Record<string, string> = {
  'Commedia drammatica': 'Drammatico', 'Drammatico sentimentale': 'Drammatico', 'Dramma storico': 'Storico',
  'Romantic comedy film': 'Commedia', 'Comedy of remarriage': 'Commedia', 'Social comedy film': 'Commedia',
  "Commedia d'azione": 'Commedia', 'Comedy horror film': 'Horror',
  "L'orrore": 'Horror', Zombie: 'Horror', Vampiri: 'Horror', 'Vampire film in Italy': 'Horror', 'Horror psicologico': 'Horror',
  'Sui fantasmi': 'Horror', Mostri: 'Horror', 'Science fiction horror film': 'Horror',
  'Post apocalittico': 'Fantascienza', Mistero: 'Giallo', 'Detective film': 'Giallo',
  'Thriller poliziesco': 'Thriller', 'Caper movie': 'Poliziesco',
  'Fantasy eroico': 'Fantasy', Fantastico: 'Fantasy', Soprannaturale: 'Fantasy',
}
const SCARTA = ['TV Movie', 'Stopico', 'A tecnica mista']
const normalizza = (gg: string[]) => [...new Set(gg.filter((x) => !SCARTA.includes(x)).map((x) => GENERE[x] ?? x))]

let ordine = 0
export const film: Film[] = g.film
  .filter((f) => f.poster || f.sfondo)
  .map((f) => ({ ...f, generi: normalizza(f.generi), tipo: 'film', eta: eta(f.titolo), tecnici: tecniciFilm(f.anno), aggiunto: ordine++ }))

export const serie: Serie[] = g.serie.map((s) => ({
  ...s,
  generi: normalizza(s.generi),
  tipo: 'serie',
  eta: eta(s.titolo),
  tecnici: ['4K', 'HDR', '5.1', 'Sottotitoli ITA ENG'],
  aggiunto: ordine++,
}))

// "aggiunti di recente": un ordine finto ma stabile
for (const t of [...film, ...serie]) t.aggiunto = (t.aggiunto * 7919) % 97

export const titoli: Titolo[] = [...film, ...serie]
const perId = new Map<string, Titolo>(titoli.map((t) => [t.id, t]))
export const titolo = (id: string) => perId.get(id)

export const persone = new Map<string, Persona>(g.persone.map((p) => [p.id, p]))

function trovaFilm(...nomi: string[]) {
  return nomi
    .map((n) => film.find((f) => f.titolo.toLowerCase().startsWith(n.toLowerCase()))?.id)
    .filter((x): x is string => !!x)
}

export const collezioni: Collezione[] = [
  { id: 'c-blender', nome: 'Blender Studio', film: trovaFilm('Elephants Dream', 'Big Buck Bunny', 'Sintel', 'Tears of Steel', 'Cosmos Laundromat', 'Caminandes', 'Spring') },
  { id: 'c-caminandes', nome: 'Caminandes', film: trovaFilm('Caminandes: Llama Drama', 'Caminandes: Gran Dillama', 'Caminandes: Llamigos') },
  { id: 'c-keaton', nome: 'Buster Keaton', film: trovaFilm('La palla', 'Come vinsi la guerra', 'Io... e il ciclone') },
  { id: 'c-chaplin', nome: 'Charlie Chaplin', film: trovaFilm('Il monello', "La febbre dell'oro") },
  { id: 'c-muto', nome: 'Il cinema muto', film: trovaFilm('Viaggio nella Luna', 'Assalto al treno', 'The Great Train Robbery', 'Il gabinetto', 'Nosferatu', 'Preferisco', 'La corazzata', "Il fantasma dell'Opera", 'Metropolis', 'Il pensionante') },
  { id: 'c-brividi', nome: 'Brividi in bianco e nero', film: trovaFilm('Nosferatu', 'Dracula', 'La casa dei fantasmi', 'La piccola bottega', 'Carnival of Souls', "L'ultimo uomo", 'La notte dei morti') },
  { id: 'c-noir', nome: 'Noir', film: trovaFilm('Detour', 'La strada scarlatta', 'Lo straniero', 'Due ore ancora', 'Il quarto uomo', "La belva dell'autostrada", "L'uomo dal braccio") },
  { id: 'c-lang', nome: 'Fritz Lang', film: trovaFilm('Metropolis', 'La strada scarlatta') },
].filter((c) => c.film.length >= 2)

export const collezione = (id: string) => collezioni.find((c) => c.id === id)

/** Riga Generi della Home: i generi con almeno 3 titoli, dal più ricco. */
export function generiPrincipali(): string[] {
  const conta = new Map<string, number>()
  for (const t of titoli) for (const x of t.generi) conta.set(x, (conta.get(x) ?? 0) + 1)
  return [...conta].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([x]) => x)
}

/** Riga Mood della Home: ogni mood è un insieme di generi (riempito in automatico, scelta del 2026-10-10). */
export const MOOD: { id: string; nome: string; generi: string[] }[] = [
  { id: 'ridere', nome: 'Da ridere', generi: ['Commedia'] },
  { id: 'brividi', nome: 'Brividi', generi: ['Horror', 'Thriller'] },
  { id: 'mistero', nome: 'Un mistero da risolvere', generi: ['Giallo', 'Poliziesco', 'Noir'] },
  { id: 'famiglia', nome: 'In famiglia', generi: ['Animazione', 'Famiglia', 'Avventura'] },
  { id: 'lontani', nome: 'Mondi lontani', generi: ['Fantascienza', 'Fantasy'] },
  { id: 'emozioni', nome: 'Emozioni forti', generi: ['Drammatico', 'Sentimentale', 'Guerra', 'Storico'] },
  { id: 'muto', nome: 'Quando il cinema era muto', generi: ['Muto'] },
]

/** Un'immagine rappresentativa per un insieme di generi: il primo titolo con uno sfondo. */
export function immagineDi(generi: string[], salta = 0): string | null {
  const c = titoli.filter((t) => t.sfondo && t.generi.some((x) => generi.includes(x)))
  return c[salta % Math.max(1, c.length)]?.sfondo ?? null
}

/** Il titolo che non si riesce a riprodurre (per provare lo stato "non riproducibile"). */
export const NON_RIPRODUCIBILE = trovaFilm('Metropolis')[0]

export const inEvidenza: Titolo[] = [
  ...serie.filter((s) => ['Dark', 'Scissione', 'Babylon Berlin'].includes(s.titolo)),
  ...film.filter((f) => ['Sintel', 'Tears of Steel', 'Nosferatu il vampiro'].some((n) => f.titolo.startsWith(n))),
].filter((t) => t.sfondo)

// ---------- formattazione ----------
export function durata(minuti: number | null | undefined) {
  if (!minuti) return ''
  const h = Math.floor(minuti / 60)
  const m = minuti % 60
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`
}

export function genere(t: Titolo) {
  return t.generi[0] ?? ''
}

export function iniziali(nome: string) {
  if (nome === 'Manuel') return 'MC' // come nei wireframe
  return nome.slice(0, 2).toUpperCase()
}

/** Il primo episodio di una serie. */
export function primoEpisodio(s: Serie) {
  return s.stagioni[0]?.episodi[0]
}

export function trovaEpisodio(id: string): { serie: Serie; stagione: Stagione; episodio: Episodio } | null {
  for (const s of serie)
    for (const st of s.stagioni)
      for (const e of st.episodi) if (e.id === id) return { serie: s, stagione: st, episodio: e }
  return null
}

export function episodioDopo(id: string): Episodio | null {
  const t = trovaEpisodio(id)
  if (!t) return null
  const tutti = t.serie.stagioni.flatMap((st) => st.episodi)
  return tutti[tutti.indexOf(t.episodio) + 1] ?? null
}

export function sigla(id: string) {
  const t = trovaEpisodio(id)
  return t ? `S${t.stagione.numero} E${t.episodio.numero}` : ''
}

/** Altri titoli: stessa regia, poi stesse collezioni, poi stesso genere. */
export function altri(t: Titolo): Titolo[] {
  const res: Titolo[] = []
  const metti = (x: Titolo) => x.id !== t.id && !res.includes(x) && res.push(x)
  if (t.tipo === 'film') {
    film.filter((f) => f.regia.some((r) => t.regia.includes(r))).forEach(metti)
    collezioni.filter((c) => c.film.includes(t.id)).forEach((c) => c.film.forEach((id) => metti(titolo(id)!)))
    film.filter((f) => f.generi.some((x) => t.generi.includes(x))).forEach(metti)
  } else {
    serie.filter((s) => s.generi.some((x) => t.generi.includes(x))).forEach(metti)
    serie.forEach(metti)
  }
  return res.slice(0, 12)
}
