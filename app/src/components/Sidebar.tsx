/**
 * Colonna di navigazione. Di norma è una fascia di sole icone; si apre ai
 * nomi estesi solo quando la si richiama — cioè quando il focus entra dentro.
 * È il comportamento descritto nel progetto grafico.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useFocusable } from "../focus/Focus";
import {
  IconCerca,
  IconCuore,
  IconFilm,
  IconHome,
  IconImpostazioni,
  IconSerie,
} from "./icons";

export type Sezione = "home" | "cerca" | "film" | "serie" | "preferiti" | "impostazioni";

const voci: { id: Sezione; etichetta: string; icona: (attivo: boolean) => ReactNode }[] = [
  { id: "home", etichetta: "Home", icona: () => <IconHome /> },
  { id: "cerca", etichetta: "Cerca", icona: () => <IconCerca /> },
  { id: "film", etichetta: "Film", icona: () => <IconFilm /> },
  { id: "serie", etichetta: "Serie", icona: () => <IconSerie /> },
  {
    id: "preferiti",
    etichetta: "Preferiti",
    icona: (attivo) => <IconCuore pieno={attivo} />,
  },
  { id: "impostazioni", etichetta: "Impostazioni", icona: () => <IconImpostazioni /> },
];

function Voce({
  id,
  etichetta,
  icona,
  attivo,
  onSelect,
  onFuoco,
  className,
}: {
  id: Sezione;
  etichetta: string;
  icona: ReactNode;
  attivo: boolean;
  onSelect: () => void;
  onFuoco: (id: Sezione, dentro: boolean) => void;
  className?: string;
}) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({ onSelect });

  useEffect(() => {
    onFuoco(id, focused);
  }, [id, focused, onFuoco]);

  return (
    <button
      ref={ref}
      {...handlers}
      title={etichetta}
      className={[
        "sidebar__item",
        attivo && "sidebar__item--attivo",
        focused && "sidebar__item--fuoco",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="sidebar__icona">{icona}</span>
      <span className="sidebar__etichetta">{etichetta}</span>
    </button>
  );
}

export function Sidebar({
  attiva,
  onVai,
}: {
  attiva: Sezione;
  onVai: (s: Sezione) => void;
}) {
  // Quale voce ha il focus. Idempotente di proposito: l'effetto che la
  // segnala può rigirare senza che il conteggio si sfasi.
  const [fuocoSu, setFuocoSu] = useState<Sezione | null>(null);

  const segnala = useCallback((id: Sezione, dentro: boolean) => {
    setFuocoSu((prev) => (dentro ? id : prev === id ? null : prev));
  }, []);

  const aperta = fuocoSu !== null;

  return (
    <nav className={["sidebar", aperta && "sidebar--aperta"].filter(Boolean).join(" ")}>
      <div className="sidebar__brand">CT</div>
      {voci.map((v) => (
        <Voce
          key={v.id}
          id={v.id}
          etichetta={v.etichetta}
          icona={v.icona(attiva === v.id)}
          attivo={attiva === v.id}
          className={v.id === "impostazioni" ? "sidebar__spazio" : undefined}
          onSelect={() => onVai(v.id)}
          onFuoco={segnala}
        />
      ))}
    </nav>
  );
}
