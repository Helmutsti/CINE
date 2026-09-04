import { useCallback, useMemo, useState } from "react";
import { FocusProvider, FocusScope, useResetFocusOn } from "./focus/Focus";
import { Sidebar, type Sezione } from "./components/Sidebar";
import { DialogoRipresa } from "./components/DialogoRipresa";
import { Home } from "./screens/Home";
import { Catalogo } from "./screens/Catalogo";
import { Ricerca } from "./screens/Ricerca";
import { Scheda } from "./screens/Scheda";
import { SchedaSerie } from "./screens/SchedaSerie";
import { Impostazioni } from "./screens/Impostazioni";
import { Player, type SessionePlayer } from "./screens/Player";
import { catalogo, film, serie, type Episodio, type Titolo } from "./data/mock";
import "./styles/base.css";
import "./styles/components.css";

type Vista =
  { tipo: "sezione"; sezione: Sezione } | { tipo: "scheda"; id: string };

export default function App() {
  const [vista, setVista] = useState<Vista>({
    tipo: "sezione",
    sezione: "home",
  });
  const [sessione, setSessione] = useState<SessionePlayer | null>(null);
  const [chiedi, setChiedi] = useState<Titolo | null>(null);

  // I preferiti sono stato d'utente: qui vivono in memoria, ma restano
  // distinti dal catalogo, che è derivato.
  const [preferiti, setPreferiti] = useState(
    () => new Set(catalogo.filter((t) => t.preferito).map((t) => t.id)),
  );

  const conStato = useCallback(
    (t: Titolo): Titolo => ({ ...t, preferito: preferiti.has(t.id) }),
    [preferiti],
  );

  const sezioneCorrente: Sezione =
    vista.tipo === "sezione"
      ? vista.sezione
      : catalogo.find((t) => t.id === vista.id)?.tipo === "serie"
        ? "serie"
        : "film";

  const titoloAperto =
    vista.tipo === "scheda"
      ? catalogo.find((t) => t.id === vista.id)
      : undefined;

  /* ── Riproduzione ─────────────────────────────────────────────────── */

  const avviaFilm = useCallback((t: Titolo, daSec: number) => {
    setChiedi(null);
    setSessione({
      titolo: t.titolo,
      durataSec: (t.durataMin ?? 100) * 60,
      daSec,
      audio: t.audio,
      sottotitoli: t.sottotitoli,
      errore: t.nonRiproducibile,
    });
  }, []);

  const avviaEpisodio = useCallback(
    (t: Titolo, stagione: number, e: Episodio, daSec = e.progressoSec ?? 0) => {
      const s = t.stagioni?.find((x) => x.n === stagione);
      const dopo = s?.episodi.find((x) => x.n === e.n + 1);
      setChiedi(null);
      setSessione({
        titolo: e.titolo,
        sopratitolo: `${t.titolo} · Stagione ${stagione}, episodio ${e.n}`,
        durataSec: e.durataMin * 60,
        daSec,
        audio: t.audio,
        sottotitoli: t.sottotitoli,
        errore: t.nonRiproducibile,
        prossimo: dopo
          ? {
              etichetta: `Episodio ${dopo.n} · ${dopo.titolo}`,
              avvia: () => avviaEpisodio(t, stagione, dopo, 0),
            }
          : undefined,
      });
    },
    [],
  );

  /* ── Apertura di un titolo ────────────────────────────────────────── */

  const apri = useCallback((t: Titolo) => {
    // Al rientro su un titolo già iniziato si chiede, invece di decidere
    // al posto di chi guarda.
    if (t.progressoSec != null) {
      setChiedi(t);
      return;
    }
    setVista({ tipo: "scheda", id: t.id });
  }, []);

  const indietro = useCallback(() => {
    if (sessione) return setSessione(null);
    if (chiedi) return setChiedi(null);
    if (vista.tipo === "scheda")
      return setVista({ tipo: "sezione", sezione: sezioneCorrente });
    if (vista.sezione !== "home")
      return setVista({ tipo: "sezione", sezione: "home" });
  }, [sessione, chiedi, vista, sezioneCorrente]);

  const chiaveFocus = useMemo(
    () =>
      sessione
        ? "player"
        : chiedi
          ? `dialogo:${chiedi.id}`
          : vista.tipo === "scheda"
            ? `scheda:${vista.id}`
            : `sez:${vista.sezione}`,
    [sessione, chiedi, vista],
  );

  const vaiA = (s: Sezione) => setVista({ tipo: "sezione", sezione: s });

  return (
    <FocusProvider onBack={indietro}>
      <Corpo chiave={chiaveFocus}>
        <div className="app">
          {!sessione && <Sidebar attiva={sezioneCorrente} onVai={vaiA} />}

          {titoloAperto ? (
            titoloAperto.tipo === "serie" ? (
              <SchedaSerie
                t={conStato(titoloAperto)}
                onGuardaEpisodio={(st, e) => avviaEpisodio(titoloAperto, st, e)}
                onPreferito={() =>
                  togglePreferito(titoloAperto.id, setPreferiti)
                }
              />
            ) : (
              <Scheda
                t={conStato(titoloAperto)}
                onGuarda={() =>
                  avviaFilm(titoloAperto, titoloAperto.progressoSec ?? 0)
                }
                onDallInizio={() => avviaFilm(titoloAperto, 0)}
                onPreferito={() =>
                  togglePreferito(titoloAperto.id, setPreferiti)
                }
                onApri={apri}
              />
            )
          ) : vista.tipo === "sezione" ? (
            <Schermata
              sezione={vista.sezione}
              onApri={apri}
              preferiti={preferiti}
            />
          ) : null}
        </div>

        {chiedi && (
          <FocusScope>
            <DialogoRipresa
              titolo={chiedi.titolo}
              daSec={chiedi.progressoSec ?? 0}
              onRiprendi={() => {
                if (chiedi.tipo === "serie") {
                  const p = trovaEpisodioInCorso(chiedi);
                  if (p) return avviaEpisodio(chiedi, p.stagione, p.episodio);
                }
                avviaFilm(chiedi, chiedi.progressoSec ?? 0);
              }}
              onDallInizio={() => {
                if (chiedi.tipo === "serie") {
                  const p = trovaEpisodioInCorso(chiedi);
                  if (p)
                    return avviaEpisodio(chiedi, p.stagione, p.episodio, 0);
                }
                avviaFilm(chiedi, 0);
              }}
              onScheda={() => {
                setChiedi(null);
                setVista({ tipo: "scheda", id: chiedi.id });
              }}
            />
          </FocusScope>
        )}

        {sessione && (
          <FocusScope>
            <Player s={sessione} onEsci={() => setSessione(null)} />
          </FocusScope>
        )}

        <div className="aiuto">
          Frecce per muoverti · Invio per aprire · Esc per tornare
        </div>
      </Corpo>
    </FocusProvider>
  );
}

