# Repositorio privado

As chaves reais ja compartilhadas devem ser consideradas comprometidas. Revogue e regenere no Google Cloud, OpenAI e Meta antes de usar em producao.

## Tornar o repositorio privado

1. Acesse o repositorio no GitHub.
2. Abra `Settings`.
3. Em `General`, role ate `Danger Zone`.
4. Clique em `Change repository visibility`.
5. Selecione `Private`.
6. Confirme o nome do repositorio.

## Revisao de acesso

Revise:

- `Settings > Collaborators and teams`
- `Settings > Secrets and variables > Actions`
- `Settings > Deploy keys`
- `Settings > Webhooks`
- `Settings > Pages`

Remova qualquer colaborador, deploy key, token ou secret que nao seja necessario.

## Regra de seguranca

Nunca salve `.env`, tokens, chaves Google, chaves OpenAI, refresh tokens OAuth ou dumps de banco no GitHub. Use apenas variaveis de ambiente no backend publicado.
