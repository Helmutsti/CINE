/** Primitive dell'interfaccia. Tutto ciò che è interattivo passa da qui,
 *  così entra automaticamente nella navigazione a D-pad. */
import type { ReactNode } from "react";
import { useFocusable } from "../focus/Focus";
import {
  IconAudio,
  IconAudiodescrizione,
  IconHdr,
  IconRisoluzione,
  IconSottotitoli,
} from "./icons";
import { hhmmss, metaRiga, type Titolo } from "../data/mock";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ── Bottone ─────────────────────────────────────────────────────────── */

export function Bottone({
  children,
  onSelect,
  variante = "secondario",
  autoFocus,
  compatto,
  className,
}: {
  children: ReactNode;
  onSelect?: () => void;
  variante?: "primario" | "secondario";
  autoFocus?: boolean;
  compatto?: boolean;
  className?: string;
}) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({ onSelect, autoFocus });
  return (
    <button
      ref={ref}
      {...handlers}
      className={cx(
        "btn",
        variante === "primario" && "btn--primario",
        compatto && "btn--compatto",
        focused && "btn--fuoco",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Avanzamento ─────────────────────────────────────────────────────── */

export function Avanzamento({ frazione }: { frazione: number }) {
  return (
    <div className="avanzamento">
      <div
        className="avanzamento__riempimento"
        style={{ width: `${Math.min(100, Math.max(0, frazione * 100))}%` }}
      />
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */

export function Card({
  titolo,
  meta,
  frazione,
  poster,
  onSelect,
  autoFocus,
}: {
  titolo: string;
  meta?: string;
  frazione?: number;
  poster?: boolean;
  onSelect?: () => void;
  autoFocus?: boolean;
}) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({ onSelect, autoFocus });
  return (
    <button
      ref={ref}
      {...handlers}
      className={cx("card", poster && "card--poster", focused && "card--fuoco")}
    >
      <div className="card__arte art">
        {frazione != null && <Avanzamento frazione={frazione} />}
      </div>
      <div className="card__titolo">{titolo}</div>
      {meta && <div className="card__meta">{meta}</div>}
    </button>
  );
}

/* ── Riga di card ────────────────────────────────────────────────────── */

export function Riga({
  titolo,
  titoli,
  onApri,
  poster,
  primoAFuoco,
}: {
  titolo: string;
  titoli: Titolo[];
  onApri: (t: Titolo) => void;
  poster?: boolean;
  primoAFuoco?: boolean;
}) {
  if (titoli.length === 0) return null;
  return (
    <section className="rail">
      <h2 className="rail__titolo">{titolo}</h2>
      <div className="rail__pista">
        {titoli.map((t, i) => (
          <Card
            key={t.id}
            titolo={t.titolo}
            meta={
              t.progressoSec != null && t.durataMin
                ? `Restano ${Math.round(t.durataMin - t.progressoSec / 60)} minuti`
                : metaCorta(t)
            }
            frazione={
              t.progressoSec != null && t.durataMin
                ? t.progressoSec / (t.durataMin * 60)
                : undefined
            }
            poster={poster}
            autoFocus={primoAFuoco && i === 0}
            onSelect={() => onApri(t)}
          />
        ))}
      </div>
    </section>
  );
}

export const metaCorta = (t: Titolo) => {
  if (t.tipo !== "serie") return `${t.anno} · ${t.generi[0] ?? ""}`;
  const n = t.stagioni?.length ?? 0;
  return `${n} ${n === 1 ? "stagione" : "stagioni"} · ${t.generi[0] ?? ""}`;
};

/* ── Badge tecnici: rappresentano dati letti dal file ────────────────── */

export function BadgeTecnici({ t }: { t: Titolo }) {
  return (
    <div className="badges">
      <span className="badge">
        <IconRisoluzione /> {t.risoluzione}
      </span>
      {t.hdr && (
        <span className="badge">
          <IconHdr /> HDR
        </span>
      )}
      <span className="badge">
        <IconAudio /> {t.canali}
      </span>
      <span className="badge">
        <IconSottotitoli /> Sottotitoli {t.sottotitoli.join(" · ")}
      </span>
      {t.audiodescrizione && (
        <span className="badge">
          <IconAudiodescrizione /> Audiodescrizione
        </span>
      )}
    </div>
  );
}

/* ── Crediti ─────────────────────────────────────────────────────────── */

export function Crediti({ t }: { t: Titolo }) {
  return (
    <div className="scheda__crediti">
      <div>
        <div className="scheda__credito-et">Regia</div>
        {t.regia}
      </div>
      {t.cast.length > 0 && (
        <div>
          <div className="scheda__credito-et">Con</div>
          {t.cast.join(", ")}
        </div>
      )}
      <div>
        <div className="scheda__credito-et">Audio</div>
        {t.audio.join(", ")}
      </div>
    </div>
  );
}

/* ── Intestazione scheda, comune a film e serie ──────────────────────── */

export function IntestazioneScheda({ t, ritorno }: { t: Titolo; ritorno: string }) {
  return (
    <>
      <div className="scheda__ritorno">← {ritorno}</div>
      <h1 className="scheda__titolo">{t.titolo}</h1>
      <div className="scheda__meta">{metaRiga(t)}</div>
      <BadgeTecnici t={t} />
      <p className="scheda__sinossi">{t.sinossi}</p>
    </>
  );
}

/* ── Etichetta di ripresa ────────────────────────────────────────────── */

export const etichettaRipresa = (sec?: number) =>
  sec != null ? `Riprendi · ${hhmmss(sec)}` : "Guarda";

/* ── Voce di pannello ────────────────────────────────────────────────── */

export function Opzione({
  etichetta,
  attiva,
  onSelect,
}: {
  etichetta: string;
  attiva?: boolean;
  onSelect?: () => void;
}) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({ onSelect });
  return (
    <button
      ref={ref}
      {...handlers}
      className={cx("opzione", focused && "opzione--fuoco")}
    >
      <span>{etichetta}</span>
      {attiva && <span className="opzione__segno">●</span>}
    </button>
  );
}

/* ── Controllo tondo del player ──────────────────────────────────────── */

export function Tondo({
  children,
  onSelect,
  principale,
  autoFocus,
}: {
  children: ReactNode;
  onSelect?: () => void;
  principale?: boolean;
  autoFocus?: boolean;
}) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({ onSelect, autoFocus });
  return (
    <button
      ref={ref}
      {...handlers}
      className={cx(
        "tondo",
        principale && "tondo--principale",
        focused && (principale ? "btn--fuoco" : "btn--fuoco"),
      )}
    >
      {children}
    </button>
  );
}

/* ── Stato vuoto ─────────────────────────────────────────────────────── */

export function Vuoto({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="vuoto">
      <h2 className="vuoto__titolo">{titolo}</h2>
      <p className="vuoto__testo">{testo}</p>
    </div>
  );
}
