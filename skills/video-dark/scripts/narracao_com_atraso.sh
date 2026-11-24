#!/bin/bash
# Coloca a narração no projeto com 0,6 s de silêncio no início. Uso: bash narracao_com_atraso.sh voz.wav public/narracao.wav SEGUNDOS_TOTAIS
ffmpeg -v error -y -i "$1" -af "adelay=600|600,apad" -t "$3" -ar 44100 "$2" && echo ok
