# NODERE

NODERE e uma plataforma comercial com prospeccao, CRM, funil, catalogo de produtos/servicos, propostas, contratos, relatorios, IA, agenda, inbox, marketing, billing e integracoes.

Este README descreve a arquitetura oficial atual. O codigo legado ainda existe na raiz por historico/compatibilidade, mas nao e a fonte oficial do produto publicado.

## Fonte Oficial

- Frontend oficial: `apps/web`
- Backend oficial: `apps/api`
- Banco oficial: Supabase PostgreSQL
- Branch oficial: `main`
- Backend Render oficial: `nodere-api`
- URL da API: `https://nodere-api.onrender.com`
- Projeto Vercel oficial: `web`
- Root Directory obrigatorio na Vercel: `apps/web`
- Dominios oficiais: `https://nodere.com.br` e `https://www.nodere.com.br`

Consulte tambem `FONTE_OFICIAL_DO_PROJETO.txt`.

## Estrutura

```text
apps/
  web/      Next.js 15 + React 19 + TypeScript
  api/      Express + TypeScript + Supabase/PostgreSQL
packages/
  database/ migrations e SQLs de apoio
scripts/   validacoes, homologacoes e utilitarios
docs/      documentacao operacional e historica
```

Itens legados mantidos na raiz:

- `app.js`
- `index.html`
- `styles.css`
- `dist/`
- `backend/`
- `serve-nodere.mjs`

Esses itens nao devem ser usados para deploy de producao.

## Deploy

### Frontend

Use Vercel no projeto `web` com:

- Root Directory: `apps/web`
- Framework: Next.js
- Build command: `npm run build`
- Output: padrao do Next.js

Variaveis publicas esperadas:

```env
NEXT_PUBLIC_API_URL=https://nodere-api.onrender.com/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_KEY=
```

O `vercel.json` da raiz bloqueia builds pela raiz para evitar publicacao acidental da versao legada em `dist/index.html`.

### Backend

Use Render no servico oficial:

- Service: `nodere-api`
- Root Directory: `apps/api`
- Build command: `npm install --include=dev`
- Start command: `npm start`
- Health check: `/health`

Variaveis privadas esperadas no Render:

```env
NODE_ENV=production
WEB_ORIGIN=https://nodere.com.br
CORS_ORIGINS=https://nodere.com.br,https://www.nodere.com.br
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
API_KEY=
OPENAI_API_KEY=
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Quando o ambiente nao suportar conexao IPv6 direta ao Supabase, use a `DATABASE_URL` do Supabase Transaction Pooler IPv4.

## Rodar Localmente

Frontend:

```bash
cd apps/web
npm install
npm run dev
```

API:

```bash
cd apps/api
npm install
npm run dev
```

Raiz:

```bash
npm run build
```

Observacao: o script da raiz ainda valida o legado por compatibilidade. Para o produto atual, priorize os comandos em `apps/web` e `apps/api`.

## Validacao Recomendada

Backend:

```bash
cd apps/api
npm run typecheck
npm run build
npm run test:phase1
npm run test:calendar
npm run test:reports
npm run test:crm
npm run test:whatsapp
npm run test:ai-discovery
```

Frontend:

```bash
cd apps/web
npm run lint
npm run typecheck
npm run build
```

Schema comercial:

```bash
node scripts/validate-commercial-schema.mjs
```

## Regras de Seguranca

- Nunca versionar `.env`, `.env.local`, secrets, dumps de banco ou tokens.
- Chaves Google, OpenAI, WhatsApp, Stripe e Supabase service role ficam somente no backend/ambiente seguro.
- O frontend recebe apenas variaveis `NEXT_PUBLIC_*` inevitavelmente publicas.
- GitHub Pages nao e canal oficial de producao.
- Nao publicar pela raiz do repositorio.
- Nao remover codigo legado sem autorizacao explicita.

## Funcionalidades Principais

- Autenticacao e sessao com Supabase/Auth e compatibilidade operacional existente.
- Dashboard comercial com metricas reais, funil, score, onboarding e atalhos.
- Discovery/Busca de empresas com Google Places, deduplicacao, CSV e PDF.
- CRM Kanban/lista, ficha 360, historico, agenda, contatos e negociacoes.
- Catalogo de produtos/servicos com permissoes por perfil.
- Propostas e contratos com itens do catalogo, snapshot, descontos, auditoria e PDF.
- Relatorios executivos com exportacoes.
- IA comercial e diagnosticos via backend.
- WhatsApp/inbox, automacoes, marketing, billing, operadores e admin/CMS.
- Tema claro/escuro, PWA, mobile e manual integrado.

## Documentacao

- Manual do usuario: `docs/manual-nodere.md`
- Rota da plataforma: `/manual`
- Regra permanente: toda alteracao relevante deve atualizar Ajuda / Manual NODERE e `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`.

## Pendencias de Governanca

- Confirmar no painel Render se `nodere-ts-api` ainda e usado ou se pode ser desativado.
- Consolidar relatorios historicos em `docs/reports` e `docs/archive`.
- Criar suite E2E automatizada cobrindo login, dashboard, CRM, catalogo, proposta, PDF e logout.
- Homologar periodicamente todas as integracoes externas com credenciais reais.
