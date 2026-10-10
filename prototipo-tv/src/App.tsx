import { useEffect, useState } from 'react'
import { avvia } from './fuoco'
import { NavProvider, useNav } from './nav'
import { StatoProvider } from './stato'
import { SceltaProfilo, Pin } from './schermate/Profili'
import { Home } from './schermate/Home'
import { Griglia } from './schermate/Griglia'
import { Collezioni, PaginaCollezione } from './schermate/Collezioni'
import { Cerca } from './schermate/Cerca'
import { Scheda } from './schermate/Scheda'
import { PaginaAttore } from './schermate/Attore'
import { Player } from './schermate/Player'
import { Impostazioni } from './schermate/Impostazioni'
import { Raccolta } from './schermate/Raccolta'

/** Lo schermo TV di 1920 × 1080 riempie la finestra mantenendo le proporzioni. */
function useScala() {
  const calcola = () => Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
  const [s, setS] = useState(calcola)
  useEffect(() => {
    const f = () => setS(calcola())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return s
}

function Schermata() {
  const { cima } = useNav()
  const k = cima.chiave
  switch (cima.s) {
    case 'profili':
      return <SceltaProfilo key={k} />
    case 'pin':
      return <Pin key={k} voce={cima} />
    case 'home':
      return <Home key={k} />
    case 'film':
    case 'serie':
    case 'lista':
      return <Griglia key={k} sezione={cima.s} />
    case 'collezioni':
      return <Collezioni key={k} />
    case 'collezione':
      return <PaginaCollezione key={k} id={cima.id} />
    case 'raccolta':
      return <Raccolta key={k} voce={cima} />
    case 'cerca':
      return <Cerca key={k} />
    case 'titolo':
      return <Scheda key={k} id={cima.id} />
    case 'attore':
      return <PaginaAttore key={k} id={cima.id} />
    case 'player':
      return <Player key={k} voce={cima} />
    case 'impostazioni':
      return <Impostazioni key={k} voce={cima} />
  }
}

export default function App() {
  const scala = useScala()
  useEffect(avvia, [])
  return (
    <StatoProvider>
      <NavProvider>
        <div className="palco" style={{ transform: `translate(-50%, -50%) scale(${scala})` }}>
          <Schermata />
        </div>
      </NavProvider>
    </StatoProvider>
  )
}
