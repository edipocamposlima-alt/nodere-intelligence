# Deploy do NODERE Intelligence

## Link HTTPS do frontend

Frontend publicado por GitHub Pages:

https://edipocamposlima-alt.github.io/nodere-intelligence/

Rotas internas usam hash, por exemplo:

- https://edipocamposlima-alt.github.io/nodere-intelligence/#dashboard
- https://edipocamposlima-alt.github.io/nodere-intelligence/#empresas
- https://edipocamposlima-alt.github.io/nodere-intelligence/#configuracoes

O arquivo `404.html` redireciona acessos diretos quebrados de volta para o app.

## Atualizar o frontend

1. Edite os arquivos na raiz: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest` e `service-worker.js`.
2. Rode:

```bash
npm run check
```

3. Faça commit e push para `main`.
4. Aguarde o GitHub Pages publicar.
5. Abra o link com cache novo:

```text
https://edipocamposlima-alt.github.io/nodere-intelligence/?fresh=TIMESTAMP#dashboard
```

## Backend seguro

GitHub Pages nao executa backend. Para Google APIs, OpenAI, PageSpeed, Gmail, Calendar, Drive e WhatsApp sem expor chaves, publique `backend/` em Render ou Railway.

### Render

Opção mais rápida: use o Blueprint do Render com o arquivo `render.yaml` da raiz.

1. Abra Render > New > Blueprint.
2. Conecte o repositório `edipocamposlima-alt/nodere-intelligence`.
3. Confirme o serviço `nodere-api`.
4. Configure as variáveis marcadas como `sync: false`, principalmente `GOOGLE_PLACES_API_KEY`.
5. Depois do deploy, teste:

```text
https://nodere-api.onrender.com/api/health
```

Configuração manual equivalente:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`

Endpoints mínimos usados pelo frontend:

- `GET /api/health`
- `GET /api/places/search?companyName=&segment=&city=&state=&keyword=`
- `GET /api/v1/pagespeed/analyze`
- `POST /api/openai`

### Railway

- Root directory: `backend`
- Start command: `npm start`
- Porta: use a variavel `PORT` definida pela plataforma.

## Variaveis de ambiente do backend

Configure no painel da hospedagem, nunca no frontend:

```env
PORT=3333
FRONTEND_ORIGIN=http://localhost:4173
PRODUCTION_FRONTEND_ORIGIN=https://edipocamposlima-alt.github.io
MVP_OWNER_TOKEN=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_API_KEY=
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REFRESH_TOKEN=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_DEFAULT_COUNTRY_CODE=55
```

## Conectar frontend ao backend

1. Abra `https://edipocamposlima-alt.github.io/nodere-intelligence/#configuracoes`.
2. Em `URL da API`, informe a URL HTTPS do backend, por exemplo:

```text
https://nodere-api.onrender.com
```

3. Salve.
4. Abra `Integracoes` e valide Google Places, PageSpeed e OpenAI.

Se a busca mostrar erro de conexão para `https://nodere-api.onrender.com`, o serviço ainda não existe, está suspenso ou falhou no deploy. Abra a URL `/api/health`; se ela não responder JSON, corrija o backend no Render antes de testar a busca.

## Repositorio privado

Se o sistema for usado comercialmente:

1. GitHub > repository `nodere-intelligence`.
2. `Settings > General > Danger Zone`.
3. `Change repository visibility`.
4. Selecione `Private`.
5. Revise `Settings > Collaborators`, `Actions secrets`, `Deploy keys` e tokens.

## Testes de aceite

- Abrir o link HTTPS no computador.
- Abrir o link HTTPS no celular.
- Dar refresh em `#dashboard`, `#empresas` e `#configuracoes`.
- Validar que o app nao depende de `localhost`.
- Configurar backend HTTPS em `Configuracoes`.
- Buscar por nome da empresa em `Busca de empresas`.
- Buscar por segmento, cidade, estado e palavra-chave.
- Salvar lead no CRM e confirmar que nao duplica.
- Abrir ficha do lead no celular.
- Abrir chat IA flutuante no celular.
