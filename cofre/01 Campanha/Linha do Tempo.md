---
tipo: "indice"
---

# ✦ Linha do Tempo

## Passado de Arton (cânone)
- [[A Chegada da Tormenta]]
- [[Queda de Lenórienn]]
- [[Guerra Artoniana]]
- [[Ascensão de Thwor]]

## Eventos da sua Arton
```dataview
TABLE WITHOUT ID file.link AS "Evento", quando AS "Quando"
FROM "02 Mundo/Eras e Eventos"
WHERE canon != true
SORT quando ASC
```

## Campanha
```dataview
TABLE WITHOUT ID file.link AS "Sessão", data AS "Data", resumo AS "Resumo"
FROM "01 Campanha/Sessões"
SORT numero ASC
```
