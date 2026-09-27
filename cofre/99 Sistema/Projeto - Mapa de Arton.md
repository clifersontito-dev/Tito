---
tipo: ideia
projeto: mapa-de-arton
status: etapas 1 a 5 construídas
---

# Mapa de Arton no cofre: design (e agora as 5 etapas construídas)

## Contexto
O cofre "Arton do Tito" (Obsidian, campanha de Tormenta 20, Globo 3D, painel) já existe na branch `claude/obsidian-capabilities-688e5b` (PR #1). O Tito viu o site mapadearton.fichasdenimb.com.br e quer um mapa de Arton parecido dentro do cofre, com mais funções para mestrar.

As seções abaixo ("Decisões já tomadas", "Modo combate", "Rolador de dados") são o desenho original, mantidas como registro. As seções "Etapa N: construída", mais abaixo, dizem o que de fato foi feito e onde esse desenho foi simplificado.

## Decisões já tomadas
1. **Mapa:** imagem do mapa de Arton (fornecida pelo Tito, uso pessoal), com zoom e arrastar.
2. **Marcadores clicáveis:** cartão com nome, resumo, "abrir nota" e "ver no globo".
3. **Camadas e filtros:** reinos, cidades, masmorras, locais da campanha, NPCs, rastro do grupo.
4. **Régua de viagem:** distância e dias a pé, a cavalo ou de barco.
5. **Galeria por marcador:** imagens ilimitadas, escondidas até o mestre mandar mostrar; abre em tela cheia. Selo 👁️ mostrada / 🔒 secreta.
6. **Duas telas:** a do mestre (vê tudo; ocultos meio apagados com cadeado) e a dos jogadores (TV ou segundo monitor, só o revelado).
7. **Neblina por marcador:** revelar abre um círculo de visão com raio próprio de cada marcador (capital grande, caverna pequena), com borda suave. O rastro do grupo abre uma trilha na neblina.
8. **Três estados por marcador:** oculto, rumor (❓ sem nome, área coberta) e revelado. Pistas de segredos podem deixar um lugar em rumor.
9. **Revelação separada:** revelar uma área NÃO revela os marcadores dentro dela; cada um tem o próprio controle.
10. **Rastro automático** das sessões (a partir das notas de sessão / skill mestre-arton).
11. **Ligação com o globo e as notas** do cofre.
12. **Criar marcador:** clicar no mapa → escolher ícone e nome → a nota é criada no cofre automaticamente.

13. **Revelação dramática:** na tela dos jogadores, a neblina se dissolve devagar, o marcador surge brilhando e o mapa dá zoom até ele por alguns segundos.
14. **Só o mestre controla a tela dos jogadores:** ela segue a visão do mestre, como uma apresentação (ideal para TV).

15. **Botão congelar:** o mestre congela a tela dos jogadores, prepara coisas escondidas na dele e solta quando estiver pronto.
16. **Trilha sonora por lugar:** cada marcador pode ter um som ambiente (taverna, floresta, masmorra) que toca na tela dos jogadores quando o mestre foca nele.

17. **Origem dos sons:** anexar arquivo (MP3, funciona offline) ou colar um link do YouTube.

## Modo combate (etapa 3 — construído, ver seção mais abaixo pras diferenças)
- Ideia base: de dentro de um marcador, o mestre abre um **mapa de batalha** (uma imagem da galeria daquele local) com grade de quadrados de 1,5 m, fichas dos PJs e dos monstros, e ordem de iniciativa. A troca para a TV usa o efeito dramático.
- **Grade e fichas:** fichas redondas arrastáveis de PJs e monstros.
- **Iniciativa:** lista de turnos; "próximo" faz a ficha da vez brilhar na TV.
  - **Contador de rodadas** ("Rodada 3"), com aviso quando uma condição termina
  - **Atrasar e reordenar:** arrastar na lista ou marcar "atrasou o turno"
  - **Aviso de próximo na TV:** "É a vez de Kael — prepare-se: Mestra Ilvara"
  - A iniciativa é informada à mão (não rola sozinha)
- **PV e condições:** os números dos monstros só o mestre vê; os jogadores veem "ferido" ou "quase morto". Ícones de condição (caído, atordoado...).
- **Neblina de sala:** a mesma lógica do mapa-múndi, revelando a masmorra aos poucos.
- **Monstros:** puxados do Bestiário do cofre (PV, Defesa e ataques da nota) ou criados na hora (nome + PV).
- **PJs:** vêm das notas de Jogadores (nome, PV, Defesa, retrato); o mestre atualiza o PV durante a luta.
- **Fim do combate:** só fecha e volta ao mapa-múndi (não registra nada automaticamente).
- **Abertura do combate:** o mestre escolhe o estilo a cada luta:
  - *Videogame:* tela treme, clarão vermelho, "⚔️ COMBATE!" grande no centro, som de impacto
  - *Cinematográfico:* tela escurece, bordas vermelhas, o mapa de batalha surge devagar
  - *Chefe:* retrato e nome do chefe em letras grandes, estilo apresentação de chefe
- **Música:** só o som do efeito de abertura, sem trilha durante a luta (a trilha fica por conta da mesa).

## Rolador de dados (etapa 4 — construído, ver seção mais abaixo pras diferenças)
- **Dados 3D na TV:** os dados caem e rolam na tela dos jogadores, com som, e o resultado aparece grande no fim.
- **Botões rápidos:** 1d20, 2d6, 1d8... e expressões como "1d20+7" ou "3d6+2".
- **Rolar pelo monstro:** no combate, clicar no ataque do monstro rola o ataque e o dano com os números da nota dele.
- **Crítico e falha:** 20 natural = explosão dourada e som épico; 1 natural = a tela racha e toca som de fracasso.
- (Rolagens secretas: não pedidas por ora.)

## Etapas — todas construídas
1. **Básico:** mapa, zoom, marcadores (criar clicando → nota no cofre), camadas, régua, galeria com tela cheia
2. **Mesa:** tela dos jogadores (segue a do mestre, com botão congelar), neblina por marcador, três estados, revelação dramática, sons por lugar
3. **Combate:** mapa de batalha com grade, fichas, iniciativa (rodadas, reordenar, atrasar), PV e condições, neblina de sala, efeitos de abertura
4. **Dados:** rolador com botões rápidos e expressões, rolar pelo monstro, efeitos de crítico e falha, na tela dos jogadores
5. **Magia:** rastro automático pelas sessões e ligação com o globo

Arquitetura: um plugin só (`mapa-arton`, no mesmo estilo do `globo-arton`), com a tela dos jogadores sendo uma aba do Obsidian que o Tito arrasta pra uma janela/TV separada (recurso nativo do Obsidian — "Abrir em nova janela" no menu da aba). A imagem do mapa de Arton é fornecida pelo Tito (uso pessoal), salva em `99 Sistema/Anexos/mapa-arton.jpg`.

## Etapa 1: construída (básico)
Mapa com zoom (rodinha) e arrastar; **+ Marcador** cria a nota certa (Reino/Local/NPC) com `mapa_x`/`mapa_y` no frontmatter; **Camadas** por tipo; **Régua** calibrada clicando dois pontos na régua de km do mapa, mostra km e dias a pé/cavalo/barco; **Galeria** (lista `galeria` no frontmatter) com tela cheia. Embutido no 🏠 Painel e com aba própria (ícone 🗺️).

## Etapa 2: construída (mesa)
- **Tela dos jogadores:** comando/botão "🖥️ Jogadores" abre uma aba (`mapa-arton-jogadores-view`); o Tito arrasta essa aba pra uma janela separada (TV). Ela só mostra, nunca deixa mexer no mapa — segue o mestre em tempo real (mesmo ponto central do mapa + mesmo zoom, recalculado pro tamanho de cada tela).
- **Três estados** (`mapa_estado`: oculto/rumor/revelado, chips no cartão do marcador). Nota sem o campo conta como revelada, pra não sumir marcador nenhum da etapa 1 de repente. Rumor aparece como ❓ sem nome pros jogadores.
- **Neblina por marcador** (`mapa_neblina` + `mapa_raio`, em % da largura do mapa): um círculo de "terreno visto" independente do estado do marcador (dá pra abrir a neblina de um lugar sem revelar o marcador, e vice-versa, como a decisão 9 pedia).
- **Revelação dramática:** revelar um marcador (ou abrir a neblina dele) faz a câmera dos jogadores animar até lá e o marcador brilhar; a neblina se abre sozinha com uma transição CSS (não precisou animar cada quadro em JS).
- **Botão congelar:** enquanto ligado, nada do que o mestre faz chega na tela dos jogadores; ao soltar, o estado mais recente (posição da câmera + o último foco) é aplicado de uma vez.
- **Som por lugar:** `mapa_som` no frontmatter — um link do YouTube (toca num iframe escondido) ou um anexo do cofre (toca num `<audio>`); dispara quando o mestre foca o marcador.
- **Rastro do grupo:** botão "🧭 Trilha" no mapa do mestre marca pontos por onde o grupo passou; vira um túnel na neblina.
- **Simplificação:** o raio da neblina é em % da largura do mapa (não em km reais) — mais simples de calibrar visualmente do que converter pela régua, e o mestre ajusta pelo número no cartão vendo o resultado.

## Etapa 3: construída (combate)
- No cartão de um marcador com `galeria`, botão "⚔️ Mapa de batalha" (escolhe a imagem se houver mais de uma) → escolhe o estilo de abertura → abre o combate numa aba própria do mestre; a tela dos jogadores troca sozinha do mapa-múndi pro combate (e volta ao fechar).
- **Grade:** linhas sobre a imagem, em % (não calibrada em metros reais — é só uma referência visual, o Tito ajusta a "sensação" de escala pela imagem escolhida).
- **Fichas:** "+ PJ"/"+ Monstro" buscam nas notas de `03 Personagens/Jogadores/`/`04 Bestiário/` (usando os campos novos `pv`/`defesa`/`ataques` dos modelos) ou criam uma ficha avulsa (nome + PV). Arrastáveis (só o mestre).
- **Iniciativa:** lista com valor editável, ▲/▼ e "Atrasar" (manda pro fim da lista); troca de turno preserva de quem é a vez mesmo reordenando. "▶️ Próximo turno" avança e soma rodada ao dar a volta.
- **PV e condições:** só o mestre vê o número; os jogadores veem "ileso"/"ferido"/"quase morto"/"caído". Seis condições com ícone (caído, atordoado, envenenado, cego, agarrado, amedrontado).
- **Neblina de sala:** um círculo de luz fixo em volta de cada PJ (não ajustável ainda por PJ/classe).
- **Abertura:** 3 estilos (videogame com tremor de tela, cinematográfico, chefe), com efeito visual + som sintetizado (ver etapa 4).
- **Fim do combate:** só fecha e volta ao mapa-múndi; nada é registrado automaticamente.
- **Simplificação:** sem "aviso de próximo" separado (o banner de rodada já mostra de quem é a vez) e sem contador de duração de condição — o mestre remove a condição na mão quando passar.

## Etapa 4: construído (dados)
- Botão "🎲 Dados" (no mapa-múndi e no combate) com atalhos (1d20, 1d4...1d100) e um campo de expressão (`1d20+7`, `3d6+2`...). Aparece animado na tela dos jogadores: gira uns instantes e para no resultado, com o cálculo detalhado embaixo (`[rolagens]+mod`).
- **Rolar pelo monstro:** os botões de ataque da ficha (etapa 3) rolam o acerto (`1d20+bônus`) e o dano (a expressão da nota) direto.
- **Crítico/falha:** só para `1d20` puro — 20 natural fica dourado, 1 natural fica vermelho, cada um com um som diferente.
- **Simplificação grande:** os dados são 2D (giram uns números até parar), não um dado 3D caindo com física — dava muito mais trabalho pra um ganho pequeno. O som **não vem de nenhum arquivo**: é sintetizado na hora com a Web Audio API (osciladores), então funciona sem o Tito precisar gravar nada.

## Etapa 5: construído (rastro automático + globo)
- **Comando "Atualizar o rastro do grupo pelas sessões":** lê as notas de `01 Campanha/Sessões/` em ordem de `numero`, segue os links de `locais` de cada uma e monta o rastro do grupo (trilha na neblina) com essa sequência; de passagem, revela (estado + neblina) cada local que ainda não estava revelado. É um comando, não automático a cada nota salva — pra não mexer no jogo sem o mestre mandar.
- **"🌐 Ver no globo":** no cartão de um marcador, abre o Globo de Arton e seleciona a mesma nota nele (usa o Globo já instalado; não foi mexido nada no plugin `globo-arton`, só chamado de fora). Não tem o inverso ainda (um "🗺️ ver no mapa" a partir do Globo).

## Testado como
Simulação de Obsidian num Chromium headless (Playwright), cobrindo: matemática de zoom/pan/régua/criação de marcador (etapa 1); estados, neblina com raio certo, congelar/soltar, som (arquivo e YouTube), trilha (etapa 2); rolagem de dados dentro do intervalo esperado e mostrada na tela certa (etapa 4); ciclo completo de combate — abrir pelo marcador, trocar a tela dos jogadores sozinha, criar ficha a partir de nota (PV/defesa/ataques corretos), PV com clamp, condição, reordenar iniciativa preservando o turno, avançar rodada, rolar ataque, encerrar (etapa 3); rastro automático a partir das sessões e o link pro globo (etapa 5). **Ainda não foi aberto no Obsidian de verdade** — se o Tito testar e achar bug ou algo que pareça errado (o tamanho da grade, o raio da neblina do combate, o som sintetizado), é só pedir o ajuste numa conversa nova apontando pra esse arquivo.
