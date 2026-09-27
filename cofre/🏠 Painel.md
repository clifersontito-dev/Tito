---
tipo: indice
cssclasses:
  - arton-painel
---

<div class="arton-hero">
<div class="arton-hero-sub">TORMENTA 20 · MESA DO MESTRE</div>
<div class="arton-hero-tit">Arton do Tito</div>
</div>

<div class="arton-pills">
<a class="internal-link arton-pill" data-href="Arton" href="Arton">🌍 Mundo</a>
<a class="internal-link arton-pill" data-href="Campanha" href="Campanha">📜 Campanha</a>
<a class="internal-link arton-pill" data-href="Panteão" href="Panteão">✦ Panteão</a>
<a class="internal-link arton-pill" data-href="Reinos e Regiões" href="Reinos e Regiões">🏰 Reinos</a>
<a class="internal-link arton-pill" data-href="Bestiário" href="Bestiário">🐉 Bestiário</a>
<a class="internal-link arton-pill" data-href="Linha do Tempo" href="Linha do Tempo">⏳ Linha do Tempo</a>
<a class="internal-link arton-pill" data-href="01 Campanha/Mapa de Caminhos.canvas" href="01 Campanha/Mapa de Caminhos.canvas">🗺️ Mapa de Caminhos</a>
</div>

```globo-arton
altura: 480
```

## 🗺️ Mapa de Arton

```mapa-arton
altura: 480
```

> [!exemplo]- Este cofre veio com uma campanha de EXEMPLO
> A campanha **A Fenda de Cristal Rubro** mostra como tudo se liga: sessão, NPCs, ameaças, segredos e caminhos até 7 passos à frente.
> Quando for começar a sua, apague as notas que têm `exemplo: true` (ou peça ao Claude: *"apague as notas de exemplo do cofre"*). O cânone de Tormenta fica.

## ⚡ Criar

```arton-criar
```

## 🎲 Para a próxima sessão

```dataviewjs
await dv.view("99 Sistema/Painel/proxima")
```

## ⏳ Relógios das ameaças

```dataviewjs
await dv.view("99 Sistema/Painel/relogios")
```

## 🧭 Caminhos à frente

```dataviewjs
await dv.view("99 Sistema/Painel/caminhos")
```

## 📜 Última sessão

```dataviewjs
await dv.view("99 Sistema/Painel/ultima")
```

## 🧵 Pontas soltas

```dataviewjs
await dv.view("99 Sistema/Painel/pontas")
```

## 🌍 O mundo em números

```dataviewjs
await dv.view("99 Sistema/Painel/numeros")
```

> [!tip] Depois de cada sessão
> Abra o Cowork e diga: **"registra a sessão de hoje no cofre"**, e cole ou dite o que aconteceu. A skill `mestre-arton` cria a nota da sessão, liga NPCs e locais, avança os relógios e marca os caminhos escolhidos.
> Para pensar à frente: **"planeja os próximos passos da campanha"**.
