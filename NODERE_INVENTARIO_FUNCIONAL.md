# NODERE - Inventario Funcional

Data: 2026-07-17
Branch: `main`
Commit: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`
Estado da analise: inventario por codigo-fonte local. Funcionalidade ao vivo nao homologada nesta etapa.

## 1. Navegacao e rotas principais

Rotas publicas/auth confirmadas:
- `/`: middleware redireciona para `/login` sem sessao e para `/dashboard` com sessao.
- `/login`: tela de entrada.
- `/register`: cadastro.
- `/forgot-password`: recuperacao.
- `/reset-password`: redefinicao.
- `/terms` e `/termos`: termos.
- `/privacy` e `/privacidade`: privacidade.
- `/blog`, `/precos`, `/planos`, `/solucoes`, `/contato`, `/pagina/[slug]`: paginas publicas/CMS.
- `/manual`, `/ajuda`, `/help`: ajuda/manual.

Rotas privadas/operacionais confirmadas:
- `/dashboard`
- `/app/dashboard`
- `/companies`
- `/companies/[id]`
- `/empresas`
- `/crm`
- `/pipeline`
- `/app/crm/clientes/[id]`
- `/leads`
- `/app/leads`
- `/app/leads/[id]`
- `/searches`
- `/discovery`
- `/app/discovery`
- `/busca-de-empresas`
- `/catalog`
- `/app/proposals`
- `/calendar`
- `/calendario`
- `/inbox`
- `/automations`
- `/intelligence`
- `/ia`
- `/reports`
- `/relatorios`
- `/operators`
- `/marketing`
- `/billing`
- `/settings`
- `/configuracoes`
- `/integrations`
- `/integracoes`
- `/admin`
- `/admin/content`
- `/admin/blog`
- `/admin/integrations`
- `/admin/modules`
- `/admin/plans`
- `/admin/users`
- `/pagespeed`

Status geral das rotas: CONFIRMADO NO CODIGO. Homologacao visual e autenticada: NAO VALIDADO nesta etapa.

## 2. Login, autenticacao e sessao

Finalidade: entrada segura na plataforma, persistencia de sessao e protecao das rotas internas.

Localizacao:
- Frontend: `apps/web/app/login`, `apps/web/middleware.ts`, `apps/web/context/AuthProvider.tsx`, `apps/web/lib/supabaseAuthRest.ts`, `apps/web/lib/api.ts`.
- Backend: `apps/api/src/middleware/session.ts`, `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/admin.ts`.

Endpoints relacionados:
- `POST /api/admin/login`
- `GET /api/auth/me` no frontend/proxy
- `GET /api/auth/session` no frontend/proxy
- `POST /api/auth/forgot-password`

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: autenticacao real em producao nao foi testada nesta etapa; historico do projeto indica necessidade de atencao ao vinculo `auth_user_id` em `nodere_platform_users`.

## 3. Dashboard

Finalidade: painel executivo da operacao comercial.

Rotas:
- `/dashboard`
- `/app/dashboard`

Componentes relacionados:
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/app/dashboard/page.tsx`
- `apps/web/components/Header.tsx`
- `apps/web/components/Sidebar.tsx`
- `apps/web/components/MobileNav.tsx`

Endpoints:
- `GET /api/dashboard`
- relatorios e metricas auxiliares via `/api/reports/*`.

Funcionalidades confirmadas em codigo:
- cards de metricas;
- indicadores;
- onboarding "Configure o NODERE em 3 passos";
- links para prospeccao e CRM;
- shell privado com menu lateral/mobile.

Estado: CONFIRMADO NO CODIGO. Validacao visual atual em producao: NAO VALIDADO nesta etapa.

## 4. Busca de empresas e prospeccao

Finalidade: localizar empresas por segmento, cidade, estado, CNPJ, termos e enriquecer sinais comerciais.

Rotas:
- `/searches`
- `/discovery`
- `/app/discovery`
- `/busca-de-empresas`

Componentes:
- `apps/web/components/SearchPanel.tsx`
- `apps/web/components/CompanyTable.tsx`
- componentes em `apps/web/components/discovery`

Endpoints:
- `POST /api/searches`
- `GET /api/searches`
- `GET /api/searches/cnpj`
- `POST /api/discovery/search`
- `POST /api/discovery/scan-website`
- `POST /api/discovery/opportunities`
- `POST /api/discovery/scan-social`
- `POST /api/discovery/add-to-crm`
- `GET /api/places/search`
- `GET /api/pagespeed`

Integracoes:
- Google Places/Maps;
- PageSpeed;
- OpenAI/Anthropic para insights;
- ReceitaWS/Econodata/Apollo conforme configuracao.

