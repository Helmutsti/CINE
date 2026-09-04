import { Bottone } from "../components/ui";
import { catalogo } from "../data/mock";

export function Impostazioni() {
  const incompatibili = catalogo.filter((t) => t.nonRiproducibile);

  const righe: { et: string; desc: string; azione: string }[] = [
    {
      et: "Cartelle della libreria",
      desc: "Due percorsi in scansione. La libreria è aperta in sola lettura: nessun file viene rinominato o spostato.",
      azione: "Gestisci",
    },
    {
      et: "Analisi della libreria",
      desc: "Ultima scansione completata ieri alle 03:00. 16 titoli, 24 episodi.",
      azione: "Analizza ora",
    },
    {
      et: "Metadati",
      desc: "Titoli, sinossi e locandine da TMDb, conservati in locale. L'app funziona anche senza connessione.",
      azione: "Aggiorna",
    },
    {
      et: "Compatibilità di riproduzione",
      desc:
        incompatibili.length === 0
          ? "Tutti i titoli in libreria sono riproducibili su questo dispositivo."
          : `${incompatibili.length} ${incompatibili.length === 1 ? "titolo non è riproducibile" : "titoli non sono riproducibili"} su questo dispositivo: ${incompatibili.map((t) => t.titolo).join(", ")}.`,
      azione: "Dettagli",
    },
    {
      et: "Lingua",
      desc: "Italiano.",
      azione: "Cambia",
    },
  ];

  return (
    <div className="screen">
      <div className="screen__scroll">
        <header className="screen__head">
          <div className="screen__kicker">Il tuo account</div>
          <h1 className="screen__title">Impostazioni</h1>
        </header>

        <div className="impostazioni">
          {righe.map((r) => (
            <div key={r.et} className="riga-impostazione">
              <div style={{ minWidth: 0 }}>
                <div className="riga-impostazione__et">{r.et}</div>
                <div className="riga-impostazione__desc">{r.desc}</div>
              </div>
              <Bottone compatto>{r.azione}</Bottone>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
