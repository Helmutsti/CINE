import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/500.css'
import './stili/token.css'
import './stili/base.css'
import './stili/componenti.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
