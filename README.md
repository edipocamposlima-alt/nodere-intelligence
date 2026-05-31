# NODERE Intelligence

Sistema de prospeccao comercial para localizar empresas no Google, salvar leads em CRM, auditar presenca digital e gerar diagnosticos comerciais com OpenAI.

## Versao SaaS segura

A versao publicada no GitHub Pages funciona como interface estatica. Para uso comercial real, publique o backend e configure a URL da API em `Configuracoes`.

- CRM operacional persiste em `localStorage` no GitHub Pages e tem estrutura preparada para Supabase/PostgreSQL.
- Configuracoes persistem em `localStorage`, mas guardam apenas URL do backend, token operacional opcional e preferencias.
- Busca Google Places usa somente o backend seguro.
- PageSpeed usa somente o backend seguro.
- WhatsApp abre `wa.me` com mensagem pronta.
- IA chama `/api/openai` no backend Node/Express para nao expor `OPENAI_API_KEY`.
- Sem endpoint IA, o sistema usa fallback operacional local identificado para manter agenda, priorizacao e proximos passos funcionando.

Aviso: nenhuma chave Google, OpenAI ou WhatsApp deve ser salva no navegador. Em producao, use somente o backend e variaveis `.env`.

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
- Chat IA flutuante com modo compacto, expandido e tela cheia.
- Painel IA dentro da ficha do lead com acoes comerciais: WhatsApp, email, follow-up, diagnostico, proposta, objecoes, script de ligacao e estrategia Google Ads.
- PageSpeed pelo backend com performance, SEO, acessibilidade, boas praticas, diagnostico e recomendacoes.
- Modulos iniciais de Servicos, Contratos e Templates para operacao comercial.
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
REQUIRE_OWNER_TOKEN=false

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=
GOOGLE_WORKSPACE_CLIENT_ID=
GOOGLE_WORKSPACE_CLIENT_SECRET=
GOOGLE_WORKSPACE_REFRESH_TOKEN=
GOOGLE_WORKSPACE_SCOPES=https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/drive.file

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_DEFAULT_COUNTRY_CODE=55
```

Nunca coloque chaves no frontend, no GitHub Pages, na Vercel ou no codigo. Se quiser exigir token operacional nas chamadas do frontend, defina `REQUIRE_OWNER_TOKEN=true` no backend e informe o token manualmente em `Configuracoes`.

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

Na tela `Configuracoes`, configure a URL da API:

```text
http://localhost:3333
```

## Deploy

Frontend:

- GitHub Pages pode publicar a branch `gh-pages`.
- Vercel deve usar o projeto raiz, framework preset `Other`, build command `npm run build` e output directory `dist`.
- O frontend usa por padrao o backend `https://nodere-api.onrender.com` e tambem permite trocar a URL em `Configuracoes`.
- Configure `VITE_API_BASE_URL=https://nodere-api.onrender.com` na Vercel apenas como referencia operacional; segredos Google/OpenAI ficam somente no Render.
- URLs: `https://edipocamposlima-alt.github.io/nodere-intelligence/` ou a URL publicada pela Vercel.
- Guia completo: `DEPLOY.md`

Backend:

- Render/Railway.
- Render Blueprint disponivel em `render.yaml` na raiz.
- Root directory: `backend`.
- Build command: `npm install`.
- Start command: `npm start`.
- Configure todas as variaveis de ambiente no painel da plataforma.

Depois do deploy:

1. Abra a URL publicada (`GitHub Pages` ou `Vercel`) em `#configuracoes`.
2. Informe a URL publica do backend.
3. Informe o token operacional, se `MVP_OWNER_TOKEN` estiver ativo no backend.
4. Clique em `Salvar configuracoes`.
5. Valide em `Integracoes`.

## Seguranca do Repositorio

Este projeto nao deve permanecer publico quando houver operacao comercial, clientes ou segredos nos ambientes de deploy.

Chaves ja compartilhadas em conversa, prints, arquivos temporarios ou repositorio devem ser revogadas e regeradas no painel do provedor antes de qualquer uso real.

No GitHub:

1. Abra `Settings > General > Danger Zone`.
2. Use `Change repository visibility`.
3. Marque `Private`.
4. Revise `Settings > Collaborators`, `Actions secrets`, `Deploy keys` e tokens.

O Codex nao deve versionar `.env`, tokens, dumps de banco ou arquivos com credenciais.

Guias detalhados:

- `docs/PRIVATE_REPO.md`
- `docs/DEPLOY_BACKEND.md`
- `docs/ENV_SETUP.md`

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
- Google Calendar, Gmail e Drive exigem OAuth offline com refresh token do backend.
- A versao GitHub Pages usa `localStorage` para CRM e configuracoes. Para producao multiusuario, publique o backend e migre a persistencia para Supabase/PostgreSQL usando o schema atualizado.
