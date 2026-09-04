import { Bottone } from "./ui";
import { hhmmss } from "../data/mock";

/** Al rientro su un titolo già iniziato. */
export function DialogoRipresa({
  titolo,
  daSec,
  onRiprendi,
  onDallInizio,
  onScheda,
}: {
  titolo: string;
  daSec: number;
  onRiprendi: () => void;
  onDallInizio: () => void;
  onScheda: () => void;
}) {
  return (
    <div className="velo-dialogo">
      <div className="dialogo">
        <h2 className="dialogo__titolo">{titolo}</h2>
        <p className="dialogo__testo">
          L'avevi lasciato a {hhmmss(daSec)}. Vuoi riprendere da lì o ricominciare?
        </p>
        <div className="dialogo__azioni">
          <Bottone variante="primario" autoFocus onSelect={onRiprendi}>
            Riprendi · {hhmmss(daSec)}
          </Bottone>
          <Bottone onSelect={onDallInizio}>Dall'inizio</Bottone>
          <Bottone onSelect={onScheda}>Vai alla scheda</Bottone>
        </div>
      </div>
    </div>
  );
}
