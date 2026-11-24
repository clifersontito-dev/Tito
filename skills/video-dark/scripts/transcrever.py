"""Tempo exato de cada palavra da narração (para a legenda sincronizada).
Uso: python3 transcrever.py narracao.wav roteiro.txt palavras.json
Instalar antes: pip install faster-whisper   (o modelo 'small' baixa do huggingface)
Passa o áudio já decodificado em array (evita erro de versão do PyAV)."""
import json, sys, subprocess
import numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
audio = np.frombuffer(subprocess.check_output(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","f32le","-"]), np.float32)
segs, _ = m.transcribe(audio, language="pt", word_timestamps=True, initial_prompt=open(sys.argv[2]).read())
words = [{"w": w.word.strip(), "start": round(w.start,3), "end": round(w.end,3)} for s in segs for w in s.words]
json.dump(words, open(sys.argv[3],"w"), ensure_ascii=False)
print(len(words), "palavras")
