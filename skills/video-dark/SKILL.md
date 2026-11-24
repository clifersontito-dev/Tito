---
name: video-dark
description: "Produz do zero um vídeo de canal dark (true crime, mistério, história, curiosidades) com narração humana, legenda sincronizada palavra por palavra e imagens reais com licença livre, renderizado no Remotion. É o mesmo processo do vídeo do caso D.B. Cooper que o Tito aprovou. Usar quando o Tito pedir para criar, fazer ou produzir um vídeo do canal dark, um vídeo com narração, um Short/Reels narrado, ou trocar a voz/legenda de um vídeo, mesmo sem dizer 'Remotion'."
---

# Vídeo de canal dark (padrão D.B. Cooper)

Este é o processo que gerou o vídeo do **caso D.B. Cooper**, que o Tito aprovou. Ele tem:
- **Formato:** 1080×1920, 30 fps, de 60 a 70 s.
- **Narração:** voz humana em ritmo natural.
- **Legenda:** acende palavra por palavra junto com a voz.
- **Imagens:** fotos reais em domínio público, trechos de filme antigo em domínio público e cenas geradas no código.
- **Clima:** granulação de filme, vinheta e trilha grave.

Siga as etapas na ordem. Se a skill **canal-dark** estiver instalada, use-a para as regras de roteiro, gancho e título.

O modelo do projeto está em `template/` e os scripts em `scripts/`. Copie-os, não reescreva do zero.

## Regras que o Tito já definiu

- **Pergunte só o essencial:** caso ou tema, formato (vertical para Shorts/Reels/TikTok é o padrão) e duração (~1 min é o padrão). Não encha de perguntas: escolha e siga.
- **Voz:** a preferida dele é a **Heitor, da PlaySquad** (Audio Lab). A PlaySquad exige o login do Tito. Então **peça para ele gerar o áudio lá e mandar o arquivo**, e passe o texto pronto para colar. Se ele não puder, use uma voz neural de fallback (ver etapa 3).
- **Ritmo:** a voz da PlaySquad sai lenta (~93 palavras/min). O Tito pediu ritmo natural, **~150 palavras/min**. Use `scripts/ajustar_voz.py`: limita as pausas a ~0,4 s e acelera ~15% sem mudar o tom. Não acelere mais que ~20%, porque a voz fica apressada.
- **Imagens:** só com licença clara, sem nada "pego do Google". Registre tudo em `CREDITOS.md`.
- **Entrega:** mande sempre uma **versão leve** (~10 MB) para ele conseguir baixar. O arquivo de 43 MB não baixou no app.
- **Tom (true crime):** investigativo, com respeito às vítimas e sem glamourizar o criminoso.

## Etapa 1: roteiro (1 frase = 1 cena)

- **Tamanho:** ~140 a 160 palavras para 1 minuto. Divida em ~12 linhas: cada linha é uma frase narrada e vira uma cena.
- **Abertura:** gancho direto nos primeiros segundos, sem "olá pessoal".
- **Desenvolvimento:** tensão crescente e uma virada no meio.
- **Final:** pergunta aberta (ex.: "Até hoje, ninguém sabe quem era D. B. Cooper.").
- **Escrita para a voz:** ano por extenso ("mil novecentos e setenta e um") e reticências nas pausas dramáticas ("Do homem... nenhum sinal.").
- **Fatos:** confira datas, nomes e números em 3 fontes. Use "suspendeu" ou "encerrou as buscas" quando for esse o caso, nunca "resolveu".
- Salve como `roteiro.txt`, uma frase por linha.

## Etapa 2: imagens reais com licença

- **Casos dos EUA:** fotos do FBI e do governo federal são domínio público. Busque no Wikimedia Commons pela categoria do caso:
  ```bash
  python3 scripts/commons.py "Category:NOME_DO_CASO" public/ --baixar
  ```
  - O script lista a licença de cada arquivo e baixa **só** os de domínio público.
  - A API do Commons costuma dar erro 429, por isso o script lê as páginas HTML.
  - CC-BY-SA e GFDL exigem crédito e compartilhamento: **evite**. Gere essas cenas no código (o mapa, por exemplo, foi desenhado em SVG).
- **Filme de época** (polícia, cidade, rádio, viatura): use o Internet Archive, coleção Prelinger, apenas itens com `licenseurl` de domínio público. Exemplo usado: `ThisIsYo1951` ("This Is Your Police Department", 1951).
  - Baixe o mp4.
  - Gere uma grade de miniaturas para escolher os trechos:
    ```bash
    ffmpeg -i f.mp4 -vf "fps=1/20,scale=240:-1,tile=8x10" -frames:v 1 grade.jpg
    ```
  - Confira e corte trechos de 4 s:
    ```bash
    ffmpeg -ss T -t 4 -i f.mp4 -an -vf scale=-2:720 -c:v libx264 -crf 20 public/clip-x.mp4
    ```
  - Avise no CREDITOS que essas cenas são ilustrativas e não mostram o caso real.
- **Cenas sem foto** (data, exigências, mapa, salto, carimbo, encerramento): componentes gerados no código, como em `template/src/scenes.tsx`.

## Etapa 3: narração

1. **Caminho principal (PlaySquad):** mande ao Tito o roteiro inteiro num parágrafo só, para ele colar no Audio Lab com a voz Heitor (ou a que ele escolher), e peça o mp3.
2. **Ajuste de ritmo:**
   ```bash
   python3 scripts/ajustar_voz.py voz.mp3 voz-natural.wav 1.15 0.38
   ```
   Confira se ficou em ~150 palavras/min.
