"""Deixa a narração em ritmo natural: limita cada pausa a ~0,38 s e acelera a fala sem mudar o tom.
Uso: python3 ajustar_voz.py entrada.mp3 saida.wav [tempo=1.15] [pausa_max=0.38]
Meta: ~150 palavras por minuto. Confira com: palavras / (duração em min)."""
import subprocess, re, sys
src, out = sys.argv[1], sys.argv[2]
tempo = float(sys.argv[3]) if len(sys.argv) > 3 else 1.15
KEEP = float(sys.argv[4]) if len(sys.argv) > 4 else 0.38
log = subprocess.run(['ffmpeg','-hide_banner','-i',src,'-af','silencedetect=n=-40dB:d=0.4','-f','null','-'],capture_output=True,text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src]))
segs, cur = [], 0.0
for s, e in zip(st, en):
    if s < 0.05: cur = max(cur, e - 0.1); continue
    segs.append((cur, s + KEEP/2)); cur = e - KEEP/2
if cur < dur: segs.append((cur, dur))
f = ';'.join(f'[0]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={b-a-0.012:.3f}:d=0.012[s{i}]' for i,(a,b) in enumerate(segs))
f += ';' + ''.join(f'[s{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=0:a=1,atempo={tempo}[o]'
subprocess.check_call(['ffmpeg','-v','error','-y','-i',src,'-filter_complex',f,'-map','[o]','-ar','44100',out])
print('duração final:', subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out]).decode().strip(), 's')
