/**
 * Percorre l'app e ne raccoglie le schermate. Naviga per contenuto (clic su
 * elementi identificati dal testo) così il giro è ripetibile; la tastiera
 * viene usata solo dove serve provare davvero il focus da telecomando.
 *
 *   node giro.mjs <cartella-di-uscita> [url]
 */
import { chromium } from "playwright";

const OUT = process.argv[2];
const URL = process.argv[3] ?? "http://localhost:5174/";

const errori = [];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });

page.on("console", (m) => m.type() === "error" && errori.push(m.text()));
page.on("pageerror", (e) => errori.push(`pageerror: ${e.message}`));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const scatta = async (nome) => {
  await page.waitForTimeout(420);
  await page.screenshot({ path: `${OUT}/${nome}.png` });
  console.log("→", nome);
};

const vaiA = async (sezione) => {
  await page.click(`.sidebar__item[title="${sezione}"]`);
  await page.waitForTimeout(350);
};

const key = async (k, n = 1) => {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(k);
    await page.waitForTimeout(80);
  }
};

// 01 — Home, focus iniziale sul play in evidenza
await scatta("01-home");

// 02 — La sidebar si apre quando il focus ci entra (solo tastiera)
await key("ArrowDown");
await key("ArrowLeft", 5);
await scatta("02-sidebar-aperta");

// 03 — Focus su una card della riga: la cornice, non l'ingrandimento
await key("ArrowRight");
await key("ArrowRight");
await scatta("03-focus-card");

// 04 — Catalogo film
await vaiA("Film");
await scatta("04-catalogo-film");

// 05 — Scheda film (titolo senza avanzamento: nessun popup)
await page.click('.card:has-text("Spazio")');
await scatta("05-scheda-film");

// 06 — Player
await page.click('.btn--primario:has-text("Guarda")');
await page.waitForTimeout(600);
await scatta("06-player");

// 07 — Pannello sottotitoli
await page.click(".player__controlli--destra .tondo:nth-child(2)");
await scatta("07-player-sottotitoli");
await key("Escape");
await page.waitForTimeout(300);

// 08 — Popup di ripresa su un titolo già iniziato
await vaiA("Home");
await page.click('.card:has-text("Delitto a Nord")');
await scatta("08-dialogo-ripresa");
await page.click('.btn:has-text("Vai alla scheda")');
await page.waitForTimeout(400);

// 09 — Scheda film con avanzamento e badge tecnici
await scatta("09-scheda-con-ripresa");

// 10 — Scheda serie con stagioni ed episodi
await vaiA("Serie");
await page.click('.card:has-text("Linea di costa")');
await page.waitForTimeout(400);
await page.click('.btn:has-text("Vai alla scheda")');
await page.waitForTimeout(400);
await page.mouse.wheel(0, 700);
await scatta("10-scheda-serie");

// 11 — Ricerca: tastiera a schermo e risultati
await vaiA("Cerca");
await scatta("11-ricerca-generi");
for (const c of ["D", "E", "L"]) await page.click(`.tasto:text-is("${c}")`);
await scatta("12-ricerca-risultati");

// 13 — Nessun risultato
for (const c of ["Z", "Z"]) await page.click(`.tasto:text-is("${c}")`);
await scatta("13-nessun-risultato");

// 14 — Errore di riproduzione (file che il client non sa decodificare)
await vaiA("Film");
await page.click('.card:has-text("Meridiana")');
await page.waitForTimeout(400);
await page.click('.btn--primario:has-text("Guarda")');
await scatta("14-errore-riproduzione");
await key("Escape");

// 15 — Preferiti
await vaiA("Preferiti");
await scatta("15-preferiti");

// 16 — Impostazioni
await vaiA("Impostazioni");
await scatta("16-impostazioni");

// 17/18 — Mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
m.on("pageerror", (e) => errori.push(`mobile pageerror: ${e.message}`));
await m.goto(URL, { waitUntil: "networkidle" });
await m.waitForTimeout(800);
await m.screenshot({ path: `${OUT}/17-mobile-home.png` });
console.log("→ 17-mobile-home");

await m.click('.card:has-text("Acqua alta")');
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/18-mobile-scheda.png` });
console.log("→ 18-mobile-scheda");

await b.close();
console.log("\n=== ERRORI CONSOLE ===");
console.log(errori.length ? errori.join("\n") : "nessuno");
