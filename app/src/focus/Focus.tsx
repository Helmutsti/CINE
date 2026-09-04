/**
 * Navigazione spaziale a D-pad.
 *
 * Ogni elemento interattivo si registra qui e diventa raggiungibile con le
 * frecce. La direzione si risolve sulla geometria reale degli elementi, non
 * su una griglia dichiarata a mano: aggiungere un pulsante da qualsiasi parte
 * lo rende navigabile senza cablare nulla.
 *
 * Il focus è una cornice, mai un ingrandimento (vedi tokens.css): si sposta
 * con box-shadow, che non innesca layout — su hardware lento un focus che
 * ridimensiona si vede.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Direction = "up" | "down" | "left" | "right";

type Entry = {
  id: string;
  el: HTMLElement;
  onSelect?: () => void;
  /** Priorità nella scelta del primo focus quando cambia schermata. */
  autoFocus?: boolean;
  /** Livello di sovrapposizione: solo il più alto presente è navigabile. */
  scope: number;
};

type FocusApi = {
  focusedId: string | null;
  register: (entry: Entry) => () => void;
  focus: (id: string) => void;
  /** Rimette il focus sul candidato migliore, es. al cambio schermata. */
  reset: () => void;
};

const FocusContext = createContext<FocusApi | null>(null);

/**
 * Livello di sovrapposizione corrente. Un popup o il player si dichiarano un
 * livello sopra: finché sono aperti, il telecomando non può raggiungere ciò
 * che sta dietro — che è quello che ci si aspetta da una finestra modale.
 */
const ScopeContext = createContext(0);

export function FocusScope({ children }: { children: ReactNode }) {
  const parent = useContext(ScopeContext);
  return <ScopeContext.Provider value={parent + 1}>{children}</ScopeContext.Provider>;
}

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** Solo gli elementi del livello più alto attualmente presente. */
const attivi = (all: Entry[]) => {
  if (all.length === 0) return all;
  const max = Math.max(...all.map((e) => e.scope));
  return all.filter((e) => e.scope === max);
};

/**
 * Sceglie il candidato migliore nella direzione data: distanza sull'asse di
 * movimento, più una penalità sullo scostamento laterale. La penalità è ciò
 * che fa "scendere in colonna" invece di saltare a caso in una griglia.
 */
function bestCandidate(from: HTMLElement, dir: Direction, all: Entry[]): Entry | null {
  const src = from.getBoundingClientRect();
  const s = center(src);
  let best: Entry | null = null;
  let bestScore = Infinity;

  for (const entry of all) {
    if (entry.el === from) continue;
    const r = entry.el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const c = center(r);

    // Distanza fra i bordi affacciati, non fra i centri: righe di card di
    // altezza diversa restano allineate.
    let along: number;
    let across: number;
    switch (dir) {
      case "left":
        along = src.left - r.right;
        across = Math.abs(c.y - s.y);
        break;
      case "right":
        along = r.left - src.right;
        across = Math.abs(c.y - s.y);
        break;
      case "up":
        along = src.top - r.bottom;
        across = Math.abs(c.x - s.x);
        break;
      case "down":
        along = r.top - src.bottom;
        across = Math.abs(c.x - s.x);
        break;
    }

    // Deve stare davvero nella direzione richiesta. La tolleranza negativa
    // ammette elementi che si sovrappongono di poco.
    if (along < -8) continue;

    const score = Math.max(along, 0) + across * 1.6;
    if (score < bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best;
}

export function FocusProvider({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack?: () => void;
}) {
  const registry = useRef(new Map<string, Entry>());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedIdRef = useRef<string | null>(null);

  useEffect(() => {
    focusedIdRef.current = focusedId;
  }, [focusedId]);

  const scrollTo = useCallback((el: HTMLElement) => {
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, []);

  const focus = useCallback(
    (id: string) => {
      const entry = registry.current.get(id);
      if (!entry) return;
      setFocusedId(id);
      scrollTo(entry.el);
    },
    [scrollTo],
  );

  const reset = useCallback(() => {
    const all = attivi([...registry.current.values()]);
    if (all.length === 0) {
      setFocusedId(null);
      return;
    }
    const preferred = all.find((e) => e.autoFocus);
    if (preferred) {
      setFocusedId(preferred.id);
      scrollTo(preferred.el);
      return;
    }
    // Altrimenti il più in alto a sinistra fra quelli visibili.
    const sorted = all
      .map((e) => ({ e, r: e.el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 || r.height > 0)
      .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
    if (sorted[0]) {
      setFocusedId(sorted[0].e.id);
      scrollTo(sorted[0].e.el);
    }
  }, [scrollTo]);

  const register = useCallback((entry: Entry) => {
    registry.current.set(entry.id, entry);
    return () => {
      registry.current.delete(entry.id);
    };
  }, []);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const dirs: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      if (ev.key === "Escape" || ev.key === "Backspace") {
        ev.preventDefault();
        onBack?.();
        return;
      }

      const current = focusedIdRef.current
        ? registry.current.get(focusedIdRef.current)
        : null;

      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        current?.onSelect?.();
        return;
      }

      const dir = dirs[ev.key];
      if (!dir) return;
      ev.preventDefault();

      if (!current) {
        reset();
        return;
      }

      const next = bestCandidate(
        current.el,
        dir,
        attivi([...registry.current.values()]),
      );
      if (next) {
        setFocusedId(next.id);
        scrollTo(next.el);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, reset, scrollTo]);

  const api = useMemo<FocusApi>(
    () => ({ focusedId, register, focus, reset }),
    [focusedId, register, focus, reset],
  );

  return <FocusContext.Provider value={api}>{children}</FocusContext.Provider>;
}

export function useFocusSystem() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocusSystem fuori da FocusProvider");
  return ctx;
}

let seq = 0;

/**
 * Rende un elemento raggiungibile dal telecomando.
 * Restituisce il ref da applicare e se è attualmente a fuoco.
 */
export function useFocusable<T extends HTMLElement = HTMLElement>(
  opts: { onSelect?: () => void; autoFocus?: boolean } = {},
) {
  const { onSelect, autoFocus } = opts;
  const ref = useRef<T | null>(null);
  const id = useMemo(() => `f${++seq}`, []);
  const scope = useContext(ScopeContext);
  const { focusedId, register, focus } = useFocusSystem();

  // Il callback può cambiare a ogni render: lo teniamo in un ref così la
  // registrazione non si ricrea di continuo.
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    return register({
      id,
      el: ref.current,
      autoFocus,
      scope,
      onSelect: () => selectRef.current?.(),
    });
  }, [id, register, autoFocus, scope]);

  const focused = focusedId === id;

  return {
    ref,
    focused,
    /** Il puntatore resta utilizzabile: passare col mouse sposta il focus. */
    handlers: {
      onMouseEnter: () => focus(id),
      onClick: () => selectRef.current?.(),
    },
  };
}

/** Riporta il focus in cima quando cambia la schermata. */
export function useResetFocusOn(key: unknown) {
  const { reset } = useFocusSystem();
  useEffect(() => {
    const t = window.setTimeout(reset, 0);
    return () => window.clearTimeout(t);
  }, [key, reset]);
}
