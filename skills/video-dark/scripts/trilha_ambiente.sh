#!/bin/bash
# Trilha ambiente grave e escura (gerada, sem direito autoral). Uso: bash trilha_ambiente.sh public/drone.wav SEGUNDOS
OUT=$1; D=${2:-70}; FADE=$((D-4))
ffmpeg -v error -y -f lavfi -i "sine=f=55:d=$D" -f lavfi -i "anoisesrc=c=brown:d=$D:a=0.5" -f lavfi -i "sine=f=82.4:d=$D" \
 -filter_complex "[0]volume=0.5[a];[1]lowpass=f=300,volume=0.35[b];[2]volume=0.18,tremolo=f=0.25:d=0.9[c];[a][b][c]amix=inputs=3:normalize=0,afade=t=in:d=2,afade=t=out:st=$FADE:d=4,volume=0.7" \
 -ar 44100 "$OUT" && echo ok
