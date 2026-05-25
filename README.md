# NODERE Intelligence

Sistema de prospeccao comercial para localizar empresas no Google, salvar leads em CRM, auditar presenca digital e gerar diagnosticos comerciais com OpenAI.

## Versao SaaS operacional

A versao publicada no GitHub Pages funciona como uma SPA sem backend obrigatorio:

- CRM operacional persiste em `localStorage` no GitHub Pages e tem estrutura preparada para Supabase/PostgreSQL.
- Configuracoes persistem em `localStorage`.
- Busca Google Places usa a chave configurada na tela.
- PageSpeed usa a chave configurada na tela.
- WhatsApp abre `wa.me` com mensagem pronta.
- IA chama um endpoint backend seguro configuravel. Use `/api/openai` no backend Node/Express para nao expor `OPENAI_API_KEY`.
- Sem endpoint IA, o sistema usa fallback operacional local identificado para manter agenda, priorizacao e proximos passos funcionando.

Aviso: chaves salvas no navegador servem para operacao/teste simples. Em producao, use o backend e variaveis `.env`.

## Arquitetura Real

O projeto usa duas camadas:

- `index.html`, `styles.css`, `app.js`: frontend estatico publicado no GitHub Pages.
- `backend/`: API Node.js/Express segura para Google, OpenAI, WhatsApp e CRM persistido no Supabase/PostgreSQL.

GitHub Pages nao executa backend e nao pode guardar segredos. Portanto, chaves Google/OpenAI/WhatsApp ficam somente no backend, via variaveis de ambiente.

## Funcionalidades Operacionais

- Busca de empresas via Google Places, com prevencao de duplicidade e filtro para ocultar empresas ja salvas no CRM.
- Dados retornados: nome, telefone, site, endereco, categoria, avaliacao, total de avaliacoes e link Google Maps.
- CRM persistido no Supabase/PostgreSQL.
- Pipeline profissional com drag and drop.
- Observacoes longas por lead, com tipo, responsavel, data e historico.
- Timeline operacional por lead com observacoes, status, tarefas, PageSpeed e IA.
- Agenda comercial com follow-up, canal, prioridade, conclusao e alertas.
- Inicio com leads quentes, atrasados, contatos do dia, sem follow-up e propostas.
- Relatorios de conversao, ganhos, perdas, propostas e valor potencial.
- Chat IA global com contexto da carteira.
- Painel IA dentro da ficha do lead com acoes comerciais: WhatsApp, email, follow-up, diagnostico, proposta, objecoes, script de ligacao e estrategia Google Ads.
- Scanner de site.
- Diagnostico comercial com OpenAI.
- Validacao de Google Places, Maps, PageSpeed, Business Profile OAuth, OpenAI, WhatsApp e Supabase.
- WhatsApp Cloud API preparado para envio real quando tokens estiverem configurados.

## Variaveis de Ambiente

Copie `.env.example` para `.env` na raiz ou configure essas variaveis no Render/Railway:

```env
PORT=3333
FRONTEND_ORIGIN=http://localhost:4173
PRODUCTION_FRONTEND_ORIGIN=https://edipocamposlima-alt.github.io
MVP_OWNER_TOKEN=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_DEFAULT_COUNTRY_CODE=55
```

Nunca coloque chaves no frontend, no GitHub Pages ou no codigo.

## Banco de Dados

Use Supabase ou outro PostgreSQL compativel e execute:

```sql
mvp-supabase-schema.sql
```

Tabelas principais:

- `mvp_leads`
- `mvp_site_scans`
- `mvp_diagnoses`
- `mvp_crm_events`
- `mvp_tasks`
- `mvp_searches`
- `mvp_notes`
- `mvp_ai_memory`
- `mvp_notifications`

## Rodar Localmente

Frontend:

```bash
npm run serve
```

ou no Windows:

```text
INICIAR_NODERE.bat
```

API:

```bash
cd backend
npm install
npm start
```

Abra:

```text
http://localhost:4173/#configuracoes
```

Para IA, configure em `Endpoint IA seguro`:

```text
http://localhost:3333/api/openai
```

## Deploy

Frontend:

- GitHub Pages publica automaticamente a branch `main`.
- URL: `https://edipocamposlima-alt.github.io/nodere-intelligence/`

Backend:

- Render/Railway.
- Root directory: `backend`.
- Build command: `npm install`.
- Start command: `npm start`.
- Configure todas as variaveis de ambiente no painel da plataforma.

Depois do deploy:

1. Abra `https://edipocamposlima-alt.github.io/nodere-intelligence/#configuracoes`.
2. Informe a URL publica do backend.
3. Informe as chaves Google que serao usadas no modo estatico.
4. Informe o endpoint publico da IA, se o backend estiver publicado.
5. Clique em `Salvar configuracoes`.
6. Valide em `Integracoes`.

## Testes de Integração

Rode sem expor chaves:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-google-apis.ps1
```

O script testa:

- Google Places
- Google Maps
- PageSpeed
- OpenAI
- Google Business Profile OAuth

## Status Conhecido

- Google Places, Maps e PageSpeed dependem das chaves habilitadas no Google Cloud.
- OpenAI exige chave valida e quota/billing ativo.
- Google Business Profile exige `client_secret` e `refresh_token` gerado por OAuth com escopo `business.manage`.
- A versao GitHub Pages usa `localStorage` para CRM e configuracoes. Para producao multiusuario, publique o backend e migre a persistencia para Supabase/PostgreSQL usando o schema atualizado.
