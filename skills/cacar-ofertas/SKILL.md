---
name: cacar-ofertas
description: "Agente do Caça ao Preço: procura sozinho boas ofertas no painel de afiliados da Shopee, descarta as suspeitas, gera o link de afiliado e deixa os posts prontos para o Tito aprovar. Usar quando uma tarefa agendada rodar, ou quando o Tito pedir para caçar ofertas, achar promoções ou encher a fila do canal."
---

# Caçar ofertas para o Caça ao Preço

Você faz a parte chata sozinho: acha as ofertas, confere se são boas e monta os posts. **Nada vai para o WhatsApp sem o "pode" do Tito.** Essa regra vale mesmo quando a tarefa rodar agendada e ele não estiver olhando.

Para ler produto, gerar link de afiliado, montar o texto e colar no WhatsApp, siga a skill **postar-oferta**. Ela é a referência do formato e das regras do texto. Esta skill só cuida do que vem antes: escolher o que postar.

Use as ferramentas do Claude in Chrome.

## Ajustes (o Tito pode mudar estes números)

- **Posts por rodada:** 3
- **Desconto mínimo real:** 30% (preço "De" contra preço "Por" na página do produto)
- **Preço máximo:** R$ 300 (o público do canal compra por impulso)
- **Não repetir produto postado nos últimos:** 14 dias
- **Arquivo de histórico:** `Caça ao Preço/historico.md`, dentro da pasta que o Tito liberou para o Cowork

## 1. Juntar candidatos

Abra o painel de afiliados em **Oferta de produto** (`https://affiliate.shopee.com.br/offer/product_offer`). Se o endereço mudar, entre pelo menu do painel.

Colete uns 15 candidatos, olhando primeiro:

1. Ofertas relâmpago e produtos com contador na página
2. Os mais vendidos com comissão boa
3. Categorias que o canal costuma postar: casa, cozinha, beleza, eletrônicos baratos, utilidades

Para cada candidato, anote o nome, o link, a comissão e o preço que o painel mostra.

## 2. Filtrar

Descarte o candidato quando:

- Ele aparece no `historico.md` nos últimos 14 dias.
- O desconto **na página do produto** fica abaixo do mínimo. O que vale é a página, não o painel (veja o passo 1 da postar-oferta).
- A página não mostra preço antigo. Sem "De", não há oferta para anunciar.
- O preço passa do máximo.
- **Parece falsificado**: preço impossível para a marca, marca escrita diferente no título e na descrição, marca famosa num produto genérico. Pode descartar sem pena, porque tem candidato de sobra.
- Ele promete algo que a skill postar-oferta proíbe prometer, como medir pressão ou oxigênio num aparelho barato.
- A loja tem poucas avaliações, ou avaliações recentes reclamando que o produto não chegou.

Dos que sobrarem, fique com os melhores até completar os posts da rodada. Prefira desconto maior, urgência real (estoque baixo, relâmpago) e variedade de categoria. Não pegue três fones de ouvido na mesma rodada.

Se sobrar menos do que o combinado, entregue menos. Nunca rebaixe os critérios para completar a conta.

## 3. Montar os posts

Para cada escolhido, siga os passos 1 a 3 da **postar-oferta**: ler o produto, gerar o link de afiliado e montar o texto. **Pare aí.** Não abra o WhatsApp ainda.

Se aparecer o aviso da conta de comissão ("ative sua conta..."), avise o Tito no topo do resumo.

## 4. Entregar para aprovação

Mostre tudo numa mensagem só, com os posts numerados:

```
🔎 Rodada de [hora] — [N] ofertas prontas

1️⃣ [nome curto] — R$ [por] (de R$ [de], -[X]%) — comissão [Y]%
   Por que escolhi: [uma linha]
   [texto completo do post]

2️⃣ ...

Descartei [N] produtos: [um motivo curto de cada suspeito, se houve]

Responda "pode 1 e 3", "pode todos" ou "troca o 2".
```

Depois disso, **pare e espere**. Se a tarefa agendada terminar sem resposta, os posts ficam na conversa e ele aprova quando abrir.

## 5. Depois do "pode"

Para cada post aprovado, um de cada vez, siga os passos 4 e 5 da **postar-oferta**: colar no WhatsApp, conferir o nome da conversa com um zoom e enviar. A aprovação dele na mensagem da rodada já conta como o "pode" do passo 5. Mesmo assim, confira o nome da conversa antes de cada envio.

- "troca o 2": volte ao passo 2 e ofereça outro candidato.
- Se o preço mudou entre montar o post e enviar, releia a página, corrija o texto e mostre de novo antes de enviar.

Depois de cada envio, acrescente uma linha no `historico.md`:

```
2026-09-27 19:05 | [nome do produto] | [link original] | R$ [por]
```

Crie o arquivo se ele não existir. Anote também os descartados por suspeita de falsificação, marcados com `[suspeito]`, para não perder tempo com eles de novo.
