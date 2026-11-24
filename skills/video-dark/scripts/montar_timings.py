"""Junta o roteiro (uma frase/cena por linha) com os tempos do Whisper e gera src/timings.json.
Uso: python3 montar_timings.py roteiro.txt palavras.json src/timings.json [atraso_inicial=0.6]
A legenda usa as palavras do ROTEIRO (com pontuação) e os tempos do áudio.
Se avisar divergências, confira: o número de palavras precisa bater."""
import json, re, sys
lines = [l.strip() for l in open(sys.argv[1]) if l.strip()]
W = json.load(open(sys.argv[2])); LEAD = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6
toks = [(li,t) for li,l in enumerate(lines) for t in l.split() if re.search(r'\w', t)]
n = lambda x: re.sub(r'\W','',x).lower()
print('palavras roteiro:', len(toks), '| áudio:', len(W))
bad = [(t, w['w']) for (li,t), w in zip(toks, W) if n(t) != n(w['w'])]
if bad: print('DIVERGÊNCIAS (ajuste o roteiro ou o json):', bad[:20])
out = []
for li, l in enumerate(lines):
    ws = [{"w":t,"start":round(w['start']+LEAD,3),"end":round(w['end']+LEAD,3)} for (lj,t), w in zip(toks, W) if lj == li]
    out.append({"text":l,"start":ws[0]['start'],"dur":round(ws[-1]['end']-ws[0]['start'],3),"words":ws})
total = round(out[-1]['start'] + out[-1]['dur'] + 2.8, 2)
json.dump({"total":total,"lines":out}, open(sys.argv[3],"w"), ensure_ascii=False, indent=1)
print('total', total, 's =', int(round(total*30)), 'frames a 30fps (coloque em Root.tsx durationInFrames)')
