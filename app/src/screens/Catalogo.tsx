import { Card, Vuoto, metaCorta } from "../components/ui";
import type { Titolo } from "../data/mock";

/** Griglia a locandine: Film a catalogo, Serie a catalogo, Preferiti. */
export function Catalogo({
  kicker,
  titolo,
  titoli,
  onApri,
  vuoto,
}: {
  kicker: string;
  titolo: string;
  titoli: Titolo[];
  onApri: (t: Titolo) => void;
  vuoto?: { titolo: string; testo: string };
}) {
  return (
    <div className="screen">
      <div className="screen__scroll">
        <header className="screen__head">
          <div className="screen__kicker">{kicker}</div>
          <h1 className="screen__title">{titolo}</h1>
        </header>

        {titoli.length === 0 && vuoto ? (
          <Vuoto titolo={vuoto.titolo} testo={vuoto.testo} />
        ) : (
          <div className="griglia">
            {titoli.map((t, i) => (
              <Card
                key={t.id}
                poster
                titolo={t.titolo}
                meta={metaCorta(t)}
                frazione={
                  t.progressoSec != null && t.durataMin
                    ? t.progressoSec / (t.durataMin * 60)
                    : undefined
                }
                autoFocus={i === 0}
                onSelect={() => onApri(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
