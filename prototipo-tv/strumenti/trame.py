"""Completa le trame mancanti a blocchi (evita il limite di richieste). Uso: python -I trame.py <grezzo.json>"""
import json, sys, re, time, urllib.request, urllib.parse

UA = {"User-Agent": "CinetecaPrototipo/0.1 (personal prototype)"}

def extracts(titles):
    url = "https://it.wikipedia.org/w/api.php?" + urllib.parse.urlencode(dict(
        action="query", prop="extracts", exintro=1, explaintext=1, exlimit="max",
        titles="|".join(titles), format="json", formatversion="2", redirects=1))
    for t in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                d = json.loads(r.read().decode("utf8"))
            break
        except Exception as e:
            print("attendo", e, file=sys.stderr); time.sleep(10 * (t + 1))
    else:
        return {}
    red = {x["to"]: x["from"] for x in d["query"].get("redirects", [])}
    out = {}
    for p in d["query"]["pages"]:
        ex = (p.get("extract") or "").strip()
        if ex:
            out[red.get(p["title"], p["title"])] = ex
    return out

def corta(ex, n=3):
    ex = re.sub(r"\s*\([^()]*\)", "", ex)  # via le parentesi (date, titoli originali)
    frasi = re.split(r"(?<=[.!?])\s+", ex.split("\n")[0])
    return " ".join(frasi[:n]).strip()

data = json.load(open(sys.argv[1], encoding="utf8"))
voci = [x for x in data["film"] + data["serie"] if x.get("titolo_it") and not x.get("trama")]
attori = []
for f in data["film"]:
    for c in f["cast"]:
        if c.get("itwiki"): attori.append(c)
titoli = list(dict.fromkeys([v["titolo_it"] for v in voci] + [a["itwiki"] for a in attori]))
res = {}
for i in range(0, len(titoli), 15):
    res.update(extracts(titoli[i:i+15])); time.sleep(3)
for v in voci:
    if v["titolo_it"] in res: v["trama"] = corta(res[v["titolo_it"]])
for a in attori:
    if a["itwiki"] in res: a["bio"] = corta(res[a["itwiki"]], 2)
for v in data["film"] + data["serie"]:
    if v.get("trama"): v["trama"] = corta(v["trama"])
json.dump(data, open(sys.argv[1], "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("trame", sum(1 for v in data["film"] + data["serie"] if v.get("trama")), "di", len(data["film"]) + len(data["serie"]),
      "bio", sum(1 for a in attori if a.get("bio")))
