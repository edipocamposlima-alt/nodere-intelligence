# NODERE - Banco de Dados e Integracoes

Data: 2026-07-17
Branch: `main`
Commit: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`

## 1. Banco oficial previsto

Banco oficial previsto pelo codigo e configuracoes: Supabase/Postgres.

Evidencias:
- Variaveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` em `apps/api/src/config.ts`.
- `DATABASE_URL` em `apps/api/src/config.ts` e `apps/api/src/db/pool.ts`.
- Cliente Supabase backend em `apps/api/src/db/supabase.ts`.
- Cliente Supabase frontend/auth em `apps/web`.
- SQL em `packages/database` e `apps/api/src/db/schema.sql`.

Supabase URL conhecida nos arquivos/ambiente local historico: `https://qhopjggnbzewuuktqntp.supabase.co`.

Estado do banco vivo: NAO VALIDADO nesta etapa.

## 2. Arquivos SQL/migrations confirmados

`packages/database`:
- `schema.sql`
- `block02_interface_settings.sql`
- `block03_catalog_items.sql`
- `block03_crm_inteligente_existing_schema.sql`
- `block04_billing.sql`
- `block04_discovery_score_ia_existing_schema.sql`
- `block05_06_discovery_crm_existing_schema.sql`
- `block05_propostas_billing_admin_existing_schema.sql`
- `block08_commercial_calendar.sql`
- `block_admin_cms.sql`
- `block_produtos_servicos_composicao_comercial.sql`
- `block_publicacao_campos_comerciais.sql`

Outros schemas:
- `apps/api/src/db/schema.sql`
- `apps/api/src/db/rls_policies.sql`
- `database-schema.sql`
- `ENTERPRISE_DATABASE_SCHEMA.sql`
- `mvp-supabase-schema.sql`

Risco: ha varios schemas historicos; antes de aplicar SQL, comparar com Supabase real e scripts de validacao.

## 3. Entidades/tabelas localizadas por codigo/schema

Principais tabelas confirmadas em SQL/codigo:
- `nodere_workspaces`
- `nodere_platform_users`
- `custom_roles`
- `nodere_companies`
- `nodere_company_notes`
- `nodere_searches`
- `nodere_operators`
- `nodere_operator_goals`
- `nodere_app_settings`
- `onboarding_steps`
- `user_metrics`
- `workspaces`
- `workspace_members`
- `billing_waitlist`
- `push_subscriptions`
- `proposal_templates`
- `proposal_versions`
- `schedules`
- `inbox_messages`
- `cadence_templates`
- `cadence_enrollments`
- `api_keys`
- `vertical_prompts`
- `company_contacts`
- `calendar_events`
- `catalog_items`
- `company_contracts`
- `communications`
- `message_templates`
- `social_connections`
- `campaigns`
- `activity_logs`
- `download_logs`
- `company_files`
- `nodere_cms_pages`
- `nodere_cms_sections`
- `nodere_cms_navigation`
- `nodere_cms_assets`
- `nodere_proposals`
- `nodere_proposal_audit`

Estado: CONFIRMADO NO CODIGO/SQL. Existencia no banco vivo: NAO VALIDADO.

## 4. Migrations comerciais relevantes

`block_produtos_servicos_composicao_comercial.sql`:
- amplia `catalog_items` com campos comerciais;
- amplia `nodere_proposals` com snapshot/itens/descontos;
- cria/ajusta auditoria de proposta;
- bloqueia desconto percentual e valor simultaneos;
- exige motivo quando houver desconto;
- preserva snapshot para PDF/proposta.

Estado local: CONFIRMADO.
Aplicacao no Supabase vivo: NAO VALIDADO nesta etapa. Historico do projeto indica aplicacao anterior, mas esta auditoria nao executou SQL nem introspeccao.

## 5. RLS, policies e seguranca de dados

Localizado:
- `apps/api/src/db/rls_policies.sql`
- policies em blocos SQL, especialmente CMS e comerciais.
- Supabase skill recomenda manter service role somente no backend e validar RLS para anon/authenticated.

Estado: PARCIALMENTE IMPLEMENTADO.
Pendente: executar validacao real de RLS/policies no Supabase antes de novas mudancas em banco.

## 6. Variaveis de ambiente por grupo

Observacao: apenas nomes foram inspecionados; valores nao foram lidos nem registrados.

Frontend Vercel:
- `NEXT_PUBLIC_API_URL`: URL da API backend.
- `NEXT_PUBLIC_API_KEY`: compatibilidade com endpoints legados por API key publica.
- `NEXT_PUBLIC_SUPABASE_URL`: URL Supabase para auth no cliente.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key Supabase.
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`: mapas no cliente quando usado.

Backend Render/API:
- `NODE_ENV`
- `PORT` / `API_PORT`
- `WEB_ORIGIN`
- `FRONTEND_URL`
- `API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `DATABASE_URL`
- `USE_MOCK_DATA`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

IA:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `AI_PROVIDER_PRIMARY`

