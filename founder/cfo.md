# CFO: Caça ao Preço

## Nota do CFO

**Uma "venda" aqui é uma compra feita pelo link de afiliado.** O que entra no caixa é a comissão da Shopee, não o preço do produto. Na tabela de 18 produtos com comissão conhecida, o preço médio é R$ 54,46 e a comissão média é de 6,1%, o que dá **R$ 3,48 por venda** (mediana de R$ 2,35). Metade desses produtos (9 de 18) paga só 3%.

**A meta.** Com R$ 3,48 por venda, R$ 20.000 de comissão por mês pedem **5.748 vendas no mês, ou 192 por dia**. Isso é faturamento. Se houver anúncio pago, o lucro é menor.

**A linha a observar: o custo do anúncio por venda.** É o número que mais muda o resultado, e ninguém o mediu ainda. Os valores abaixo são cenários para mostrar o efeito, não estimativas:

| anúncio por venda (cenário) | sobra por venda | margem | vendas/dia para R$ 20 mil de **lucro** |
|---|---:|---:|---:|
| R$ 0 (orgânico) | R$ 3,48 | 100% | 192 |
| R$ 1 | R$ 2,48 | 71% | 269 |
| R$ 2 | R$ 1,48 | 43% | 451 |
| R$ 3 | R$ 0,48 | 14% | 1.389 |
| acima de R$ 3,48 | prejuízo | — | impossível |

**Teto do anúncio: R$ 3,48 por venda.** Acima disso, cada venda paga dá prejuízo. Exemplo (hipotético): se 1 em cada 10 membros novos comprar uma vez, o máximo que vale pagar por membro é R$ 0,35. Se cada membro compra várias vezes ao longo dos meses, esse teto sobe, e por isso medir quanto um membro compra em 30 e 90 dias é o número mais importante agora.

**Caixa.** Não há aluguel, estoque nem salário informado, então o dinheiro em risco é só o orçamento do anúncio de teste. Ele ainda não foi definido. Escolham um valor que vocês aceitam perder inteiro.

**Três jeitos de melhorar a margem** (rodados na ferramenta, no cenário de R$ 2 por venda):
1. **Postar só produtos com 7% ou mais de comissão.** Os 9 produtos da tabela nessa faixa pagam em média R$ 5,54 por venda. A sobra por venda vai de R$ 1,48 para R$ 3,54 (mais que o dobro), e as vendas para R$ 20 mil de faturamento caem de 192 para 120 por dia.
2. **Anunciar os campeões de comissão**, como o Triciclo Kemotoca (R$ 10,80) e a Lixeira Trium (R$ 10,71). Cada venda deles paga o mesmo que 3 vendas médias, então aguentam um anúncio 3 vezes mais caro.
3. **Conferir no painel se a comissão vale para o carrinho inteiro.** Em vários programas de afiliado, quem entra pelo seu link e compra outras coisas também gera comissão. Isso não está confirmado aqui; se for verdade, o valor real por venda é maior que R$ 3,48.

**Condições do conselho sobre dinheiro** (`founder/board.md`):
- [x] Comissão média e ticket médio: R$ 3,48 por venda e R$ 54,46 de ticket (18 produtos).
- [x] Conta da meta escrita: 192 vendas/dia × R$ 3,48 × 30 = R$ 20 mil de faturamento.
- [ ] Teste de anúncio com orçamento fixo: ainda falta. É ele que dá o número que decide tudo.

Não é aconselhamento financeiro ou fiscal. Um contador deve conferir como declarar a comissão (MEI ou outra forma) antes de o dinheiro começar a entrar.

---

## Saída da ferramenta (cenário: anúncio a R$ 2 por venda; valores em R$, a ferramenta imprime "$")

# Unit economics: Caça ao Preço (cenário: anúncio custa R$ 2 por venda)

Every number below comes from the input file. Nothing is looked up or guessed.

## One venda pelo link de afiliado

| line | per venda pelo link de afiliado |
| --- | ---: |
| Price | $3.48 |
| Anúncio Meta por venda (cenário, não medido) | -$2.00 |
| **Contribution** (what each venda pelo link de afiliado leaves to pay the fixed costs) | **$1.48** (43%) |

## The margin that matters

Fixed costs: $0 a month (none given).

- **Break-even: 0 venda pelo link de afiliados a day.** Below that you lose money every month.
- **Profit margin at your plan** (192 a day): **43%** of every sale, after every cost.

## Year 1, month by month

| month | venda pelo link de afiliados a day | revenue | profit | cumulative (after $0 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 192 | $20,045 | $8,525 | $8,525 |
| 2 | 192 | $20,045 | $8,525 | $17,050 |
| 3 | 192 | $20,045 | $8,525 | $25,574 |
| 4 | 192 | $20,045 | $8,525 | $34,099 |
| 5 | 192 | $20,045 | $8,525 | $42,624 |
| 6 | 192 | $20,045 | $8,525 | $51,149 |
| 7 | 192 | $20,045 | $8,525 | $59,674 |
| 8 | 192 | $20,045 | $8,525 | $68,198 |
| 9 | 192 | $20,045 | $8,525 | $76,723 |
| 10 | 192 | $20,045 | $8,525 | $85,248 |
| 11 | 192 | $20,045 | $8,525 | $93,773 |
| 12 | 192 | $20,045 | $8,525 | $102,298 |

- **Year 1 operating profit: $102,298** on $240,538 of revenue.
- After the $0 startup spend: $102,298.
- Startup money earned back: month 1.
- Cash you need before it pays for itself: **$0**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 43% | 0 | $102,298 |
| Price -10% | 36% | 0 | $78,244 |
| Volume -20% | 43% | 0 | $81,838 |
| Unit costs +15% | 34% | 0 | $81,562 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
