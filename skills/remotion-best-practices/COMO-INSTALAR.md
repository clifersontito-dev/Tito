# Skill Remotion (criar vídeos com código)

Pacote oficial do Remotion (github.com/remotion-dev/skills, versão 4.0.546).
Ensina o Claude a criar, editar, legendar e renderizar vídeos com Remotion (React).

## No app do Claude

1. Baixe o arquivo `remotion-best-practices.zip`.
2. Vá em **Configurações → Capacidades → Skills** e clique em **Enviar skill**.
3. Escolha o `remotion-best-practices.zip`.

Depois é só pedir, por exemplo: "cria um vídeo de 15 segundos no Remotion anunciando a oferta do dia".

## No terminal (Claude Code)

Dentro do projeto, rode:

    npx skills add remotion-dev/skills

## O que vem dentro

Uma skill principal que direciona para as outras: criar projeto, animação e efeitos,
legendas, mapas, áudio/vídeo, renderizar, Studio, atualizar versão e licença.
Para uso comercial por empresa, o Remotion pode exigir licença paga (veja remotion-license).