Google:
- `GOOGLE_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_PLACES_KEY`
- `GOOGLE_PAGESPEED_API_KEY`
- `GOOGLE_PAGESPEED_KEY`
- `GOOGLE_BUSINESS_PROFILE_CLIENT_ID`
- `GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET`
- `GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN`
- `GOOGLE_CUSTOM_SEARCH_KEY`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`

WhatsApp:
- `WHATSAPP_CLOUD_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_DEFAULT_COUNTRY_CODE`
- `WHATSAPP_WEBHOOK_SECRET`
- `WHATSAPP_VERIFY_TOKEN`

Email/SMTP:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_PASSWORD`
- `SMTP_FROM`

Stripe:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_URL`
- `STRIPE_PRO_URL`
- `STRIPE_AGENCY_URL`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`

Push/PWA:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`

Enriquecimento/CRM:
- `ECONODATA_API_KEY`
- `ECONODATA_API_URL`
- `APOLLO_API_KEY`
- `APOLLO_API_URL`
- `RECEITAWS_ENABLED`

Social/Marketing:
- `SOCIAL_TOKEN_ENCRYPTION_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `PINTEREST_APP_ID`
- `PINTEREST_APP_SECRET`
- `X_API_KEY`
- `X_API_SECRET`
- `RDSTATION_CLIENT_ID`
- `RDSTATION_CLIENT_SECRET`

Estado real de configuracao nos paineis: BLOQUEADO POR ACESSO nesta etapa.

## 7. Integracoes mapeadas

Supabase:
- Finalidade: banco, auth, storage/relacionamentos.
- Consumidores: `apps/api`, `apps/web`.
- Status: CONFIGURADA NO CODIGO, NAO VALIDADA AO VIVO.

Vercel:
- Finalidade: frontend Next.js.
- Evidencia: `vercel.json` bloqueia raiz; root correto `apps/web`.
- Status: CONFIGURADA NO REPOSITORIO, PAINEL NAO VALIDADO.

Render:
- Finalidade: API Express.
- Evidencia: `render.yaml` com `nodere-api` rootDir `apps/api`.
- Status: CONFIGURADA NO REPOSITORIO, PAINEL NAO VALIDADO.

OpenAI/Anthropic:
- Finalidade: analises e textos de IA.
- Rotas: `/api/openai/*`, `/api/ai/*`, `/api/intelligence/*`.
- Status: CONFIGURADA NO CODIGO, NAO VALIDADA AO VIVO.

Google Maps/Places/PageSpeed:
- Finalidade: busca, prospeccao, maps, auditoria digital.
- Rotas: `/api/searches`, `/api/discovery`, `/api/pagespeed`, `/api/places/search`, `/api/geocode`.
- Status: CONFIGURADA NO CODIGO, NAO VALIDADA AO VIVO.

Google Business Profile / Google Ads:
- Finalidade: sinais comerciais/anuncios/perfil.
- Status: VARIAVEIS E CONFIGURACAO LOCALIZADAS, NAO VALIDADO.

WhatsApp Cloud:
- Finalidade: inbox, mensagens, templates, webhook.
- Rotas: `/api/whatsapp/webhook`, `/api/inbox`.
- Status: CONFIGURADA NO CODIGO, NAO VALIDADA AO VIVO.

SMTP/Email:
- Finalidade: envio/teste SMTP e sequencias.
- Rotas: `/api/settings/test-smtp`, servicos de email/sequences.
- Status: CONFIGURADA NO CODIGO, NAO VALIDADA AO VIVO.

Stripe:
- Finalidade: billing, checkout, portal, webhooks.
- Rotas: `/api/billing/*`, `/api/billing/webhook`.
- Status: CONFIGURADA NO CODIGO, NAO VALIDADA AO VIVO.

Push:
- Finalidade: notificacoes/PWA.
- Rotas: `/api/push`, `/api/notifications`.
- Status: CONFIGURADA NO CODIGO, NAO VALIDADA AO VIVO.

Apollo/Econodata/ReceitaWS:
- Finalidade: enriquecimento de empresas/pessoas/CNPJ.
- Status: VARIAVEIS/ROTAS LOCALIZADAS, NAO VALIDADO.

Social/Marketing:
- Finalidade: campanhas e conexoes sociais.
- Rotas: `/api/marketing`, `/api/social`.
- Status: PARCIALMENTE IMPLEMENTADO, NAO VALIDADO.

PDF:
- Finalidade: proposta, contrato, relatorio, ficha/exports.
- Biblioteca backend: `pdfkit`.
- Biblioteca frontend auxiliar: `jspdf`, `html2canvas`.
- Status: IMPLEMENTADO NO CODIGO, PDF REAL NAO VALIDADO NESTA ETAPA.

## 8. Testes e scripts relacionados a banco/integracoes

Scripts conhecidos:
- `scripts/validate-commercial-schema.mjs`
- `scripts/homologate-commercial-flow.mjs`
- `scripts/apply-commercial-migration.mjs`
- `scripts/import-platform-users-to-auth.mjs`
- scripts de PDF/CDP/visual em `.codex_tmp` e `scripts`.

Diretriz:
- executar apenas com credenciais em memoria;
- nunca persistir secrets;
- nunca aplicar SQL em producao sem autorizacao explicita;
- gerar backup logico antes de migrations.
