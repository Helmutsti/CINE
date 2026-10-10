/*
 * Il profilo in uso. I profili sono gli utenti del server Jellyfin: niente login e niente PIN,
 * l'accesso lo dà la chiave API del contenitore. Tutto il resto (avanzamento, La mia lista,
 * contenuti nascosti ai bambini) lo tiene Jellyfin, per l'utente scelto.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api'
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models'
import { api, fotoUtente } from './jf'

export interface Profilo {
  id: string
  nome: string
  foto: string | null
  /** contenuti limitati da Jellyfin (controllo parentale attivo) */
  limitato: boolean
  amministratore: boolean
}

const daUtente = (u: UserDto): Profilo => ({
  id: u.Id!,
  nome: u.Name ?? '',
  foto: fotoUtente(u.Id, u.PrimaryImageTag),
  limitato: u.Policy?.MaxParentalRating != null,
  amministratore: !!u.Policy?.IsAdministrator,
})

function leggi(k: string) {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function scrivi(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* il browser non salva: pazienza */
  }
}

function useStatoInterno() {
  const [profili, setProfili] = useState<Profilo[] | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [profiloId, setProfiloId] = useState<string | null>(null)
  const [giro, setGiro] = useState(0)

  useEffect(() => {
    let vivo = true
    setErrore(null)
    const utenti = getUserApi(api)
    utenti
      .getUsers({ isHidden: false })
      .then((r) => r.data)
      // con il permesso di un solo utente (invece di una chiave API) l'elenco non si vede: si usa quell'utente
      .catch(async (e) => {
        if (e?.response?.status !== 403) throw e
        return [(await utenti.getCurrentUser()).data]
      })
      .then((elenco) => vivo && setProfili(elenco.filter((u) => !u.Policy?.IsDisabled).map(daUtente)))
      .catch((e) => {
        if (!vivo) return
        const stato = e?.response?.status
        setErrore(
          stato === 401 || stato === 403
            ? 'Il server Jellyfin non accetta la chiave API. Controlla JELLYFIN_API_KEY.'
            : stato
              ? `Il server Jellyfin ha risposto con un errore (${stato}).`
              : 'Il server Jellyfin non risponde. Controlla JELLYFIN_URL.',
        )
      })
    return () => {
      vivo = false
    }
  }, [giro])

  const profilo = profili?.find((p) => p.id === profiloId) ?? null
  return {
    profili,
    errore,
    riprova: () => setGiro((g) => g + 1),
    profilo,
    /** l'utente Jellyfin per tutte le richieste */
    uid: profilo?.id ?? '',
    ultimoProfiloId: leggi('cineteca-profilo'),
    entra: (id: string) => {
      scrivi('cineteca-profilo', id)
      setProfiloId(id)
    },
  }
}

type Ctx = ReturnType<typeof useStatoInterno>
const Contesto = createContext<Ctx | null>(null)

export function StatoProvider({ children }: { children: ReactNode }) {
  const v = useStatoInterno()
  return <Contesto.Provider value={v}>{children}</Contesto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStato() {
  return useContext(Contesto)!
}