/** Riporta il focus in cima a ogni cambio di schermata. */
function Corpo({
  chiave,
  children,
}: {
  chiave: string;
  children: React.ReactNode;
}) {
  useResetFocusOn(chiave);
  return <>{children}</>;
}

function Schermata({
  sezione,
  onApri,
  preferiti,
}: {
  sezione: Sezione;
  onApri: (t: Titolo) => void;
  preferiti: Set<string>;
}) {
  switch (sezione) {
    case "home":
      return <Home onApri={onApri} />;
    case "cerca":
      return <Ricerca onApri={onApri} />;
    case "film":
      return (
        <Catalogo
          kicker="A catalogo"
          titolo="Film"
          titoli={film()}
          onApri={onApri}
        />
      );
    case "serie":
      return (
        <Catalogo
          kicker="A catalogo"
          titolo="Serie"
          titoli={serie()}
          onApri={onApri}
        />
      );
    case "preferiti":
      return (
        <Catalogo
          kicker={`Salvati · ${preferiti.size} titoli`}
          titolo="Preferiti"
          titoli={catalogo.filter((t) => preferiti.has(t.id))}
          onApri={onApri}
          vuoto={{
            titolo: "Non hai ancora salvato niente",
            testo:
              "Apri un titolo e premi Preferiti per tenerlo qui. È la tua lista, resta com'è finché non la cambi.",
          }}
        />
      );
    case "impostazioni":
      return <Impostazioni />;
  }
}

function togglePreferito(
  id: string,
  set: React.Dispatch<React.SetStateAction<Set<string>>>,
) {
  set((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function trovaEpisodioInCorso(t: Titolo) {
  for (const s of t.stagioni ?? []) {
    for (const e of s.episodi) {
      if (e.progressoSec != null) return { stagione: s.n, episodio: e };
    }
  }
  const s = t.stagioni?.[0];
  return s?.episodi[0] ? { stagione: s.n, episodio: s.episodi[0] } : null;
}
