/* Le icone della Libreria Figma (pagina Componenti base, sezione Icone), scaricate così come sono.
   Il colore del tracciato "tratto" segue il colore del testo (currentColor). */
import cerca from './cerca.svg?raw'
import play from './play.svg?raw'
import piu from './piu.svg?raw'
import info from './info.svg?raw'
import impostazioni from './impostazioni.svg?raw'
import spunta from './spunta.svg?raw'
import cancella from './cancella.svg?raw'
import frecciaGiu from './freccia-giu.svg?raw'
import pausa from './pausa.svg?raw'
import matita from './matita.svg?raw'

const SVG = { cerca, play, piu, info, impostazioni, spunta, cancella, 'freccia-giu': frecciaGiu, pausa, matita }
export type NomeIcona = keyof typeof SVG

const pronte = Object.fromEntries(
  Object.entries(SVG).map(([k, v]) => [k, v.replace(/#ECEEF2/gi, 'currentColor')]),
) as Record<NomeIcona, string>

export function Icona({ nome }: { nome: NomeIcona }) {
  return <span className="icona" aria-hidden dangerouslySetInnerHTML={{ __html: pronte[nome] }} />
}
