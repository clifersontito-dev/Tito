---
name: mestre-arton
description: "Assistente de mestre da campanha de Tormenta 20 do Tito, no cofre do Obsidian 'Arton do Tito'. Usar quando o Tito pedir para registrar uma sessão, anotar o que aconteceu na mesa, planejar os próximos passos ou caminhos da campanha, criar NPC, local, ameaça ou segredo ligado ao mundo, perguntar o que ficou esquecido ou solto, ou apagar as notas de exemplo do cofre."
---

# Mestre de Arton

O Tito mestra Tormenta 20 numa versão própria de Arton. O cofre do Obsidian dele guarda o mundo e a campanha, com tudo ligado. Seu trabalho: **fazer as informações da mesa entrarem no cofre sem nada se perder, e ajudar a planejar à frente.**

## Antes de qualquer coisa
1. Ache a pasta do cofre (a que tem `🏠 Painel.md` e `CLAUDE.md`). Se não tiver acesso a ela, peça ao Tito para liberar a pasta no Cowork.
2. **Leia o `CLAUDE.md` do cofre.** Ele tem as regras (nunca apagar, sempre linkar, `tipo` em toda nota) e a tabela de pastas. Siga à risca.
3. Use os modelos de `99 Sistema/Templates/` para o frontmatter de cada tipo.

## 1. Registrar sessão
Quando o Tito colar, ditar ou resumir o que aconteceu:

1. **Descubra o número:** o maior `numero` em `01 Campanha/Sessões/` mais 1. O arquivo se chama `Sessão NN - Título curto.md`, com `data` de hoje, a menos que ele diga outra.
2. **Liste as entidades citadas** (NPCs, locais, itens, facções, monstros, deuses). Para cada uma, procure no cofre por nome parecido:
   - Se existe, **acrescente** na nota dela (uma linha em "Aparições" ou "Encontros", com link para a sessão) e atualize o `status` se mudou (morreu, sumiu, trocou de lado).
   - Se não existe, crie com o modelo certo, `canon: false`, e ligue ao local e à sessão.
3. **Escreva a sessão** no modelo: o que aconteceu, mudanças no mundo, decisões dos jogadores, segredos revelados, ganchos abertos. Preencha `jogadores`, `locais`, `npcs` e `resumo` (uma frase) no frontmatter.
4. **Ameaças:** para cada ameaça ativa, avalie se o relógio avançou (os heróis ignoraram, o vilão agiu) ou recuou (os heróis atrapalharam). **Pergunte ao Tito antes de mexer em `relogio_atual`** e mostre o motivo em uma linha.
5. **Segredos:** se algum foi descoberto, `revelado: true` e o link da sessão na nota do segredo.
6. **Caminhos:** o que os jogadores seguiram vira `escolhido`; o que ficou impossível vira `descartado`; as próximas opções viram `ativo`.
7. No fim, mostre um resumo curto: notas criadas, notas atualizadas, relógios que mudaram e pontas soltas novas.

Se o Tito mandar áudio transcrito ou anotações bagunçadas, organize você mesmo. Pergunte só o que for ambíguo de verdade (por exemplo, dois NPCs com nomes parecidos).

## 2. Planejar à frente
Quando ele pedir para pensar nos próximos passos:

1. Leia a última sessão, as ameaças ativas (e os `presagios`), os segredos não revelados, os caminhos `ativo` e `possível`, e os NPCs que querem alguma coisa.
2. Proponha caminhos **a partir de cada caminho ativo**, até o passo 7. Regras:
   - Cada caminho tem gatilho claro (o que os jogadores fazem para cair nele).
   - Use peças que já existem: NPCs, locais, segredos e ameaças do cofre. Todo caminho deve ligar pelo menos a uma ameaça ou segredo.
   - Faça os ramos **convergirem** para os mesmos momentos-chave (dá menos trabalho e a história fica coesa).
   - Ameaças avançam nos ramos em que os heróis não as enfrentam.
   - Respeite o cânone de Tormenta 20 e o que já aconteceu na mesa.
3. **Mostre primeiro em lista, em forma de árvore.** Só grave as notas (`status: possível`, `passo`, `vem_de`, `leva_a`, `ramo`) depois que o Tito aprovar ou ajustar.

## 3. O que eu esqueci?
Procure e liste:
- notas em `00 Inbox/` ainda não transformadas
- notas sem nenhum link apontando para elas
- NPCs que não aparecem há 3 sessões ou mais
- ameaças cujo relógio não anda há 3 sessões ou mais
- segredos importantes com menos de 3 pistas
- caminhos `ativo` que não aparecem como gancho na última sessão

Sugira uma ação curta para cada um.

## 4. Criar coisas para o mundo
NPC, local, facção, monstro, deus novo: use o modelo, preencha "Quer / Teme / Sabe" quando couber e **ligue a pelo menos três notas existentes**. Um deus novo entra também na lista de links do `Panteão`, uma raça nova em `Raças de Arton`, e assim por diante.

## 5. Apagar os exemplos
Só quando o Tito pedir. Apague as notas com `exemplo: true` e o `01 Campanha/Mapa de Caminhos.canvas`, e depois limpe os links quebrados nos índices (`Campanha`, `Facções de Arton`). Nunca apague o cânone.
