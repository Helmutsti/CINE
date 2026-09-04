import { useState } from "react";
import { useFocusable } from "../focus/Focus";
import { Bottone, Card, Vuoto, metaCorta } from "../components/ui";
import { cerca, generi, perGenere, type Titolo } from "../data/mock";

const lettere = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const cifre = "0123456789".split("");

function Tasto({
  etichetta,
  largo,
  onSelect,
  autoFocus,
}: {
  etichetta: string;
  largo?: boolean;
  onSelect: () => void;
  autoFocus?: boolean;
}) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({ onSelect, autoFocus });
  return (
    <button
      ref={ref}
      {...handlers}
      className={["tasto", largo && "tasto--largo", focused && "tasto--fuoco"]
        .filter(Boolean)
        .join(" ")}
    >
      {etichetta}
    </button>
  );
}

/**
 * Ricerca pensata per l'input da telecomando: la tastiera a schermo è la
 * superficie principale, la tastiera fisica è un di più.
 */
export function Ricerca({ onApri }: { onApri: (t: Titolo) => void }) {
  const [q, setQ] = useState("");
  const [genere, setGenere] = useState<string | null>(null);

  const risultati = q ? cerca(q) : genere ? perGenere(genere) : [];
  const intestazione = q
    ? `${risultati.length} ${risultati.length === 1 ? "titolo" : "titoli"} per «${q.toLowerCase()}»`
    : genere
      ? `${risultati.length} in ${genere}`
      : "Sfoglia per genere";

  return (
    <div className="screen">
      <div className="screen__scroll">
        <div className="ricerca">
          <div className="ricerca__campo">
            <div className="ricerca__valore">
              {q}
              <span className="ricerca__cursore" />
            </div>

            <div className="tastiera">
              {[...lettere, ...cifre].map((c, i) => (
                <Tasto
                  key={c}
                  etichetta={c}
                  autoFocus={i === 0}
                  onSelect={() => {
                    setGenere(null);
                    setQ((v) => v + c);
                  }}
                />
              ))}
              <Tasto
                etichetta="Spazio"
                largo
                onSelect={() => {
                  setGenere(null);
                  setQ((v) => v + " ");
                }}
              />
              <Tasto etichetta="Cancella" largo onSelect={() => setQ((v) => v.slice(0, -1))} />
              <Tasto etichetta="Tutto" largo onSelect={() => setQ("")} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="rail__titolo" style={{ padding: 0, marginTop: 0 }}>
              {intestazione}
            </h2>

            {!q && (
              <div className="generi">
                {generi.map((g) => (
                  <Bottone
                    key={g}
                    compatto
                    variante={genere === g ? "primario" : "secondario"}
                    onSelect={() => setGenere((x) => (x === g ? null : g))}
                  >
                    {g}
                  </Bottone>
                ))}
              </div>
            )}

            {risultati.length > 0 && (
              <div
                className="griglia"
                style={{ padding: "1.5rem 0 3rem" }}
              >
                {risultati.map((t) => (
                  <Card
                    key={t.id}
                    poster
                    titolo={t.titolo}
                    meta={metaCorta(t)}
                    onSelect={() => onApri(t)}
                  />
                ))}
              </div>
            )}

            {q && risultati.length === 0 && (
              <Vuoto
                titolo="Nessun risultato"
                testo={`Non c'è niente in libreria che corrisponda a «${q.toLowerCase()}». Prova con meno lettere, o cerca il nome di un regista.`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
