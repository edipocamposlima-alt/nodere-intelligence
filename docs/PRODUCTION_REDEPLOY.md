# NODERE Nexus - Reativacao de deploy em producao

Este documento registra o estado necessario para publicar o codigo atual em producao.

## URLs de producao

- Frontend: https://nodere.com.br
- Backend principal: https://nodere-api.onrender.com
- Repositorio: https://github.com/edipocamposlima-alt/nodere-intelligence

## Estado diagnosticado

O codigo corrigido ja esta na branch `main`, mas os servicos publicados ainda estao rodando builds antigos:

- `https://nodere.com.br/dashboard` retorna 404 porque a Vercel ainda serve um build anterior sem as rotas alias.
- `https://nodere.com.br/manifest.json` retorna 404 porque a Vercel ainda nao publicou o PWA novo.
- `https://nodere-api.onrender.com/api/health` retorna 401 porque o Render ainda serve a versao antiga com token obrigatorio.

## Vercel

Projeto local vinculado:

- `apps/web/.vercel/project.json`
- projectName: `web`
- projectId: `prj_3xkck9dJBFgYSJWFlaleK2zuWNUL`

Configuracao esperada do projeto Vercel:

- Framework Preset: Next.js
- Root Directory: `apps/web`
- Build Command: `npm run build`
- Output Directory: vazio/padrao do Next.js
- Production Branch: `main`

Variaveis Vercel:

```env
NEXT_PUBLIC_API_URL=https://nodere-api.onrender.com/api
```

Nao configure chaves Google/OpenAI na Vercel. Chaves sensiveis ficam somente no Render/backend.

Passos:

1. Abrir Vercel Dashboard.
2. Selecionar o projeto `web` ligado ao dominio `nodere.com.br`.
3. Confirmar que o Git repository e `edipocamposlima-alt/nodere-intelligence`.
4. Confirmar Root Directory `apps/web`.
5. Em Deployments, clicar em redeploy do commit mais recente da `main`.
6. Se nao houver deploy novo, reconectar Git Integration com a branch `main`.

Validacao:

```text
https://nodere.com.br
https://nodere.com.br/dashboard
https://nodere.com.br/configuracoes
https://nodere.com.br/manifest.json
https://nodere.com.br/sw.js
```

## Render

Servico principal:

- `nodere-api`
- URL: https://nodere-api.onrender.com
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Variaveis Render obrigatorias:

```env
NODE_ENV=production
REQUIRE_OWNER_TOKEN=false
FRONTEND_ORIGIN=https://nodere.com.br
PRODUCTION_FRONTEND_ORIGIN=https://nodere.com.br
CORS_ORIGINS=https://nodere.com.br,https://www.nodere.com.br
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Passos:

1. Abrir Render Dashboard.
2. Selecionar o servico `nodere-api`.
3. Confirmar que o deploy usa branch `main`.
4. Confirmar `REQUIRE_OWNER_TOKEN=false`.
5. Clicar em **Manual Deploy > Deploy latest commit**.
6. Aguardar logs mostrarem `Nodere MVP API running`.

Validacao:

```text
https://nodere-api.onrender.com/api/health
https://nodere-api.onrender.com/api/dashboard
https://nodere-api.onrender.com/api/places/search?segment=academia&city=Caxias%20do%20Sul&state=RS&limit=2
https://nodere-api.onrender.com/api/openai/health
```

## Criterio de sucesso

- `/dashboard` e `/configuracoes` abrem no frontend sem 404.
- `/manifest.json` e `/sw.js` existem.
- `/api/health` retorna 200 sem token.
- `/api/places/search` retorna empresas reais ou erro Google claro.
- Frontend nao usa dados demonstrativos silenciosos.
- Nenhuma chave real aparece no frontend ou no repositorio.
