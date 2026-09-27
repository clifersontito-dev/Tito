# Como abrir o cofre "Arton do Tito"

Leva uns 5 minutos, e só na primeira vez.

## 1. Baixar
**Jeito mais fácil:** baixe o arquivo **`Arton-do-Tito.zip`** que o Claude mandou no chat, descompacte e pule para o passo 2.

**Pelo GitHub:**
1. Abra no navegador: **github.com/clifersontito-dev/Tito**
2. Troque para a branch `claude/obsidian-capabilities-688e5b` (botão com o nome da branch, no canto superior esquerdo).
3. Clique em **Code → Download ZIP** e descompacte.
4. Dentro dela está a pasta **`cofre`**. Mova essa pasta para onde quiser guardar (por exemplo, `Documentos/Arton do Tito`).

> Não tem o Obsidian? Baixe grátis em **obsidian.md**.

## 2. Abrir no Obsidian
1. Abra o Obsidian → **Abrir pasta como cofre** → escolha a pasta `cofre`.
2. Vai aparecer um aviso sobre plugins da comunidade: clique em **Confiar no autor e ativar plugins**.
3. Pronto: o **🏠 Painel** abre sozinho, com o globo girando no topo.

Se o painel aparecer com blocos de código em vez de gráficos, feche e abra o Obsidian de novo (os plugins carregam na segunda abertura).

## 3. Usar no dia a dia

| Quero... | Faço assim |
|---|---|
| Ver o globo grande | Botão **⤢ Tela cheia** no globo do painel, ou o ícone 🌐 na barra da esquerda |
| Ver com o que uma coisa se liga | Clique no ponto do globo; o cartão mostra todas as ligações |
| Abrir uma nota pelo globo | Duplo clique no ponto, ou **Abrir nota** no cartão |
| Criar NPC, sessão, local... | Botões **+ NPC**, **+ Sessão** etc. no painel. A nota já nasce no lugar certo, com o modelo pronto |
| Ligar uma coisa a outra | Escreva `[[` e o nome da nota. O Obsidian completa sozinho |
| Ver os caminhos à frente | Seção **🧭 Caminhos à frente** no painel, ou o **🗺️ Mapa de Caminhos** |
| Avançar uma ameaça | Abra a ameaça e aumente `relogio_atual` no topo da nota |

**A regra que faz tudo funcionar:** sempre que escrever o nome de um NPC, lugar ou deus, coloque entre `[[ ]]`. É isso que cria as linhas do globo.

## 4. Deixar a IA registrar as sessões (recomendado)
1. No app do Claude, vá em **Configurações → Capacidades → Skills → Enviar skill** e escolha o arquivo `mestre-arton.zip` (vem junto no ZIP que você baixou).
2. No **Cowork**, libere a pasta do cofre.
3. Depois de cada sessão, diga ao Cowork:
   - **"registra a sessão de hoje no cofre"**, e cole ou dite o que aconteceu
   - **"planeja os próximos passos da campanha"**
   - **"o que eu esqueci na campanha?"**

A IA segue as regras do arquivo `CLAUDE.md`: nunca apaga o que você escreveu, sempre liga as notas e pergunta antes de mexer nos relógios das ameaças.

## 5. Começar a sua campanha
O cofre vem com:
- **Cânone de Tormenta 20** resumido: os 20 deuses, as raças, os reinos, o bestiário e as facções, já ligados entre si. Cada nota tem uma seção **"Na minha Arton"** para você escrever o que muda na sua versão.
- Uma **campanha de EXEMPLO** ("A Fenda de Cristal Rubro"), para mostrar como tudo se liga. Quando quiser, apague as notas com `exemplo: true`, ou peça ao Cowork: *"apaga as notas de exemplo do cofre"*.

## Plugins que já vêm instalados
- **Globo de Arton**: o globo 3D, feito sob medida para este cofre
- **Mapa de Arton**: mapa de Arton com zoom, marcadores que criam notas, camadas, régua de viagem e galeria (etapa 1; mais etapas em `99 Sistema/Projeto - Mapa de Arton.md`)
- **Dataview**: as tabelas e os relógios do painel
- **Homepage**: abre o painel quando o Obsidian inicia
- **New 3D Graph**: um segundo grafo 3D, de reserva (comando "Open 3d graph")
