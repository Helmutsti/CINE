"""Dal grezzo al catalogo del prototipo, con immagini scaricate e ridimensionate.
Uso: venv/python -I costruisci.py <grezzo.json> <cartella media> <catalogo.json>
"""
import json, sys, re, io, os, time, hashlib, random, urllib.request, urllib.parse
from PIL import Image

UA = {"User-Agent": "CinetecaPrototipo/0.1 (personal prototype; manuel.cucca@mepinformatica.it)"}
GREZZO, MEDIA, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(MEDIA, exist_ok=True)
random.seed(7)

def fetch(url, tries=4, headers=None):
    for t in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={**UA, **(headers or {})}), timeout=60) as r:
                return r.read()
        except Exception as e:
            if t == tries - 1:
                print("ERR", url[:110], e, file=sys.stderr); return None
            time.sleep(20 * (t + 1) if "429" in str(e) else 4 * (t + 1))

def getj(url, headers=None):
    b = fetch(url, headers=headers)
    return json.loads(b.decode("utf8")) if b else None

def salva(url, nome, larghezza, headers=None):
    """Scarica, ridimensiona a `larghezza`, salva in JPEG. Ritorna il percorso pubblico."""
    dest = os.path.join(MEDIA, nome + ".jpg")
    if os.path.exists(dest): return "media/" + nome + ".jpg"
    b = fetch(url, headers=headers)
    if not b: return None
    try:
        im = Image.open(io.BytesIO(b)).convert("RGB")
    except Exception as e:
        print("img?", url[:80], e, file=sys.stderr); return None
    if im.width > larghezza:
        im = im.resize((larghezza, round(im.height * larghezza / im.width)), Image.LANCZOS)
    im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
    time.sleep(1.0 if "wikimedia" in url else 0.2)
    return "media/" + nome + ".jpg"

def slug(s):
    s = s.lower()
    s = re.sub(r"[àá]", "a", s); s = re.sub(r"[èé]", "e", s); s = re.sub(r"[ìí]", "i", s)
    s = re.sub(r"[òóö]", "o", s); s = re.sub(r"[ùú]", "u", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:40]

# ---------- commons ----------
def commons_info(files, width):
    out = {}
    for i in range(0, len(files), 40):
        d = getj("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(dict(
            action="query", titles="|".join("File:" + f for f in files[i:i+40]), prop="imageinfo",
            iiprop="url|size|mime", iiurlwidth=width, format="json", formatversion="2", redirects=1)))
        if not d: continue
        norm = {x["to"]: x["from"] for x in d["query"].get("normalized", [])}
        for p in d["query"]["pages"]:
            ii = (p.get("imageinfo") or [None])[0]
            if ii:
                out[norm.get(p["title"], p["title"])[5:]] = ii
        time.sleep(1)
    return out

def en_info(files, width):
    """Immagini locali di en.wikipedia (es. locandine non su commons)."""
    out = {}
    for i in range(0, len(files), 40):
        d = getj("https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(dict(
            action="query", titles="|".join("File:" + f for f in files[i:i+40]), prop="imageinfo",
            iiprop="url|size|mime", iiurlwidth=width, format="json", formatversion="2", redirects=1)))
        if not d: continue
        norm = {x["to"]: x["from"] for x in d["query"].get("normalized", [])}
        for p in d["query"]["pages"]:
            ii = (p.get("imageinfo") or [None])[0]
            if ii: out[norm.get(p["title"], p["title"])[5:]] = ii
    return out

SCARTA = re.compile(r"logo|poster|map|signature|firma|icon|flag|commons|wiki|portrait|headshot|\.svg|award|oscar|grave|tomb|book|cover|title.?card|lobby", re.I)

