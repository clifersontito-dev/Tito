# Cofre "Arton do Tito": regras para a IA

Este é o cofre do Obsidian em que o Tito, mestre de Tormenta 20, constrói **a versão dele de Arton** e registra a campanha que ele mestra. O sistema e o cânone são os de Tormenta 20. A história é dele.

Objetivo do cofre: **tudo conectado e nada se perde.** Cada coisa que acontece na mesa vira nota ligada ao mundo, e as ligações ajudam o mestre a planejar de 5 a 7 passos à frente.

## Regras de ouro

1. **Nunca apague nem sobrescreva o que o Tito escreveu.** Acrescente. Se algo mudou, registre a mudança (por exemplo, `status: morto` mais uma linha na seção de aparições), mas não apague o passado.
2. **Nunca contradiga o que já aconteceu na mesa.** As sessões são a fonte da verdade. Se o cânone do livro diz outra coisa, vale a mesa; anote na seção "Na minha Arton".
3. **Toda nota nova precisa de links**, no mínimo para o lugar, as pessoas e a sessão ou arco de onde veio. Nota sem link é informação perdida.
4. **Toda nota tem `tipo` no topo (frontmatter).** O painel e o Globo usam esse campo.
5. **Antes de criar, procure.** Se já existe uma nota com aquele nome, ou parecido ("Barão Vane" e "Barão Orsik Vane"), atualize a existente.
6. **`canon: true` só para o que é do livro.** Tudo que o Tito inventar é `canon: false`.
7. Escreva em português do Brasil, de forma curta e útil para a mesa. Nada de parágrafos longos.
8. Nomes de arquivo sem os caracteres `/ \ : * ? " < > | # ^ [ ]`.

## Estrutura

| Pasta | `tipo` | O que guarda |
|---|---|---|
| `00 Inbox/` | `ideia` | Ideias soltas e anotações rápidas |
| `01 Campanha/Sessões/` | `sessao` | Uma nota por sessão: `Sessão 07 - Título` |
| `01 Campanha/Arcos/` | `arco` | Grandes histórias |
| `01 Campanha/Caminhos/` | `caminho` | Ramificações possíveis, com `passo` (1 a 7), `vem_de`, `leva_a`, `status` |
| `01 Campanha/Ameaças/` | `ameaca` | Frentes com relógio: `relogio_atual`/`relogio_total` e `presagios` |
| `01 Campanha/Segredos e Pistas/` | `segredo` | `revelado` (true/false) e `pistas_em` |
| `02 Mundo/Deuses/` | `deus` | O Panteão e deuses novos |
| `02 Mundo/Raças/` | `raca` | |
| `02 Mundo/Reinos e Regiões/` | `reino` | Reinos, regiões e cidades grandes |
| `02 Mundo/Locais/` | `local` | Vilas, masmorras, tavernas, ruínas |
| `02 Mundo/Facções/` | `faccao` | |
| `02 Mundo/Eras e Eventos/` | `evento` | Acontecimentos históricos (`quando`) |
| `03 Personagens/NPCs/` | `npc` | `status`: vivo, morto, desaparecido... |
| `03 Personagens/Jogadores/` | `pj` | Personagens dos jogadores |
| `04 Bestiário/` | `monstro` | |
| `05 Itens e Artefatos/` | `item` | |
| `99 Sistema/` | | Modelos (`Templates/`) e scripts do painel. **Não mexa sem o Tito pedir.** |

Os modelos de cada tipo estão em `99 Sistema/Templates/`. Use o mesmo frontmatter ao criar notas. Links no frontmatter vão entre aspas: `local: "[[Pedra-Funda]]"`.

## Status dos caminhos
- `possível`: preparado pelo mestre, os jogadores ainda não chegaram
- `ativo`: opção aberta agora, na próxima sessão
- `escolhido`: os jogadores foram por aqui (vira história)
- `descartado`: não vai mais acontecer (não apague: pode voltar)

## Notas de exemplo
Notas com `exemplo: true` são da campanha de demonstração "A Fenda de Cristal Rubro". Se o Tito pedir para apagar os exemplos, apague **só** essas notas e o arquivo `01 Campanha/Mapa de Caminhos.canvas`, e depois tire os links quebrados que sobrarem nos índices (`Campanha`, `Facções de Arton`).
