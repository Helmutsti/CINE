# AGENTS.md – Cineteca

Istruzioni per gli agenti IA che lavorano su questo progetto.

## Il progetto
Applicazione web in stile Plex per guardare una libreria multimediale **locale** (film e serie posseduti), con un'unica interfaccia per tutta la casa: TV con telecomando come superficie principale, poi web desktop, tablet e mobile. Vincolo guida: veloce ed essenziale, deve girare bene anche su hardware datato. Contesto tecnico in `PROGETTO-TECNICO.md`; decisioni tecniche in pausa in `PILASTRI.md`.

## Design

Il lavoro grafico segue la skill **design-figma** (il metodo è nel file `guida.md` della skill). Questa sezione contiene solo i dati di questo progetto. Dove una regola qui sotto è diversa dalla guida, vale questa.

### File Figma
| File | Link | Note |
|---|---|---|
| Libreria (design system) | https://www.figma.com/design/eYNqEwanEOjEg1AvAuvqaE | Pagine: Moodboard, Direzioni, Token, Componenti base, Componenti composti, Prove |
| Mockup (file di lavoro) | https://www.figma.com/design/e5fAumwlY1theDJrlsmnD9 | Usa la libreria pubblicata. Frame delle schermate con il codice `SC-`. Pagine: TV (`0:1`), Mobile (`1:2`) |
| Riferimento (vecchio design "Granito") | https://www.figma.com/design/w5Lw5jmVjFjBilyf5Vynvq | **Solo lettura.** Pagine: 01 · TV — Granito (`0:1`), 02 · Mobile (`2:2`), 03 · Componenti Granito (`2:3`), 04 · Fondamenti e consegna (`2:4`), 05 · Archivio — sistemi visivi (`2:5`, fuori perimetro). Non è una fonte di verità: serve per recuperare i token |

ID delle pagine (per i controlli automatici):
| Pagina | File | ID |
|---|---|---|
| Moodboard | Libreria | 0:1 |
| Direzioni | Libreria | 1:2 |
| Token | Libreria | 1:3 |
| Componenti base | Libreria | 1:4 |
| Componenti composti | Libreria | 1:5 |
| Prove | Libreria | 1:6 – esclusa dai controlli |

### Documenti del design
Cartella: `docs/design/` (flussi, moodboard, tokens, componenti, schermate, registro, immagini).

La cartella `design/` alla radice **non** fa parte del metodo: è l'export del vecchio progetto su Claude Design, tenuto come riferimento.

### Codici
`SC-` schermate · `CMP-` componenti

### Verifica
Comando: `/verifica-design` (`.claude/commands/verifica-design.md`). Da lanciare dopo ogni giro di modifiche e prima di chiudere una fase di disegno.

### Come si lavora
- **Livello di controllo di base:** passo per passo
- **Chi decide:** Manuel Cucca
- **Lingua dei nomi** in Figma e nel codice: italiano in Figma (deciso il 2026-10-08); nel codice rinviato, insieme al codice (`docs/design/registro.md`)
- **Nomi dei token nel codice:** rinviati con il codice. I semantici già presenti nel codice portano il nome CSS di oggi nel campo WEB della variabile (`--bg`, `--surface-raised`… in `app/src/styles/tokens.css`)

### Eccezioni del progetto
- **Recupero con ridisegno completo.** Il recupero (guida §10) qui non conserva l'aspetto approvato: UX e UI si rivedono da capo. Del lavoro precedente si recuperano solo i token, come base per R3. Decisione del 2026-10-08 in `registro.md`.

## Codice
Prototipo React con dati finti in `app/` (Vite 8, React 19, TypeScript). Avvio: `cd app && npm install && npm run dev`. Lint: `npm run lint` (oxlint). Token CSS in `app/src/styles/tokens.css`, unica fonte dello stile nel codice. Navigazione a D-pad in `app/src/focus/Focus.tsx`.