3. **Fallback sem PlaySquad:** `pip install edge-tts`. Gere tudo numa tomada só com a voz `pt-BR-ThalitaMultilingualNeural` (a mais natural) ou `pt-BR-AntonioNeural`, com `rate=-8%`.
   - Uma tomada só deixa a fala fluida. Frases geradas separadamente e coladas soaram robóticas.
   - O edge-tts precisa de `--proxy "$HTTPS_PROXY"` e de `SSL_CERT_FILE` apontando para o certificado do proxy, se houver.
   - Avise o Tito que o uso comercial da voz da Microsoft é área cinzenta.

## Etapa 4: legenda sincronizada

1. Instale: `pip install faster-whisper`.
2. Transcreva com tempo por palavra:
   ```bash
   python3 scripts/transcrever.py voz-natural.wav roteiro.txt palavras.json
   ```
   O script já contorna o erro do PyAV (`metadata_errors`), passando o áudio decodificado.
3. Monte o arquivo de tempos:
   ```bash
   python3 scripts/montar_timings.py roteiro.txt palavras.json src/timings.json 0.6
   ```
   O número de palavras precisa bater (no vídeo aprovado: 141 de 141, sem divergência).
4. Prepare o áudio do projeto:
   ```bash
   bash scripts/narracao_com_atraso.sh voz-natural.wav public/narracao.wav SEGUNDOS
   bash scripts/trilha_ambiente.sh public/drone.wav SEGUNDOS
   ```
5. Atualize `durationInFrames` no `Root.tsx` com o valor que o script mostrar.

## Etapa 5: montar no Remotion

- **Criar o projeto:**
  ```bash
  npx create-video@latest --yes --blank --no-tailwind NOME
  ```
  Depois copie `template/src/*` e instale:
  ```bash
  npx remotion add @remotion/google-fonts
  npx remotion add @remotion/media
  ```
- **O que cada arquivo faz:**
  - `fx.tsx`: `FilmLook` (granulação, vinheta e tremulação), `Photo` (zoom lento sobre a foto, com fundo desfocado da própria foto), `Fade`, `Label` (texto de máquina de escrever no topo), `Stamp` (carimbo vermelho) e `Caption` (legenda por palavra: a palavra falada fica vermelha, as já ditas brancas, as futuras apagadas).
  - `CaseVideo.tsx`: uma cena por linha do roteiro. Cada cena começa ~0,25 s antes da sua fala. Há uma faixa escura embaixo para a legenda, a narração e a trilha a 35%.
  - `scenes.tsx`: as cenas do D.B. Cooper como exemplo. Troque pelas do caso novo, mantendo a variedade: foto, filme, cena gerada, mapa e carimbo.
- **Fontes:** Special Elite (máquina de escrever) e Oswald (legenda e títulos).
- **Regras visuais:** algo muda a cada 3 a 5 s; texto de topo curto; legenda com fundo escuro; nada de texto quebrando linha (use `whiteSpace: "nowrap"` em títulos e carimbos).
- **Antes de renderizar:** gere quadros de prévia de várias cenas e junte numa folha para conferir:
  ```bash
  npx remotion still ID out/x.png --frame=N --scale=0.3
  ```
  - Confira também a sincronia: renderize o quadro do tempo de uma palavra (segundo × 30) e veja se é essa palavra que está vermelha.
  - Problemas já vistos e corrigidos: título quebrando em duas linhas por cima do subtítulo; carimbo quebrando; legenda ilegível sobre foto clara.

## Etapa 6: renderizar e entregar

- **Renderizar:**
  ```bash
  npx remotion render ID out/video.mp4 --concurrency=4
  ```
  - Rode em segundo plano com tempo limite **longo (40 min)**: 2.100 frames passaram de 10 minutos e o comando foi interrompido.
  - Se o download do navegador do Remotion for bloqueado pela rede, use o Chromium da máquina com `--browser-executable=CAMINHO` (no ambiente de nuvem: `/opt/pw-browsers/chromium-*/chrome-linux64/chrome`).
- **Versão leve para o Tito baixar:**
  ```bash
  ffmpeg -i out/video.mp4 -c:v libx264 -preset slow -crf 26 -maxrate 1500k -bufsize 3000k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart video-leve.mp4
  ```
  Dá ~10 MB com a mesma resolução.
- **Confira antes de entregar:** duração (`ffprobe`), volume (`volumedetect`, máximo perto de -3 dB) e se há áudio.
- **Na resposta ao Tito:**
  - Mande os dois arquivos.
  - Liste as cenas e as fontes e licenças, e o que é ilustrativo.
  - Diga o que conferiu e o que não conferiu (por exemplo, se não assistiu do começo ao fim).
  - Sugira título e thumb no padrão do canal dark: título de 5 a 8 palavras com tensão; thumb escura, sem texto ou com 1 a 3 palavras, e o rosto do retrato falado.
- **Não suba vídeo nem anotações de curso para repositório público** sem o Tito pedir.

## Erros que já aconteceram (não repetir)

- Gerar a voz frase por frase e colar: soa robótico. Gere numa tomada só.
- Narração lenta demais (90 palavras/min): use `ajustar_voz.py`.
- Legenda com tempo estimado em vez de real: fica fora de sincronia. Use o Whisper.
- O `silenceremove` do ffmpeg quase não corta pausa: use o script, que corta cada pausa pelo `silencedetect`.
- Ligar o render com tempo limite curto: ele é interrompido no meio.
- Entregar o MP4 pesado: ele não baixa no app. Mande a versão leve.
- Tentar usar a PlaySquad ou o TubeClub sozinho: precisam do login do Tito. Peça a ele.
