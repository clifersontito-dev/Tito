# Como ligar o agente do Caça ao Preço

O agente roda no seu PC, pelo **Cowork**, usando o seu Chrome, que já está logado na Shopee Afiliados e no WhatsApp Web.

Ele trabalha assim: caça as ofertas, confere se são confiáveis, monta os posts e **te espera aprovar**. Nada é enviado sem o seu "pode".

## Passo 1: instalar a skill

1. Baixe o arquivo `cacar-ofertas.zip`.
2. No app do Claude, vá em **Configurações → Capacidades → Skills** e clique em **Enviar skill**.
3. Escolha o `cacar-ofertas.zip`.

A skill **postar-oferta**, que você já tem, continua sendo usada. O agente segue o formato dela.

## Passo 2: liberar uma pasta para o histórico

No Cowork, libere uma pasta (por exemplo, `Documentos`). O agente cria ali a pasta `Caça ao Preço` com o arquivo `historico.md`, para não repetir produto.

## Passo 3: agendar

No Cowork, crie uma **tarefa agendada** com este texto:

> Use a skill cacar-ofertas e prepare a rodada de ofertas do Caça ao Preço. Não envie nada sem a minha aprovação.

Sugestão de horários: **9h, 13h e 19h**, todos os dias.

O PC precisa estar ligado e o Chrome aberto nesses horários.

## No dia a dia

Quando a rodada ficar pronta, abra a conversa e responda:

- **"pode todos"**: ele posta todas as ofertas
- **"pode 1 e 3"**: ele posta só essas
- **"troca o 2"**: ele procura outra oferta no lugar

## Quer mudar alguma coisa?

No topo da skill há uma parte chamada **Ajustes**: quantidade de posts, desconto mínimo, preço máximo e dias sem repetir. É só pedir, por exemplo "muda o desconto mínimo para 40%", que eu altero para você.
