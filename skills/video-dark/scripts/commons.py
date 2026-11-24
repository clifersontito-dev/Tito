"""Lista arquivos de uma categoria do Wikimedia Commons com a licença de cada um e baixa os de domínio público.
A API do Commons costuma dar 429 (limite) a partir de servidores; por isso usa as páginas HTML.
Uso: python3 commons.py "Category:D._B._Cooper" pasta_destino [--baixar]"""
import re, sys, time, urllib.request, urllib.parse, os
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) VideoDark/1.0"}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read().decode('utf-8','ignore')
cat, dest = sys.argv[1], sys.argv[2]; baixar = '--baixar' in sys.argv
html = get("https://commons.wikimedia.org/wiki/" + urllib.parse.quote(cat))
files = sorted(set(re.findall(r'href="/wiki/(File:[^"]+)"', html)))
os.makedirs(dest, exist_ok=True)
for f in files:
    p = get("https://commons.wikimedia.org/wiki/" + f)
    pd = bool(re.search(r'PD-USGov|PD-US|public domain|Public domain|CC0', p))
    lic = 'DOMINIO PUBLICO' if pd else ('CC-BY/GFDL (exige crédito/compartilhamento)' if re.search(r'CC-BY|GFDL', p) else '??')
    url = re.search(r'https://upload\.wikimedia\.org/wikipedia/commons/[0-9a-f]/[0-9a-f]{2}/[^"?]+', p)
    print(f'{lic:45} {urllib.parse.unquote(f)}')
    if baixar and pd and url:
        nome = os.path.join(dest, urllib.parse.unquote(url.group(0).split('/')[-1]))
        open(nome, 'wb').write(urllib.request.urlopen(urllib.request.Request(url.group(0), headers=UA)).read())
    time.sleep(1)
