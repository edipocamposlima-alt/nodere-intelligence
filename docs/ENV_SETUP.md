# Configuracao de variaveis de ambiente

Use placeholders no repositorio e valores reais apenas no `.env` local ou no painel Render/Railway.

## Variaveis minimas

```env
PORT=3333
FRONTEND_ORIGIN=http://localhost:4173
PRODUCTION_FRONTEND_ORIGIN=https://edipocamposlima-alt.github.io
MVP_OWNER_TOKEN=

GOOGLE_API_KEY=
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

## OAuth Google

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=

GOOGLE_WORKSPACE_CLIENT_ID=
GOOGLE_WORKSPACE_CLIENT_SECRET=
GOOGLE_WORKSPACE_REFRESH_TOKEN=
```

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` funcionam como aliases para os fluxos Google quando os nomes especificos nao forem preenchidos.

## WhatsApp

```env
WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_DEFAULT_COUNTRY_CODE=55
```

## Banco

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Revogacao de chaves comprometidas

1. Google Cloud: `APIs & Services > Credentials`, revogue as API keys antigas e crie novas com restricoes por API e dominio/IP.
2. OpenAI Platform: `API keys`, revogue a chave antiga e crie nova chave de projeto.
3. Meta/WhatsApp: regenere token e revise permissao do app.

Depois disso, atualize somente o backend/.env ou as variaveis do Render/Railway.

## Modo desenvolvimento local

Para testar sem publicar o backend:

1. Rode o frontend local em `http://localhost:4173`.
2. Abra `Configuracoes`.
3. Ative `Modo desenvolvimento local`.
4. Preencha as chaves de teste manual.
5. Salve e valide em `Integracoes`.

Esse modo usa endpoints locais em `serve-nodere.mjs` e deve ser usado apenas em `localhost`. Em producao, deixe esses campos vazios e use variaveis de ambiente no backend.