# ---------- trama dalla sezione Trama ----------
def trama_sezione(titolo_it):
    d = getj("https://it.wikipedia.org/w/api.php?" + urllib.parse.urlencode(dict(
        action="query", prop="extracts", explaintext=1, exsectionformat="wiki", titles=titolo_it,
        format="json", formatversion="2", redirects=1)))
    time.sleep(1.2)
    try:
        testo = d["query"]["pages"][0]["extract"]
    except Exception:
        return None
    m = re.search(r"\n==\s*(Trama|Sinossi|Storia|Trama e personaggi)\s*==\n(.+?)(\n==|\Z)", testo, re.S)
    if not m: return None
    corpo = re.sub(r"\n===.*?===\n", "\n", m.group(2)).strip()
    corpo = re.sub(r"\s*\([^()]*\)", "", corpo.split("\n")[0])
    frasi = re.split(r"(?<=[.!?])\s+", corpo)
    out = ""
    for f in frasi:
        if len(out) + len(f) > 280 and out: break
        out = (out + " " + f).strip()
    return out or None

# ---------- generi ----------
GEN_EN = {"Drama": "Drammatico", "Crime": "Poliziesco", "Thriller": "Thriller", "Mystery": "Giallo",
          "Science-Fiction": "Fantascienza", "Horror": "Horror", "Comedy": "Commedia", "History": "Storico",
          "Fantasy": "Fantastico", "Adventure": "Avventura", "Action": "Azione", "Supernatural": "Soprannaturale",
          "Family": "Famiglia", "Romance": "Sentimentale", "War": "Guerra", "Espionage": "Spionaggio",
          "Legal": "Legale", "Medical": "Medico", "Food": "Cucina", "Animation": "Animazione"}

def genere_it(g):
    g = re.sub(r"^(film|cinema|genere)\s+(di|del|dell'|d')?\s*", "", g or "", flags=re.I).strip()
    g = {"muto": "Muto", "commedia": "Commedia", "noir": "Noir", "orrore": "Horror", "horror": "Horror",
         "drammatico": "Drammatico", "fantascienza": "Fantascienza", "d'animazione": "Animazione",
         "animazione": "Animazione", "thriller": "Thriller", "poliziesco": "Poliziesco", "western": "Western",
         "avventura": "Avventura", "sentimentale": "Sentimentale", "comico": "Commedia", "fantastico": "Fantastico",
         "commedia sofisticata": "Commedia", "commedia romantica": "Commedia", "cortometraggio": "Corto"}.get(g.lower(), g)
    return g[:1].upper() + g[1:] if g else None

# =====================================================================
grezzo = json.load(open(GREZZO, encoding="utf8"))
persone = {}
catalogo = dict(film=[], serie=[], persone=[], collezioni=[])

def persona(chiave, nome, foto_url, bio=None, nascita=None, luogo=None, sesso=None):
    if chiave in persone: return chiave
    foto = salva(foto_url, "p-" + slug(nome), 360) if foto_url else None
    persone[chiave] = dict(id=chiave, nome=nome, foto=foto, bio=bio, nascita=nascita, luogo=luogo, sesso=sesso, titoli=[])
    return chiave

# ---------- FILM da Wikipedia/Wikidata ----------
film_grezzi = [f for f in grezzo["film"] if f["titolo"] not in ("Sahara", "Caminandes")]
poster_files = [urllib.parse.unquote(f["poster"].split("?")[0].split("/")[-1]) for f in film_grezzi if f.get("poster")]
cand = sorted({c for f in film_grezzi for c in f["immagini"] if not SCARTA.search(c)})
info = commons_info(cand, 1920)
info.update(commons_info(poster_files, 500))
manca = [p for p in poster_files if p not in info]
info.update(en_info(manca, 500))
# foto del cast
foto_files = sorted({c["foto"] for f in film_grezzi for c in f["cast"] if c.get("foto")})
finfo = commons_info(foto_files, 330)

def thumb(ii):
    # mai l'originale: solo miniature (chiesto da Wikimedia)
    return ii.get("thumburl") if ii.get("thumburl") and "/thumb/" in ii["thumburl"] else None