Estado: PARCIALMENTE IMPLEMENTADO.
Riscos:
- `USE_MOCK_DATA=true` ativa modo demonstrativo.
- Alguns campos de resultado usam fallback/localStorage para experiencia local.
- Deduplicacao existe em codigo, mas precisa validacao real por banco.

## 5. Empresas, Leads e Ficha 360

Finalidade: lista de empresas/clientes, ficha completa, dados comerciais, observacoes, contatos, historico, agenda, negociacoes, IA, produtos, propostas e documentos.

Rotas:
- `/companies`
- `/companies/[id]`
- `/empresas`
- `/leads`
- `/app/leads`
- `/app/leads/[id]`
- `/app/crm/clientes/[id]`

Componentes:
- `apps/web/app/companies/[id]/LeadOperations.tsx`
- `apps/web/components/CompanyTable.tsx`
- componentes CRM e ficha em `apps/web/components/crm`

Endpoints:
- `GET /api/companies`
- `POST /api/companies`
- `GET /api/companies/:id`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`
- `POST /api/companies/save-from-search`
- `GET/POST/PATCH/DELETE /api/leads/*`
- `GET/POST/PATCH/DELETE /api/leads/:id/activities`
- `GET/POST/PATCH/DELETE /api/leads/:id/contacts`
- `GET/POST/PATCH/DELETE /api/leads/:id/deals`
- `GET /api/communications`
- `GET /api/contracts`
- `GET /api/files`

Estado: PARCIALMENTE IMPLEMENTADO.
Observacao: historico recente indica correcao da Ficha 360; nesta etapa nao foi testada em navegador autenticado.

## 6. CRM, Funil e Pipeline

Finalidade: gestao visual/lista de oportunidades por etapas, movimentacao, temperatura, score, historico e pipeline.

Rotas:
- `/crm`
- `/pipeline`
- `/app/crm/clientes/[id]`

Componentes:
- `apps/web/app/crm/CrmBoard.tsx`
- `apps/web/app/crm/CrmSwitcher.tsx`
- componentes relacionados em `apps/web/components/crm`

Endpoints:
- `/api/crm`
- `/api/leads/:id/stage`
- `/api/settings/pipeline`
- `/api/reports/pipeline`

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: preferencias de visualizacao/cores de etapa ainda usam localStorage em alguns pontos, embora haja salvamento backend de pipeline.

## 7. Catalogo de Produtos e Servicos

Finalidade: fonte comercial oficial de produtos/servicos usados em propostas e contratos.

Rota:
- `/catalog`

Endpoints:
- `GET /api/catalog`
- `POST /api/catalog`
- `PATCH /api/catalog/:id`
- `DELETE /api/catalog/:id`
- uploads via `multer` em memoria.

Banco:
- `catalog_items`
- SQL relacionado em `packages/database/block03_catalog_items.sql`
- complementos comerciais em `packages/database/block_produtos_servicos_composicao_comercial.sql`

Regras esperadas:
- owner/admin criam/editam/inativam;
- operator/viewer leitura;
- itens ativos alimentam propostas.

Estado: PARCIALMENTE IMPLEMENTADO. Validacao real de permissoes e RLS: NAO VALIDADO nesta etapa.

## 8. Propostas, contratos, snapshots, descontos e PDFs

Finalidade: montar proposta/contrato por itens ativos do catalogo, gravar snapshot comercial, calcular subtotal/desconto/total, auditar e gerar PDF.

Rotas:
- `/app/proposals`
- aba em `apps/web/app/companies/[id]/LeadOperations.tsx`

Endpoints:
- `GET /api/proposals`
- `POST /api/proposals`
- `DELETE /api/proposals/:id`
- `POST /api/proposals/:id/pdf`
- endpoints de templates/versions.

Banco:
- `proposal_templates`
- `proposal_versions`
- `nodere_proposals`
- `nodere_proposal_audit`
- campos/snapshots adicionados por `block_produtos_servicos_composicao_comercial.sql`

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: conclusao exige validacao real de SQL aplicado e PDF autenticado; nao realizada nesta etapa.

## 9. Agenda e Calendario

Finalidade: eventos comerciais, follow-ups, reunioes e tarefas vinculadas a empresas/leads.

Rotas:
- `/calendar`
- `/calendario`

Endpoints:
- `GET /api/calendar`
- `POST /api/calendar`
- `PATCH /api/calendar/:id`
- `DELETE /api/calendar/:id`

Banco:
- `calendar_events`
- `packages/database/block08_commercial_calendar.sql`

Estado: CONFIRMADO NO CODIGO. Funcionalidade real: NAO VALIDADO nesta etapa.

## 10. Caixa de entrada, WhatsApp, email e automacoes

Finalidade: comunicacao comercial, mensagens, templates, sequencias e webhooks.

Rotas:
- `/inbox`
- `/automations`

Endpoints:
- `/api/inbox`
- `/api/inbox/templates`
- `/api/inbox/unread-count`
- `/api/sequences`
- `/api/webhooks`
- `GET/POST /api/whatsapp/webhook`

Banco:
- `inbox_messages`
- `message_templates`
- `communications`
- `cadence_templates`
- `cadence_enrollments`

Estado: PARCIALMENTE IMPLEMENTADO.
Integracao WhatsApp real: NAO VALIDADO nesta etapa.

## 11. IA e inteligencia comercial

Finalidade: diagnosticos, mensagens comerciais, scripts, proximo passo, insights e analises.

Rotas:
- `/intelligence`
- `/ia`

Endpoints:
- `GET /api/openai/health`
- `POST /api/openai/analyze`
- `/api/ai/*`
- `/api/intelligence/*`
- `/api/health/providers`

Integracoes:
- OpenAI;
- Anthropic como provider alternativo;
- fallback controlado em `commercialInsights`.

Estado: PARCIALMENTE IMPLEMENTADO. Provider real: NAO VALIDADO nesta etapa.

## 12. Relatorios, CSV e PDF

Finalidade: dashboards analiticos, funil, previsao, tendencias, export CSV/PDF.

Rotas:
- `/reports`
- `/relatorios`

Endpoints:
- `/api/reports/pipeline`
- `/api/reports/forecast`
- `/api/reports/trends`
- `/api/reports/summary`
- `/api/reports/funnel`
- `/api/reports/timeline`
- `/api/reports/segments`
- `/api/reports/cities`
- `/api/reports/origin`
- `/api/reports/intelligence`
- `/api/reports/proposals`
- `/api/reports/operators`
- `/api/reports/dashboard`
- `/api/reports/pdf`
- `/api/reports/export.csv`

Estado: PARCIALMENTE IMPLEMENTADO. Geracao real de PDF/CSV autenticada: NAO VALIDADO nesta etapa.

## 13. Marketing, CMS e paginas publicas

Finalidade: templates, campanhas, canais sociais, conteudo publico, blog, paginas institucionais.

Rotas:
- `/marketing`
- `/admin/content`
- `/admin/blog`
- `/blog`
- `/pagina/[slug]`
- `/precos`
- `/solucoes`
- `/contato`

Endpoints:
- `/api/marketing`
- `/api/campaigns`
- `/api/social`
- `/api/content`
- `/api/admin`

Banco:
- `nodere_cms_pages`
- `nodere_cms_sections`
- `nodere_cms_navigation`
- `nodere_cms_assets`
- `campaigns`
- `social_connections`

Estado: PARCIALMENTE IMPLEMENTADO. Publico raiz ocultado por middleware; paginas publicas especificas continuam permitidas.

## 14. Operadores, usuarios, roles e admin

Finalidade: usuarios, operadores, permissoes, planos, modulos, verticals e administracao.

Rotas:
- `/operators`
- `/admin`
- `/admin/users`
- `/admin/plans`
- `/admin/modules`
- `/admin/integrations`
- `/admin/content`
- `/settings`
- `/app/settings`

Endpoints:
- `/api/operators`
- `/api/admin`
- `/api/admin/verticals`
- `/api/settings`
- `/api/workspace`

Banco:
- `nodere_platform_users`
- `nodere_operators`
- `nodere_operator_goals`
- `custom_roles`
- `nodere_app_settings`
- `workspaces`
- `workspace_members`

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: confirmar no banco vivo o campo `auth_user_id` e roles reais.

## 15. Billing/Faturamento

Finalidade: planos, checkout, portal, waitlist, webhooks Stripe.

Rota:
- `/billing`

Endpoints:
- `/api/billing`
- `/api/billing/webhook`
- `/api/billing/plans`
- `/api/billing/checkout`
- `/api/billing/portal`
- `/api/billing/waitlist`
- `/api/billing/usage`

Integracao:
- Stripe.

Estado: PARCIALMENTE IMPLEMENTADO. Stripe real: NAO VALIDADO nesta etapa.

## 16. PWA, mobile e assets

Finalidade: instalacao como app, manifest, icones, service worker e navegacao mobile.

Localizacao:
- `apps/web/public`
- `apps/web/components/PwaRegister.tsx`
- `apps/web/components/MobileNav.tsx`
- scripts de geracao de icones em `scripts` e `apps/web/scripts`.

Estado: CONFIRMADO NO CODIGO. Validacao em dispositivo real: NAO VALIDADO nesta etapa.
