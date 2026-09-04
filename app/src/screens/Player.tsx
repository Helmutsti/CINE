import { useEffect, useRef, useState } from "react";
import { Bottone, Opzione, Tondo } from "../components/ui";
import {
  IconAudio,
  IconAvanti30,
  IconCapitoli,
  IconIndietro10,
  IconPausa,
  IconPlay,
  IconSottotitoli,
} from "../components/icons";
import { hhmmss } from "../data/mock";

export type SessionePlayer = {
  titolo: string;
  sopratitolo?: string;
  durataSec: number;
  daSec: number;
  audio: string[];
  sottotitoli: string[];
  /** Quando il client non è in grado di riprodurre il file. */
  errore?: string;
  /** Presente solo nelle serie, per il richiamo di fine episodio. */
  prossimo?: { etichetta: string; avvia: () => void };
};

type Pannello = "audio" | "sottotitoli" | "capitoli" | null;

export function Player({
  s,
  onEsci,
}: {
  s: SessionePlayer;
  onEsci: () => void;
}) {
  const [pos, setPos] = useState(s.daSec);
  const [inRiproduzione, setInRiproduzione] = useState(true);
  const [hud, setHud] = useState(true);
  const [pannello, setPannello] = useState<Pannello>(null);
  const [audio, setAudio] = useState(s.audio[0] ?? "Italiano");
  const [sub, setSub] = useState("Nessuno");
  const timeout = useRef<number | undefined>(undefined);

  // Avanzamento simulato: senza un file vero, il tempo scorre lo stesso —
  // serve a provare la barra, i tempi e il richiamo di fine episodio.
  useEffect(() => {
    if (!inRiproduzione || s.errore) return;
    const id = window.setInterval(() => {
      setPos((p) => Math.min(s.durataSec, p + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [inRiproduzione, s.durataSec, s.errore]);

  // Il HUD si ritira da solo. Qualsiasi tasto lo richiama.
  useEffect(() => {
    const risveglia = () => {
      setHud(true);
      window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => setHud(false), 4000);
    };
    risveglia();
    window.addEventListener("keydown", risveglia);
    window.addEventListener("mousemove", risveglia);
    return () => {
      window.clearTimeout(timeout.current);
      window.removeEventListener("keydown", risveglia);
      window.removeEventListener("mousemove", risveglia);
    };
  }, []);

  if (s.errore) {
    return (
      <div className="player">
        <div className="player__hud player__hud--visibile">
          <div />
          <div className="vuoto" style={{ padding: 0 }}>
            <h2 className="vuoto__titolo">Non riesco a riprodurre questo titolo</h2>
            <p className="vuoto__testo">{s.errore}</p>
            <div className="dialogo__azioni">
              <Bottone variante="primario" autoFocus onSelect={onEsci}>
                Torna alla scheda
              </Bottone>
            </div>
          </div>
          <div />
        </div>
      </div>
    );
  }

  const frazione = pos / s.durataSec;
  const restano = s.durataSec - pos;
  const fineEpisodio = s.prossimo != null && restano <= 20;

  const salta = (d: number) =>
    setPos((p) => Math.max(0, Math.min(s.durataSec, p + d)));

  return (
    <div className="player">
      <div className="player__scena" />
      <div className={["player__velo", hud && "player__velo--visibile"].filter(Boolean).join(" ")} />

      {pannello && (
        <div className="pannello">
          {pannello === "audio" && (
            <>
              <div className="pannello__titolo">Traccia audio</div>
              {s.audio.map((a) => (
                <Opzione
                  key={a}
                  etichetta={a}
                  attiva={a === audio}
                  onSelect={() => {
                    setAudio(a);
                    setPannello(null);
                  }}
                />
              ))}
            </>
          )}
          {pannello === "sottotitoli" && (
            <>
              <div className="pannello__titolo">Sottotitoli</div>
              {["Nessuno", ...s.sottotitoli].map((x) => (
                <Opzione
                  key={x}
                  etichetta={x}
                  attiva={x === sub}
                  onSelect={() => {
                    setSub(x);
                    setPannello(null);
                  }}
                />
              ))}
            </>
          )}
          {pannello === "capitoli" && (
            <>
              <div className="pannello__titolo">Capitoli</div>
              {[0, 0.18, 0.41, 0.66, 0.85].map((f, i) => (
                <Opzione
                  key={i}
                  etichetta={`${i + 1}. ${hhmmss(Math.round(s.durataSec * f))}`}
                  attiva={Math.abs(frazione - f) < 0.09}
                  onSelect={() => {
                    setPos(Math.round(s.durataSec * f));
                    setPannello(null);
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}

      {fineEpisodio && s.prossimo && (
        <div className="pannello" style={{ bottom: "auto", top: "6rem" }}>
          <div className="pannello__titolo">Fra {restano} secondi</div>
          <div style={{ fontSize: "var(--t-h3)", marginBottom: "1.25rem" }}>
            {s.prossimo.etichetta}
          </div>
          <Bottone variante="primario" compatto onSelect={s.prossimo.avvia}>
            <IconPlay /> Guarda ora
          </Bottone>
        </div>
      )}

      <div className={["player__hud", hud && "player__hud--visibile"].filter(Boolean).join(" ")}>
        <div className="player__testata">
          {s.sopratitolo && <div className="player__sopratitolo">{s.sopratitolo}</div>}
          <h1 className="player__titolo">{s.titolo}</h1>
        </div>

        <div>
          <div className="player__barra">
            <div
              className="avanzamento__riempimento"
              style={{ width: `${frazione * 100}%`, height: "100%" }}
            />
          </div>
          <div className="player__tempi">
            <span>{hhmmss(pos)}</span>
            <span>−{hhmmss(restano)}</span>
          </div>

          <div className="player__controlli">
            <Tondo onSelect={() => salta(-10)}>
              <IconIndietro10 />
            </Tondo>
            <Tondo
              principale
              autoFocus
              onSelect={() => setInRiproduzione((v) => !v)}
            >
              {inRiproduzione ? <IconPausa size="1.5rem" /> : <IconPlay size="1.5rem" />}
            </Tondo>
            <Tondo onSelect={() => salta(30)}>
              <IconAvanti30 />
            </Tondo>

            <div className="player__controlli--destra" style={{ display: "flex", gap: "1rem" }}>
              <Tondo onSelect={() => setPannello((p) => (p === "audio" ? null : "audio"))}>
                <IconAudio size="1.5rem" />
              </Tondo>
              <Tondo
                onSelect={() => setPannello((p) => (p === "sottotitoli" ? null : "sottotitoli"))}
              >
                <IconSottotitoli size="1.5rem" />
              </Tondo>
              <Tondo onSelect={() => setPannello((p) => (p === "capitoli" ? null : "capitoli"))}>
                <IconCapitoli size="1.5rem" />
              </Tondo>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