def migliore_orizzontale(f):
    best = None
    for c in f["immagini"]:
        ii = info.get(c)
        if not ii or SCARTA.search(c) or ii.get("mime") not in ("image/jpeg", "image/png"): continue
        w, h = ii["width"], ii["height"]
        r = w / h
        if 1.25 <= r <= 2.4 and w >= 640:
            score = w * (1.0 if 1.6 <= r <= 2.0 else 0.7)
            if not best or score > best[0]: best = (score, ii)
    return best and best[1]

for f in film_grezzi:
    fid = "f-" + slug(f["titolo"])
    pf = urllib.parse.unquote(f["poster"].split("?")[0].split("/")[-1]) if f.get("poster") else None
    pii = info.get(pf) if pf else None
    poster = salva(thumb(pii) or pii["url"], fid + "-poster", 500) if pii else None
    bii = migliore_orizzontale(f)
    sfondo = salva(thumb(bii) or bii["url"], fid + "-sfondo", 1920) if bii else None
    minuti = f["minuti"]
    if minuti and minuti > 300: minuti = round(minuti / 60)
    cast = []
    for c in f["cast"][:8]:
        if not c.get("nome"): continue
        fi = finfo.get(c["foto"]) if c.get("foto") else None
        nasc = c.get("nascita", {}) or {}
        anno_n = nasc.get("time", "")[1:5] if nasc else None
        cast.append(persona("a-" + c["qid"], c["nome"], fi and (thumb(fi) or fi["url"]), c.get("bio"),
                            anno_n, None, "F" if "Q6581072" in c.get("sesso", []) else "M"))
    trama = (trama_sezione(f["titolo_it"]) if f.get("titolo_it") else None) or f.get("trama")
    catalogo["film"].append(dict(
        id=fid, tipo="film", titolo=f["titolo"], anno=f["anno"], minuti=minuti,
        generi=[g for g in dict.fromkeys(genere_it(x) for x in f["generi"]) if g][:3],
        regia=f["regia"][:1], trama=trama, poster=poster, sfondo=sfondo, cast=cast, fonte="wikipedia"))
    print("film", f["titolo"], bool(poster), bool(sfondo), file=sys.stderr)

# ---------- FILM dal server di prova Jellyfin ----------
JF = "https://demo.jellyfin.org/stable"
auth = json.loads(urllib.request.urlopen(urllib.request.Request(JF + "/Users/AuthenticateByName",
    data=json.dumps({"Username": "demo", "Pw": ""}).encode(), method="POST",
    headers={**UA, "Content-Type": "application/json",
             "Authorization": 'MediaBrowser Client="proto", Device="pc", DeviceId="proto1", Version="1.0"'})).read())
