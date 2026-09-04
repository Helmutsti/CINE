import { useState } from "react";
import { useFocusable } from "../focus/Focus";
import { IconCuore, IconPlay } from "../components/icons";
import { Avanzamento, Bottone, Crediti, IntestazioneScheda } from "../components/ui";
import { prossimoEpisodio, type Episodio, type Titolo } from "../data/mock";

function VoceEpisodio({
  e,
  onSelect,
}: {
  e: Episodio;
  onSelect: () => void;
}) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({ onSelect });
  const frazione = e.progressoSec != null ? e.progressoSec / (e.durataMin * 60) : undefined;

  return (
    <button
      ref={ref}
      {...handlers}
      className={["episodio", focused && "episodio--fuoco"].filter(Boolean).join(" ")}
    >
      <div className="episodio__arte art">
        {frazione != null && <Avanzamento frazione={frazione} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="episodio__n">
          Episodio {e.n} · {e.durataMin} minuti
          {e.visto && " · visto"}
        </div>
        <div className="episodio__titolo">{e.titolo}</div>
        <div className="episodio__sinossi">{e.sinossi}</div>
      </div>
    </button>
  );
}

export function SchedaSerie({
  t,
  onGuardaEpisodio,
  onPreferito,
}: {
  t: Titolo;
  onGuardaEpisodio: (stagione: number, e: Episodio) => void;
  onPreferito: () => void;
}) {
  const prossimo = prossimoEpisodio(t);
  const [stagione, setStagione] = useState(prossimo?.stagione ?? 1);
  const corrente = t.stagioni?.find((s) => s.n === stagione);

  return (
    <div className="screen">
      <div className="screen__scroll">
        <div className="scheda">
          <div className="scheda__sfondo art" />
          <div className="scheda__velo" />

          <div className="scheda__corpo">
            <IntestazioneScheda t={t} ritorno="Serie" />

            <div className="scheda__azioni">
              {prossimo && (
                <Bottone
                  variante="primario"
                  autoFocus
                  onSelect={() => onGuardaEpisodio(prossimo.stagione, prossimo.episodio)}
                >
                  <IconPlay />
                  {prossimo.episodio.progressoSec != null ? "Riprendi" : "Guarda"} · S
                  {prossimo.stagione}E{prossimo.episodio.n}
                </Bottone>
              )}
              <Bottone onSelect={onPreferito}>
                <IconCuore pieno={t.preferito} size="1.1875rem" /> Preferiti
              </Bottone>
            </div>

            <Crediti t={t} />
          </div>
        </div>

        <div className="stagioni">
          {t.stagioni?.map((s) => (
            <Bottone
              key={s.n}
              compatto
              variante={s.n === stagione ? "primario" : "secondario"}
              onSelect={() => setStagione(s.n)}
            >
              Stagione {s.n}
            </Bottone>
          ))}
        </div>

        <div className="elenco-episodi">
          {corrente?.episodi.map((e) => (
            <VoceEpisodio
              key={e.id}
              e={e}
              onSelect={() => onGuardaEpisodio(stagione, e)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
