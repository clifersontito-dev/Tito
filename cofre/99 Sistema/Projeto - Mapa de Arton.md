---
tipo: ideia
projeto: mapa-de-arton
status: etapa 1 construída
---

# Mapa de Arton no cofre: design em construção (só ideia, não construir ainda)

## Contexto
O cofre "Arton do Tito" (Obsidian, campanha de Tormenta 20, Globo 3D, painel) já existe na branch `claude/obsidian-capabilities-688e5b` (PR #1). O Tito viu o site mapadearton.fichasdenimb.com.br e quer um mapa de Arton parecido dentro do cofre, com mais funções para mestrar. **Por enquanto estamos só desenhando juntos. Não é para construir.** Quando for construir: numa conversa nova, no Sonnet, em etapas.

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

## Modo combate (em desenho)
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

## Rolador de dados
- **Dados 3D na TV:** os dados caem e rolam na tela dos jogadores, com som, e o resultado aparece grande no fim.
- **Botões rápidos:** 1d20, 2d6, 1d8... e expressões como "1d20+7" ou "3d6+2".
- **Rolar pelo monstro:** no combate, clicar no ataque do monstro rola o ataque e o dano com os números da nota dele.
- **Crítico e falha:** 20 natural = explosão dourada e som épico; 1 natural = a tela racha e toca som de fracasso.
- (Rolagens secretas: não pedidas por ora.)

## Etapas sugeridas (quando for construir, cada uma numa conversa nova, no Sonnet)
1. **Básico:** mapa, zoom, marcadores (criar clicando → nota no cofre), camadas, régua, galeria com tela cheia
2. **Mesa:** tela dos jogadores (segue a do mestre, com botão congelar), neblina por marcador, três estados, revelação dramática, sons por lugar
3. **Combate:** mapa de batalha com grade, fichas, iniciativa (rodadas, reordenar, aviso de próximo), PV e condições, neblina de sala, efeitos de abertura
4. **Dados:** rolador 3D na TV, botões rápidos, rolar pelo monstro, efeitos de crítico e falha
5. **Magia:** rastro automático das sessões e ligação com o globo

Arquitetura provável: um plugin próprio no cofre (como o `globo-arton`), com a tela dos jogadores numa janela separada do Obsidian (arrastada para a TV). A imagem do mapa de Arton é fornecida pelo Tito (uso pessoal).


## Como pedir cada etapa
Numa conversa nova (no Sonnet), diga: *"Leia `cofre/99 Sistema/Projeto - Mapa de Arton.md` e construa a etapa 1"*, e anexe a imagem do mapa de Arton.

## Etapa 1: construída

Plugin **`mapa-arton`** (`cofre/.obsidian/plugins/mapa-arton/`), no mesmo estilo do `globo-arton`, com o que a etapa 1 pedia:
- Mapa (`99 Sistema/Anexos/mapa-arton.jpg`) com zoom (rodinha) e arrastar
- **+ Marcador:** clicar no mapa → escolher Reino / Local / NPC e o nome → cria a nota no cofre (modelo certo, pasta certa) e grava `mapa_x`/`mapa_y` no frontmatter dela
- **Camadas:** chips por tipo de marcador, para mostrar/esconder
- **Régua:** calibra uma vez clicando dois pontos na régua de km impressa no mapa; depois disso, cada medição mostra km e dias a pé/cavalo/barco (velocidades ajustáveis pelo comando "Ajustar velocidades de viagem")
- **Galeria:** nota com uma lista `galeria` de imagens no frontmatter mostra miniaturas no cartão do marcador; clique abre em tela cheia, com setas para navegar
- Embutido no 🏠 Painel (bloco `mapa-arton`) e com tela cheia própria (ícone 🗺️ na barra lateral)

Etapas 2 a 5 (tela dos jogadores, neblina, combate, dados, rastro automático) continuam como desenho, não construídas.

## Para o próximo chat continuar

**Onde está o trabalho:** branch `claude/affectionate-cray-nz3yjm` (aberta a partir de `claude/obsidian-capabilities-688e5b`, commit `fe14ca2`, que é onde este arquivo de projeto vive). Ainda **não tem PR aberto** e **não foi mesclada** na `main`. Se o Tito já tiver pedido/aprovado um PR dessa branch, comece a próxima etapa a partir dela; senão, pergunte antes de assumir que já foi mesclada.

**O que já existe (etapa 1):**
- Plugin `cofre/.obsidian/plugins/mapa-arton/` (`main.js`, `manifest.json`, `styles.css`) — ver a seção "Etapa 1: construída" acima para a lista de funções.
- Imagem do mapa em `cofre/99 Sistema/Anexos/mapa-arton.jpg`.
- Registrado em `cofre/.obsidian/community-plugins.json` e embutido no `🏠 Painel.md`.
- Dados de calibração da régua e velocidades de viagem ficam em `cofre/.obsidian/plugins/mapa-arton/data.json` (criado pelo próprio Obsidian na primeira vez que o Tito usar a régua — não existe ainda no repositório).

**Testado como:** simulação de Obsidian num Chromium headless (matemática de zoom/pan, calibração e medição da régua, criação de nota com `mapa_x`/`mapa_y`). **Ainda não foi aberto no Obsidian de verdade** — se o Tito já testou, pergunte o que ele viu (bugs, ajustes de estilo) antes de seguir para a etapa 2, porque isso pode mudar o que a etapa 2 precisa.

**Para construir a etapa 2 ("Mesa"):** parta do arquivo real do plugin (`cofre/.obsidian/plugins/mapa-arton/main.js`) em vez de reescrever do zero — ele já tem a classe `Mapa`, os marcadores com `mapa_x`/`mapa_y` no frontmatter e o padrão de `ItemView`/`MarkdownRenderChild` a seguir. A etapa 2 pede: tela dos jogadores (janela separada, só o mestre controla), botão congelar, neblina por marcador com raio próprio, três estados (oculto/rumor/revelado), revelação dramática (dissolve + zoom), sons por lugar (arquivo ou link do YouTube). Detalhes de cada item estão nas "Decisões já tomadas" (itens 6–9, 13–17) no topo deste arquivo.
