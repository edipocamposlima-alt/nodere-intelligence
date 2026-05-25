# Deploy do backend

O GitHub Pages publica apenas o frontend estatico. Google APIs, OpenAI, WhatsApp, Gmail, Calendar e Drive precisam rodar no backend Node/Express.

## Render

1. Crie um novo `Web Service`.
2. Conecte o repositorio.
3. Configure:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Node: `>=20`
4. Adicione as variaveis do arquivo `.env.example`.
5. Publique.
6. Copie a URL publica do backend.
7. No Nodere, abra `Configuracoes` e salve a URL em `URL do backend seguro`.

## Railway

1. Crie um novo projeto.
2. Conecte o repositorio.
3. Defina o servico com root `backend`.
4. Configure as mesmas variaveis de ambiente.
5. Use `npm start` como comando de start.
6. Copie o dominio publico e salve no frontend.

## Validacao

Teste:

- `GET /health`
- `GET /api/v1/integrations/status?live=1`
- `POST /api/v1/search/google-places`
- `POST /api/v1/pagespeed/analyze`
- `POST /api/openai`

Se `MVP_OWNER_TOKEN` estiver preenchido, envie `Authorization: Bearer <token>` nas chamadas.

## Desenvolvimento local sem Render

O arquivo `serve-nodere.mjs` tambem expoe endpoints locais para testes em `localhost:4173`:

- `POST /api/v1/search/google-places`
- `POST /api/v1/pagespeed/analyze`
- `POST /api/openai`
- `POST /api/v1/integrations/status?live=1`

Use esse modo somente para desenvolvimento local. Para operacao real, publique o backend Express em Render/Railway.
