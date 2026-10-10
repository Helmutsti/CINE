"""Raccoglie i metadati (senza scaricare immagini) per il prototipo.
Uso: python -I raccogli.py <out.json>
"""
import json, sys, re, urllib.request, urllib.parse, time

UA = {"User-Agent": "CinetecaPrototipo/0.1 (personal prototype; manuel)"}

def get(url, tries=3):
    for t in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode("utf8"))
        except Exception as e:
            if t == tries - 1:
                print("ERR", url[:120], e, file=sys.stderr)
                return None
            time.sleep(2)

def wp(lang, **params):
    params.update(format="json", formatversion="2")
    return get(f"https://{lang}.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params))

def wd_entities(ids, props="labels|claims|sitelinks|descriptions"):
    out = {}
    ids = list(dict.fromkeys(ids))
    for i in range(0, len(ids), 40):
        d = get("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(dict(
            action="wbgetentities", ids="|".join(ids[i:i+40]), props=props,
            languages="it|en", format="json")))
        if d: out.update(d.get("entities", {}))
    return out

def label(e):
    l = e.get("labels", {})
    return (l.get("it") or l.get("en") or {}).get("value")

def claim_ids(e, p):
    res = []
    for c in e.get("claims", {}).get(p, []):
        v = c["mainsnak"].get("datavalue", {}).get("value")
        if isinstance(v, dict) and "id" in v: res.append(v["id"])
    return res

def claim_val(e, p):
    for c in e.get("claims", {}).get(p, []):
        v = c["mainsnak"].get("datavalue", {}).get("value")
        if v is not None: return v
    return None

def commons_url(filename, width):
    d = get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(dict(
        action="query", titles="File:" + filename, prop="imageinfo", iiprop="url|size",
        iiurlwidth=width, format="json", formatversion="2")))
    try:
        ii = d["query"]["pages"][0]["imageinfo"][0]
        return ii.get("thumburl") or ii["url"], ii["width"], ii["height"]
    except Exception:
        return None

def it_extract(title, sentences=3):
    d = wp("it", action="query", prop="extracts", exintro=1, explaintext=1, exsentences=sentences, titles=title)
    try:
        return d["query"]["pages"][0].get("extract", "").strip() or None
    except Exception:
        return None

# ---------------- FILM ----------------
FILM = [
    # (titolo en.wikipedia, ruolo in libreria)
    "Sintel", "Big_Buck_Bunny", "Tears_of_Steel", "Elephants_Dream", "Spring_(2019_film)",
    "Cosmos_Laundromat", "Caminandes",
    "Metropolis_(1927_film)", "Nosferatu", "The_General_(1926_film)", "Sherlock_Jr.",
    "Charade_(1963_film)", "His_Girl_Friday", "The_Kid_(1921_film)", "Safety_Last!",
    "A_Trip_to_the_Moon", "The_Cabinet_of_Dr._Caligari", "Plan_9_from_Outer_Space",
    "The_Little_Shop_of_Horrors", "Detour_(1945_film)", "The_Hitch-Hiker", "Carnival_of_Souls",
    "Gulliver's_Travels_(1939_film)", "Night_of_the_Living_Dead", "Dracula_(1931_English-language_film)",
    "The_Great_Train_Robbery_(1903_film)", "Jungle_Book_(1942_film)", "Sahara_(1943_film)",
    "The_Phantom_of_the_Opera_(1925_film)", "Nosferatu", "The_Last_Man_on_Earth_(1964_film)",
    "House_on_Haunted_Hill", "The_Man_with_the_Golden_Arm", "Scarlet_Street", "D.O.A._(1949_film)",
    "Kansas_City_Confidential", "The_Stranger_(1946_film)", "Penny_Serenade", "My_Man_Godfrey",
    "It%27s_a_Wonderful_Life", "The_Gold_Rush", "Battleship_Potemkin", "Steamboat_Bill,_Jr.",
    "The_Lodger:_A_Story_of_the_London_Fog", "Things_to_Come",
]

