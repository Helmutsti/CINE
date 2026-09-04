/** Pittogrammi propri, ripresi dalla board. Nessun logo su licenza. */
type P = { size?: number | string };

const box = (size: number | string = "1.625rem") => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
});

export const IconHome = ({ size }: P) => (
  <svg {...box(size)} strokeLinejoin="round">
    <path d="M3 10.5 12 4l9 6.5V20H3z" />
  </svg>
);

export const IconCerca = ({ size }: P) => (
  <svg {...box(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconFilm = ({ size }: P) => (
  <svg {...box(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16" />
  </svg>
);

export const IconSerie = ({ size }: P) => (
  <svg {...box(size)}>
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M8 21h8" />
  </svg>
);

export const IconCuore = ({ size, pieno }: P & { pieno?: boolean }) => (
  <svg {...box(size)} fill={pieno ? "currentColor" : "none"} strokeLinejoin="round">
    <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z" />
  </svg>
);

export const IconImpostazioni = ({ size }: P) => (
  <svg {...box(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.2 14.4a1.6 1.6 0 0 0 .32 1.76l.06.06a1.9 1.9 0 1 1-2.7 2.7l-.05-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47v.17a1.9 1.9 0 1 1-3.8 0v-.09a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.76.32l-.06.06a1.9 1.9 0 1 1-2.7-2.7l.06-.06a1.6 1.6 0 0 0 .32-1.76 1.6 1.6 0 0 0-1.47-.97H3.4a1.9 1.9 0 1 1 0-3.8h.09A1.6 1.6 0 0 0 4.95 8.8a1.6 1.6 0 0 0-.32-1.76l-.06-.06a1.9 1.9 0 1 1 2.7-2.7l.06.06a1.6 1.6 0 0 0 1.76.32h.08A1.6 1.6 0 0 0 10.1 3.2V3.4a1.9 1.9 0 1 1 3.8 0v.09a1.6 1.6 0 0 0 .97 1.46 1.6 1.6 0 0 0 1.77-.32l.05-.06a1.9 1.9 0 1 1 2.7 2.7l-.06.06a1.6 1.6 0 0 0-.32 1.76v.08a1.6 1.6 0 0 0 1.47.97h.17a1.9 1.9 0 1 1 0 3.8h-.09a1.6 1.6 0 0 0-1.46.97z" />
  </svg>
);

export const IconPlay = ({ size = "1.1875rem" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);

export const IconPausa = ({ size = "1.1875rem" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4.5" width="4" height="15" rx="1" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" />
  </svg>
);

export const IconIndietro10 = ({ size }: P) => (
  <svg {...box(size)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 7 8.5 11 12" />
    <path d="M7 8.5h6.5A6.5 6.5 0 1 1 7 15" />
  </svg>
);

export const IconAvanti30 = ({ size }: P) => (
  <svg {...box(size)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 5l4 3.5L13 12" />
    <path d="M17 8.5h-6.5A6.5 6.5 0 1 0 17 15" />
  </svg>
);

/* — Pittogrammi tecnici: dichiarano dati reali letti dal file — */

export const IconRisoluzione = ({ size = "1.25rem" }: P) => (
  <svg {...box(size)} strokeWidth={1.5}>
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
  </svg>
);

export const IconHdr = ({ size = "1.25rem" }: P) => (
  <svg {...box(size)} strokeWidth={1.5}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconAudio = ({ size = "1.25rem" }: P) => (
  <svg {...box(size)} strokeWidth={1.5} strokeLinejoin="round">
    <path d="M4 9.5h3.5L12 6v12L7.5 14.5H4z" />
    <path d="M16 9.5a4 4 0 0 1 0 5" />
    <path d="M18.6 7a7.5 7.5 0 0 1 0 10" />
  </svg>
);

export const IconSottotitoli = ({ size = "1.25rem" }: P) => (
  <svg {...box(size)} strokeWidth={1.5} strokeLinecap="round">
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M6.5 14.5h5M14 14.5h3.5" />
  </svg>
);

export const IconAudiodescrizione = ({ size = "1.25rem" }: P) => (
  <svg {...box(size)} strokeWidth={1.5} strokeLinecap="round">
    <path d="M8 20v-5a4.5 4.5 0 1 1 9 0c0 2-1.6 2.6-2.6 3.4-.7.6-.9 1.1-.9 1.9" />
    <path d="M4.6 6.2a9 9 0 0 1 3-2.1M4 10.2a5.4 5.4 0 0 1 1.3-2.7" />
  </svg>
);

export const IconCapitoli = ({ size = "1.25rem" }: P) => (
  <svg {...box(size)} strokeWidth={1.5} strokeLinecap="round">
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);

export const IconIndietro = ({ size = "1.25rem" }: P) => (
  <svg {...box(size)} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
