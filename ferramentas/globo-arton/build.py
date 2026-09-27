"""Gera cofre/.obsidian/plugins/globo-arton/main.js a partir de src.js, embutindo o three.js r158.

Uso: python3 ferramentas/globo-arton/build.py   (precisa de node/npm para baixar o three.js)
"""
import pathlib, subprocess, tarfile, tempfile

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(['npm', 'pack', 'three@0.158.0', '--silent'], cwd=tmp, check=True)
    with tarfile.open(next(pathlib.Path(tmp).glob('three-*.tgz'))) as t:
        three = t.extractfile('package/build/three.min.js').read().decode()
three = three.split('\n', 1)[1]  # tira o aviso de depreciação da 1a linha
wrap = ("const THREE = (function () {\n  var exports = {}; var module = { exports: exports }; var define;\n  !"
        + three.strip().rstrip(';') + ";\n  return exports;\n})();\n")
src = (AQUI / 'src.js').read_text()
out = src.replace('/*__THREE__*/', '/* three.js r158 (MIT, https://threejs.org), incluído para funcionar offline */\n' + wrap)
dst = RAIZ / 'cofre/.obsidian/plugins/globo-arton/main.js'
dst.write_text(out)
print('gerado', dst, len(out), 'bytes')
