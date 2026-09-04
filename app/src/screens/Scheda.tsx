import { IconCuore, IconPlay } from "../components/icons";
import {
  Bottone,
  Crediti,
  IntestazioneScheda,
  Riga,
  etichettaRipresa,
} from "../components/ui";
import { correlati, type Titolo } from "../data/mock";

export function Scheda({
  t,
  onGuarda,
  onDallInizio,
  onPreferito,
  onApri,
}: {
  t: Titolo;
  onGuarda: () => void;
  onDallInizio: () => void;
  onPreferito: () => void;
  onApri: (t: Titolo) => void;
}) {
  const daVedereDopo = correlati(t).slice(0, 8);

  return (
    <div className="screen">
      <div className="screen__scroll">
        <div className="scheda">
          <div className="scheda__sfondo art" />
          <div className="scheda__velo" />

          <div className="scheda__corpo">
            <IntestazioneScheda t={t} ritorno="Film" />

            <div className="scheda__azioni">
              <Bottone variante="primario" autoFocus onSelect={onGuarda}>
                <IconPlay /> {etichettaRipresa(t.progressoSec)}
              </Bottone>
              {t.progressoSec != null && (
                <Bottone onSelect={onDallInizio}>Dall'inizio</Bottone>
              )}
              <Bottone onSelect={onPreferito}>
                <IconCuore pieno={t.preferito} size="1.1875rem" /> Preferiti
              </Bottone>
            </div>

            <Crediti t={t} />
          </div>
        </div>

        <Riga titolo="Da vedere dopo" titoli={daVedereDopo} onApri={onApri} />
      </div>
    </div>
  );
}
