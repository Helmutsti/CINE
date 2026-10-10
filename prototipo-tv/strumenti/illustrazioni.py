"""Illustrazioni monocromatiche (SVG 16:9) per le card di Generi e Mood.
Uso: python -I illustrazioni.py <cartella di uscita>
Ogni immagine: una sola tinta (fondo scuro, simbolo nei toni chiari), simbolo a destra, spazio a sinistra per il nome.
"""
import os, sys, math

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
W, H = 1600, 900

def svg(nome, tinta, corpo):
    h = tinta
    c = {  # toni della stessa tinta
        'f1': f'hsl({h} 38% 16%)', 'f2': f'hsl({h} 45% 8%)',
        'scuro': f'hsl({h} 40% 26%)', 'medio': f'hsl({h} 48% 42%)',
        'chiaro': f'hsl({h} 60% 66%)', 'luce': f'hsl({h} 75% 86%)',
    }
    body = corpo(c)
    s = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c['f1']}"/><stop offset="1" stop-color="{c['f2']}"/></linearGradient>
  <radialGradient id="alone" cx="0.72" cy="0.42" r="0.55"><stop offset="0" stop-color="{c['medio']}" stop-opacity="0.45"/><stop offset="1" stop-color="{c['medio']}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="{W}" height="{H}" fill="url(#g)"/>
<rect width="{W}" height="{H}" fill="url(#alone)"/>
{body}
</svg>'''
    open(os.path.join(OUT, nome + '.svg'), 'w', encoding='utf8').write(s)

def punti(c, n=40, seme=1, colore='luce', r=(2, 5), area=(700, 1600, 0, 900)):
    import random
    rnd = random.Random(seme)
    return ''.join(f'<circle cx="{rnd.uniform(area[0], area[1]):.0f}" cy="{rnd.uniform(area[2], area[3]):.0f}" r="{rnd.uniform(*r):.1f}" fill="{c[colore]}" opacity="{rnd.uniform(.3, .9):.2f}"/>' for _ in range(n))

def stella(cx, cy, R, r, n=5, rot=-90):
    p = []
    for i in range(2 * n):
        a = math.radians(rot + i * 180 / n)
        rr = R if i % 2 == 0 else r
        p.append(f'{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}')
    return ' '.join(p)

# ---------------- GENERI ----------------
def drammatico(c):  # maschera tragica
    return f'''<g transform="translate(1080 450) rotate(-8)">
  <path d="M-230 -260 Q0 -330 230 -260 Q260 40 120 230 Q0 330 -120 230 Q-260 40 -230 -260Z" fill="{c['chiaro']}"/>
  <path d="M-150 -90 Q-95 -150 -40 -90 Q-95 -60 -150 -90Z" fill="{c['f2']}"/>
  <path d="M40 -90 Q95 -150 150 -90 Q95 -60 40 -90Z" fill="{c['f2']}"/>
  <path d="M-90 160 Q0 80 90 160" stroke="{c['f2']}" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M-95 -40 Q-105 20 -95 60" stroke="{c['medio']}" stroke-width="12" fill="none" stroke-linecap="round"/>
</g>'''

def commedia(c):  # maschera comica
    return f'''<g transform="translate(1100 450) rotate(10)">
  <path d="M-230 -260 Q0 -330 230 -260 Q260 40 120 230 Q0 330 -120 230 Q-260 40 -230 -260Z" fill="{c['chiaro']}"/>
  <path d="M-150 -70 Q-95 -140 -40 -70" stroke="{c['f2']}" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M40 -70 Q95 -140 150 -70" stroke="{c['f2']}" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M-120 70 Q0 230 120 70 Z" fill="{c['f2']}"/>
</g>
<circle cx="760" cy="200" r="22" fill="{c['luce']}"/><circle cx="1470" cy="180" r="14" fill="{c['luce']}"/><circle cx="1500" cy="700" r="18" fill="{c['medio']}"/>'''

def fantascienza(c):  # pianeta con anello
    return f'''{punti(c, 70, 3)}
<g transform="translate(1110 440) rotate(-18)">
  <ellipse rx="420" ry="90" fill="none" stroke="{c['medio']}" stroke-width="26"/>
  <circle r="230" fill="{c['chiaro']}"/>
  <path d="M-230 0 A230 230 0 0 0 230 0 Z" fill="{c['medio']}" opacity=".55"/>
  <path d="M-420 0 A420 90 0 0 0 420 0" fill="none" stroke="{c['luce']}" stroke-width="26"/>
</g>'''

def giallo(c):  # lente d'ingrandimento sopra un'impronta
    imp = ''.join(f'<path d="M{1050 - k * 22} {560 - k * 6} q{90 + k * 22} {-160 - k * 20} {200 + k * 44} 0" stroke="{c["medio"]}" stroke-width="10" fill="none"/>' for k in range(6))
    return f'''{imp}
<g transform="translate(1120 380) rotate(-35)">
  <circle r="200" fill="{c['f2']}" opacity=".35" stroke="{c['chiaro']}" stroke-width="44"/>
  <rect x="-34" y="222" width="68" height="300" rx="34" fill="{c['chiaro']}"/>
  <path d="M-120 -80 A150 150 0 0 1 -40 -150" stroke="{c['luce']}" stroke-width="20" fill="none" stroke-linecap="round"/>
</g>'''

def horror(c):  # luna e rami
    rami = f'''<path d="M760 900 L820 600 L700 470 M820 600 L900 420 L860 300 M900 420 L1010 360" stroke="{c['f2']}" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M1600 900 L1520 640 L1600 520 M1520 640 L1400 560 L1350 440" stroke="{c['f2']}" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'''
    return f'''<circle cx="1180" cy="330" r="220" fill="{c['chiaro']}"/>
<circle cx="1260" cy="290" r="200" fill="{c['f1']}" opacity=".0"/>
<circle cx="1120" cy="280" r="34" fill="{c['medio']}" opacity=".6"/><circle cx="1240" cy="420" r="22" fill="{c['medio']}" opacity=".6"/>
<path d="M1010 230 l40 -30 l40 30 l40 -30 l40 30" stroke="{c['f2']}" stroke-width="18" fill="none" stroke-linejoin="round"/>
{rami}'''

def noir(c):  # tapparelle e cappello
    strisce = ''.join(f'<polygon points="{600 + i * 0},{90 + i * 120} 1600,{30 + i * 120} 1600,{80 + i * 120} {600},{140 + i * 120}" fill="{c["chiaro"]}" opacity=".55"/>' for i in range(7))
    return f'''{strisce}
<g transform="translate(1180 470)">
  <ellipse cx="0" cy="40" rx="260" ry="46" fill="{c['f2']}"/>
  <path d="M-150 40 Q-160 -170 0 -180 Q160 -170 150 40 Z" fill="{c['f2']}"/>
  <rect x="-150" y="-10" width="300" height="34" fill="{c['scuro']}"/>
</g>'''

def poliziesco(c):  # distintivo a stella
    return f'''<g transform="translate(1130 450) rotate(-10)">
  <polygon points="{stella(0, 0, 290, 150, 6)}" fill="{c['chiaro']}"/>
  <circle r="120" fill="{c['medio']}"/>
  <circle r="80" fill="none" stroke="{c['luce']}" stroke-width="12"/>
  <polygon points="{stella(0, 0, 60, 26, 5)}" fill="{c['luce']}"/>
</g>'''

def azione(c):  # esplosione e fulmine
    return f'''<polygon points="{stella(1140, 450, 380, 230, 12, -75)}" fill="{c['medio']}"/>
<polygon points="{stella(1140, 450, 260, 160, 12, -60)}" fill="{c['chiaro']}"/>
<polygon points="1180,180 1040,480 1140,480 1080,720 1260,400 1160,400 1230,180" fill="{c['f2']}"/>'''

def fantasy(c):  # castello sul monte
    return f'''{punti(c, 40, 5, area=(700, 1600, 0, 400))}
<polygon points="700,900 1050,420 1300,700 1450,560 1600,700 1600,900" fill="{c['scuro']}"/>
<g fill="{c['chiaro']}">
  <rect x="1020" y="300" width="80" height="260"/><polygon points="1010,300 1060,190 1110,300"/>
  <rect x="1120" y="360" width="160" height="200"/>
  <rect x="1300" y="260" width="70" height="300"/><polygon points="1290,260 1335,150 1380,260"/>
  <rect x="1180" y="470" width="44" height="90" rx="22" fill="{c['f2']}"/>
</g>'''

def animazione(c):  # palla che rimbalza
    archi = ''.join(f'<path d="M{760 + i * 210} 760 Q{865 + i * 210} {420 + i * 60} {970 + i * 210} 760" stroke="{c["medio"]}" stroke-width="10" stroke-dasharray="4 26" stroke-linecap="round" fill="none"/>' for i in range(4))
    return f'''{archi}
<ellipse cx="1390" cy="770" rx="120" ry="20" fill="{c['f2']}" opacity=".6"/>
<circle cx="1390" cy="560" r="170" fill="{c['chiaro']}"/>
<path d="M1230 520 Q1390 600 1550 520" stroke="{c['medio']}" stroke-width="22" fill="none"/>
<path d="M1390 390 Q1320 560 1390 730" stroke="{c['medio']}" stroke-width="22" fill="none"/>'''

def muto(c):  # bobina di pellicola
    fori = ''.join(f'<circle cx="{1130 + 150 * math.cos(math.radians(a)):.0f}" cy="{450 + 150 * math.sin(math.radians(a)):.0f}" r="62" fill="{c["f2"]}"/>' for a in range(-90, 270, 60))
    return f'''<path d="M1130 750 Q1300 860 1600 820" stroke="{c['scuro']}" stroke-width="90" fill="none"/>
<circle cx="1130" cy="450" r="300" fill="{c['chiaro']}"/>
{fori}
<circle cx="1130" cy="450" r="40" fill="{c['medio']}"/>'''

def thriller(c):  # occhio
    return f'''<g transform="translate(1130 450)">
  <path d="M-380 0 Q0 -300 380 0 Q0 300 -380 0Z" fill="{c['chiaro']}"/>
  <circle r="150" fill="{c['medio']}"/><circle r="70" fill="{c['f2']}"/>
  <circle cx="45" cy="-45" r="26" fill="{c['luce']}"/>
</g>'''

def famiglia(c):  # casa con finestre accese
    return f'''<g transform="translate(1120 470)">
  <polygon points="-300,-40 0,-300 300,-40" fill="{c['medio']}"/>
  <rect x="-240" y="-40" width="480" height="340" fill="{c['chiaro']}"/>
  <rect x="-170" y="30" width="110" height="100" fill="{c['luce']}"/><rect x="60" y="30" width="110" height="100" fill="{c['luce']}"/>
  <rect x="-50" y="160" width="100" height="140" rx="50" fill="{c['scuro']}"/>
  <rect x="140" y="-250" width="60" height="140" fill="{c['medio']}"/>
</g>'''

def storico(c):  # colonna
    scan = ''.join(f'<rect x="{1040 + i * 40}" y="250" width="16" height="430" fill="{c["medio"]}"/>' for i in range(5))
    return f'''<rect x="960" y="190" width="360" height="60" fill="{c['chiaro']}"/><rect x="990" y="150" width="300" height="40" fill="{c['chiaro']}"/>
<rect x="1010" y="250" width="260" height="430" fill="{c['chiaro']}"/>{scan}
<rect x="960" y="680" width="360" height="60" fill="{c['chiaro']}"/><rect x="920" y="740" width="440" height="50" fill="{c['medio']}"/>'''

def sentimentale(c):  # cuore
    return f'''<path d="M1130 760 C 820 560 820 260 1000 230 C 1080 216 1120 270 1130 300 C 1140 270 1180 216 1260 230 C 1440 260 1440 560 1130 760Z" fill="{c['chiaro']}"/>
<path d="M980 330 Q990 290 1030 280" stroke="{c['luce']}" stroke-width="22" fill="none" stroke-linecap="round"/>'''

def avventura(c):  # bussola sulle montagne
    return f'''<polygon points="700,900 1000,520 1180,760 1380,480 1600,800 1600,900" fill="{c['scuro']}"/>
<g transform="translate(1180 360)"><circle r="190" fill="{c['chiaro']}"/><circle r="150" fill="none" stroke="{c['medio']}" stroke-width="12"/>
<polygon points="0,-140 34,0 0,140 -34,0" fill="{c['f2']}"/><polygon points="0,-140 34,0 -34,0" fill="{c['medio']}"/></g>'''


def western(c):  # sole, cactus e colline
    return f'''<circle cx="1260" cy="330" r="170" fill="{c['chiaro']}"/>
<polygon points="700,900 900,640 1100,760 1300,600 1600,780 1600,900" fill="{c['scuro']}"/>
<g fill="{c['f2']}"><rect x="1050" y="380" width="70" height="420" rx="35"/><path d="M1050 600 h-70 a35 35 0 0 1 -35 -35 v-90 a35 35 0 0 1 70 0 v55 h35z"/><path d="M1120 540 h70 v-120 a35 35 0 0 1 70 0 v155 a35 35 0 0 1 -35 35 h-105z"/></g>'''

def documentario(c):  # cinepresa
    return f'''<g transform="translate(1130 470)">
  <circle cx="-120" cy="-190" r="90" fill="{c['chiaro']}"/><circle cx="90" cy="-190" r="90" fill="{c['chiaro']}"/>
  <circle cx="-120" cy="-190" r="30" fill="{c['f2']}"/><circle cx="90" cy="-190" r="30" fill="{c['f2']}"/>
  <rect x="-240" y="-90" width="400" height="230" rx="24" fill="{c['chiaro']}"/>
  <polygon points="160,-40 320,-110 320,190 160,120" fill="{c['medio']}"/>
  <circle cx="-150" cy="-20" r="16" fill="{c['scuro']}"/>
</g>'''

def musica(c):  # due note
    return f'''<g fill="{c['chiaro']}">
  <ellipse cx="1000" cy="640" rx="90" ry="66" transform="rotate(-20 1000 640)"/><ellipse cx="1300" cy="580" rx="90" ry="66" transform="rotate(-20 1300 580)"/>
  <rect x="1068" y="230" width="30" height="410"/><rect x="1368" y="170" width="30" height="410"/>
  <polygon points="1068,230 1398,170 1398,260 1068,320"/>
</g>'''

def altro(c):  # ciak
    return f'''<g transform="translate(1130 470) rotate(-6)">
  <rect x="-260" y="-110" width="520" height="330" rx="20" fill="{c['chiaro']}"/>
  <g transform="rotate(-14 -260 -110)"><rect x="-260" y="-200" width="520" height="90" rx="14" fill="{c['medio']}"/>
  {''.join(f'<polygon points="{-220 + i * 110},-200 {-160 + i * 110},-200 {-210 + i * 110},-110 {-270 + i * 110},-110" fill="{c["f2"]}"/>' for i in range(5))}</g>
  <rect x="-200" y="0" width="300" height="24" rx="12" fill="{c['scuro']}"/><rect x="-200" y="70" width="200" height="24" rx="12" fill="{c['scuro']}"/>
</g>'''

GENERI = {
    'Drammatico': (215, drammatico), 'Commedia': (45, commedia), 'Fantascienza': (190, fantascienza),
    'Giallo': (50, giallo), 'Horror': (0, horror), 'Noir': (230, noir), 'Poliziesco': (210, poliziesco),
    'Azione': (18, azione), 'Fantasy': (275, fantasy), 'Animazione': (150, animazione), 'Muto': (30, muto),
    'Thriller': (330, thriller), 'Famiglia': (95, famiglia), 'Storico': (35, storico),
    'Sentimentale': (345, sentimentale), 'Avventura': (125, avventura),
    'Western': (28, western), 'Documentario': (180, documentario), 'Musica': (300, musica), 'Altro': (220, altro),
}

# ---------------- MOOD ----------------
def m_ridere(c):
    return f'''{punti(c, 60, 9, r=(6, 14))}
<circle cx="1130" cy="450" r="260" fill="{c['chiaro']}"/>
<circle cx="1040" cy="380" r="34" fill="{c['f2']}"/><circle cx="1220" cy="380" r="34" fill="{c['f2']}"/>
<path d="M990 500 Q1130 660 1270 500" stroke="{c['f2']}" stroke-width="36" fill="none" stroke-linecap="round"/>'''

def m_brividi(c):
    return f'''<circle cx="1180" cy="300" r="190" fill="{c['chiaro']}"/><circle cx="1250" cy="260" r="170" fill="{c['f1']}"/>
<path d="M700 900 Q900 500 1000 900 Q1100 450 1220 900 Q1340 520 1460 900 Q1540 600 1600 900Z" fill="{c['f2']}"/>
<path d="M1010 610 q30 -20 60 0 q30 -20 60 0" stroke="{c['luce']}" stroke-width="10" fill="none"/>'''

def m_mistero(c):
    return f'''<g transform="translate(1130 450)">
  <circle r="300" fill="{c['scuro']}"/>
  <circle cy="-60" r="90" fill="{c['chiaro']}"/><polygon points="-60,-10 60,-10 100,200 -100,200" fill="{c['chiaro']}"/>
</g>
<text x="1400" y="330" font-family="Georgia, serif" font-size="300" fill="{c['medio']}" opacity=".8">?</text>'''

def m_famiglia(c):
    return f'''<g transform="translate(1130 560)">
  <rect x="-330" y="-80" width="660" height="200" rx="50" fill="{c['chiaro']}"/>
  <rect x="-280" y="-200" width="560" height="160" rx="40" fill="{c['medio']}"/>
  <rect x="-370" y="-110" width="80" height="230" rx="40" fill="{c['chiaro']}"/><rect x="290" y="-110" width="80" height="230" rx="40" fill="{c['chiaro']}"/>
  <path d="M-40 -330 C -90 -380 -150 -330 -40 -260 C 70 -330 10 -380 -40 -330Z" fill="{c['luce']}"/>
</g>'''

def m_lontani(c):
    return f'''{punti(c, 90, 11)}
<circle cx="1250" cy="420" r="230" fill="{c['chiaro']}"/>
<circle cx="900" cy="250" r="70" fill="{c['medio']}"/>
<circle cx="1480" cy="760" r="50" fill="{c['medio']}"/>
<path d="M800 760 Q1000 600 1150 640" stroke="{c['luce']}" stroke-width="8" stroke-dasharray="2 22" stroke-linecap="round" fill="none"/>'''

def m_emozioni(c):
    return f'''<path d="M700 470 L960 470 L1010 330 L1080 640 L1150 200 L1220 700 L1280 420 L1330 470 L1600 470" stroke="{c['chiaro']}" stroke-width="30" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M1150 790 C 1010 700 1010 600 1090 590 C 1120 588 1140 610 1150 625 C 1160 610 1180 588 1210 590 C 1290 600 1290 700 1150 790Z" fill="{c['medio']}"/>'''

def m_muto(c):
    fot = ''.join(f'<rect x="{760 + i * 220}" y="290" width="190" height="320" rx="10" fill="{c["chiaro"] if i % 2 else c["medio"]}"/>' for i in range(4))
    fori = ''.join(f'<rect x="{745 + i * 55}" y="{y}" width="30" height="34" rx="6" fill="{c["f2"]}"/>' for i in range(16) for y in (232, 634))
    return f'''<rect x="700" y="210" width="900" height="480" fill="{c['scuro']}"/>{fot}{fori}'''

MOOD = {
    'ridere': (48, m_ridere), 'brividi': (355, m_brividi), 'mistero': (265, m_mistero), 'famiglia': (100, m_famiglia),
    'lontani': (200, m_lontani), 'emozioni': (330, m_emozioni), 'muto': (28, m_muto),
}

def slug(s):
    return s.lower().replace(' ', '-')

for nome, (t, f) in GENERI.items():
    svg('genere-' + slug(nome), t, f)
for nome, (t, f) in MOOD.items():
    svg('mood-' + nome, t, f)
print(len(GENERI) + len(MOOD), 'illustrazioni')