TOK, UID = auth["AccessToken"], auth["User"]["Id"]
JH = {"Authorization": f'MediaBrowser Token="{TOK}"'}
jitems = getj(f"{JF}/Items?userId={UID}&Recursive=true&IncludeItemTypes=Movie&Fields=Overview,Genres,People,ProductionYear,RunTimeTicks", JH)["Items"]
for it in jitems:
    nome = it["Name"]
    fid = "f-" + slug(nome)
    esistente = next((x for x in catalogo["film"] if x["anno"] == it.get("ProductionYear") and (
        slug(x["titolo"]) == slug(nome) or x["titolo"] in ("La notte dei morti viventi", "Dracula", "Assalto al treno", "Il libro della giungla"))), None)
    poster = salva(f"{JF}/Items/{it['Id']}/Images/Primary?maxWidth=500", fid + "-jf-poster", 500, JH) if "Primary" in it.get("ImageTags", {}) else None
    sfondo = salva(f"{JF}/Items/{it['Id']}/Images/Backdrop/0?maxWidth=1920", fid + "-jf-sfondo", 1920, JH) if it.get("BackdropImageTags") else None
    if esistente:
        esistente["poster"] = esistente["poster"] or poster
        esistente["sfondo"] = sfondo or esistente["sfondo"]
        continue
    cast = []
    for p in it.get("People", [])[:8]:
        if p.get("Type") != "Actor" and len(it.get("People", [])) > 4: continue
        foto = f"{JF}/Items/{p['Id']}/Images/Primary?maxWidth=360" if p.get("PrimaryImageTag") else None
        cast.append(persona("j-" + p["Id"], p["Name"], foto))
        if foto and persone["j-" + p["Id"]]["foto"] is None:
            persone["j-" + p["Id"]]["foto"] = salva(foto, "p-" + slug(p["Name"]), 360, JH)
    catalogo["film"].append(dict(
        id=fid, tipo="film", titolo=nome, anno=it.get("ProductionYear"),
        minuti=round(it.get("RunTimeTicks", 0) / 600_000_000) or None,
        generi=[GEN_EN.get(g, g) for g in it.get("Genres", [])][:3],
        regia=[p["Name"] for p in it.get("People", []) if p.get("Type") == "Director"][:1],
        trama=it.get("Overview"), poster=poster, sfondo=sfondo, cast=cast, fonte="jellyfin"))
    print("jf", nome, bool(poster), bool(sfondo), file=sys.stderr)

# ---------- SERIE da TVmaze ----------
for s in grezzo["serie"]:
    sid = "s-" + slug(s["nome"])
    imgs = s["immagini"]
    pst = next((i for i in imgs if i["tipo"] == "poster" and i.get("main")), None) or next((i for i in imgs if i["tipo"] == "poster"), None)
    bgs = sorted([i for i in imgs if i["tipo"] == "background"], key=lambda i: -(i["w"] or 0))
    poster = salva(pst["url"], sid + "-poster", 500) if pst else None
    sfondo = salva(bgs[0]["url"], sid + "-sfondo", 1920) if bgs else None
    cast = []
    for c in s["cast"][:8]:
        cast.append(persona("t-%d" % c["id"], c["nome"], c.get("foto"), None,
                            (c.get("nascita") or "")[:4] or None, c.get("paese"), "F" if c.get("sesso") == "Female" else "M"))
    stagioni = []
    for n in sorted({e["s"] for e in s["episodi"]})[:3]:
        eps = []
        for e in [x for x in s["episodi"] if x["s"] == n][:10]:
            img = salva(e["img"], f"{sid}-s{n}e{e['e']}", 640) if e.get("img") else None
            eps.append(dict(id=f"{sid}-s{n}e{e['e']}", numero=e["e"], titolo=e["nome"], minuti=e.get("minuti") or 50, img=img))
        stagioni.append(dict(numero=n, episodi=eps))
    trama = (trama_sezione(s["titolo_it"]) if s.get("titolo_it") else None) or s.get("trama") or s["riassunto"]
    titolo = {"MINDHUNTER": "Mindhunter", "Gomorra: La Serie": "Gomorra", "Severance": "Scissione"}.get(s["nome"], s["nome"])
    catalogo["serie"].append(dict(
        id=sid, tipo="serie", titolo=titolo, anno=s["anno"], generi=[GEN_EN.get(g, g) for g in s["generi"]][:3],
        trama=trama, poster=poster, sfondo=sfondo, cast=cast, stagioni=stagioni,
        stagioniTotali=len({e["s"] for e in s["episodi"]})))
    print("serie", titolo, bool(poster), bool(sfondo), file=sys.stderr)

# ---------- persone: titoli ----------
for t in catalogo["film"] + catalogo["serie"]:
    for p in t["cast"]:
        persone[p]["titoli"].append(t["id"])
catalogo["persone"] = list(persone.values())
json.dump(catalogo, open(OUT, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("film", len(catalogo["film"]), "serie", len(catalogo["serie"]), "persone", len(persone))
