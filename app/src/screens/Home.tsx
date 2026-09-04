import { useFocusable } from "../focus/Focus";
import { IconPlay } from "../components/icons";
import { Riga } from "../components/ui";
import { aggiuntiDiRecente, daRiprendere, type Titolo } from "../data/mock";

function Evidenza({ t, onGuarda }: { t: Titolo; onGuarda: () => void }) {
  const { ref, focused, handlers } = useFocusable<HTMLButtonElement>({
    onSelect: onGuarda,
    autoFocus: true,
  });

  return (
    <div className="evidenza art">
      <div className="evidenza__velo" />
      <div className="evidenza__piede">
        <button
          ref={ref}
          {...handlers}
          className={["evidenza__play", focused && "btn--fuoco"].filter(Boolean).join(" ")}
          aria-label={`Guarda ${t.titolo}`}
        >
          <IconPlay size="1.875rem" />
        </button>
        <div className="evidenza__titolo">{t.titolo}</div>
        <div className="evidenza__punti">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={["evidenza__punto", i === 0 && "evidenza__punto--attivo"]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Home({ onApri }: { onApri: (t: Titolo) => void }) {
  const riprendi = daRiprendere();
  const recenti = aggiuntiDiRecente();
  const inEvidenza = riprendi[1] ?? riprendi[0] ?? recenti[0];

  return (
    <div className="screen">
      <div className="screen__scroll">
        {inEvidenza && (
          <Evidenza t={inEvidenza} onGuarda={() => onApri(inEvidenza)} />
        )}
        <Riga titolo="Riprendi da dove eri" titoli={riprendi} onApri={onApri} />
        <Riga titolo="Aggiunti di recente" titoli={recenti} onApri={onApri} />
      </div>
    </div>
  );
}