def films():
    titles = [urllib.parse.unquote(t) for t in dict.fromkeys(FILM)]
    pages = {}
    for i in range(0, len(titles), 20):
        d = wp("en", action="query", titles="|".join(titles[i:i+20]), prop="pageprops|pageimages|images",
               piprop="original", imlimit="max", redirects=1)
        for p in d["query"]["pages"]:
            if "missing" in p: print("manca", p["title"], file=sys.stderr); continue
            pages[p["title"]] = p
    qids = {t: p.get("pageprops", {}).get("wikibase_item") for t, p in pages.items()}
    ents = wd_entities([q for q in qids.values() if q])
    # entita collegate: cast, regia, generi
    rel = []
    for q in qids.values():
        e = ents.get(q, {})
        rel += claim_ids(e, "P161")[:10] + claim_ids(e, "P57")[:2] + claim_ids(e, "P136")[:4]
    rents = wd_entities(rel)
    out = []
    for t, p in pages.items():
        q = qids.get(t); e = ents.get(q, {})
        if not e: continue
        it_title = e.get("sitelinks", {}).get("itwiki", {}).get("title")
        year = None
        d = claim_val(e, "P577")
        if d: year = int(d["time"][1:5])
        dur = claim_val(e, "P2047")
        minutes = None
        if dur:
            try: minutes = round(float(dur["amount"]))
            except Exception: pass
        # immagine orizzontale: le immagini della pagina, la più larga in orizzontale
        cand = [im["title"][5:] for im in p.get("images", []) if re.search(r"\.(jpe?g|png)$", im["title"], re.I)]
        out.append(dict(
            wiki=t, qid=q, titolo=label(e) or t, titolo_it=it_title, anno=year, minuti=minutes,
            poster=p.get("original", {}).get("source"), poster_wh=(p.get("original", {}).get("width"), p.get("original", {}).get("height")),
            immagini=cand[:25],
            regia=[label(rents[x]) for x in claim_ids(e, "P57")[:2] if x in rents],
            generi=[label(rents[x]) for x in claim_ids(e, "P136")[:4] if x in rents],
            cast=[dict(qid=x, nome=label(rents[x]), foto=claim_val(rents[x], "P18"),
                       nascita=claim_val(rents[x], "P569"),
                       itwiki=rents[x].get("sitelinks", {}).get("itwiki", {}).get("title"),
                       sesso=claim_ids(rents[x], "P21"))
                  for x in claim_ids(e, "P161")[:10] if x in rents],
            trama=it_extract(it_title) if it_title else None,
        ))
    return out

# ---------------- SERIE ----------------
SERIE = ["Dark", "Chernobyl", "True Detective", "Mindhunter", "Severance", "The Crown",
         "Gomorrah", "Babylon Berlin", "Stranger Things", "The Bear", "Fargo", "Sherlock"]

def serie():
    out = []
    for name in SERIE:
        s = get("https://api.tvmaze.com/singlesearch/shows?" + urllib.parse.urlencode({"q": name}) + "&embed[]=images&embed[]=cast&embed[]=episodes&embed[]=seasons")
        if not s: continue
        imdb = s.get("externals", {}).get("imdb")
        trama = None; titolo_it = None
        if imdb:
            sp = get("https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(
                f'SELECT ?it WHERE {{ ?s wdt:P345 "{imdb}". ?it schema:about ?s; schema:isPartOf <https://it.wikipedia.org/>. }}'))
            try:
                titolo_it = urllib.parse.unquote(sp["results"]["bindings"][0]["it"]["value"].rsplit("/", 1)[1]).replace("_", " ")
                trama = it_extract(titolo_it)
            except Exception:
                pass
        out.append(dict(
            id=s["id"], nome=s["name"], titolo_it=titolo_it, anno=int(s["premiered"][:4]) if s.get("premiered") else None,
            generi=s.get("genres", []), riassunto=re.sub("<[^>]+>", "", s.get("summary") or ""), trama=trama,
            immagini=[dict(tipo=i["type"], url=i["resolutions"]["original"]["url"], w=i["resolutions"]["original"].get("width"), h=i["resolutions"]["original"].get("height"), main=i.get("main"))
                      for i in s["_embedded"]["images"] if i.get("resolutions", {}).get("original")],
            cast=[dict(id=c["person"]["id"], nome=c["person"]["name"], foto=(c["person"].get("image") or {}).get("original"),
                       nascita=c["person"].get("birthday"), paese=(c["person"].get("country") or {}).get("name"),
                       sesso=c["person"].get("gender"))
                  for c in s["_embedded"]["cast"][:10]],
            episodi=[dict(s=e["season"], e=e["number"], nome=e["name"], minuti=e.get("runtime"),
                          img=(e.get("image") or {}).get("original"), trama=re.sub("<[^>]+>", "", e.get("summary") or ""))
                     for e in s["_embedded"]["episodes"] if e.get("number")],
        ))
    return out

if __name__ == "__main__":
    data = dict(film=films(), serie=serie())
    json.dump(data, open(sys.argv[1], "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print("film", len(data["film"]), "serie", len(data["serie"]))
