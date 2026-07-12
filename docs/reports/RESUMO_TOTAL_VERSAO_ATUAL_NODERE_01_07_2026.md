# RESUMO TOTAL DA VERSAO ATUAL DO NODERE - 01/07/2026

Este documento registra exclusivamente o estado atual do projeto NODERE em 01/07/2026, com base em codigo, arquivos locais, comandos de validacao e endpoints/deploys consultados nesta data. Versoes antigas, branches antigas e relatorios historicos foram usados apenas como evidencia de contexto quando comparados ao estado atual; nao sao fonte oficial para continuidade.

## 1. Status geral da investigacao

- Status: concluido.
- Escopo: leitura, mapeamento, validacao e documentacao.
- Alteracao realizada: criacao deste arquivo de resumo.
- Codigo, banco, deploy, branch, commit e configuracoes: nao alterados durante esta auditoria.
- Evidencias: `git status`, `git log`, `rg --files`, `package.json`, `render.yaml`, `apps/web/vercel.json`, health checks publicos, builds e testes locais.

## 2. Data-base da versao analisada

- Data-base: 01/07/2026.
- Timezone operacional: America/Sao_Paulo.
- Evidencia: contexto de execucao e solicitacao do usuario.

## 3. Branch ativa

- Branch ativa: `main`.
- Evidencia: `git branch --show-current`.

## 4. Ultimo commit

- HEAD atual: `31b1d56690c90f1cfe3d851c9ef2b20cf39c8391`.
- Commit curto: `31b1d56 docs: registrar publicacao final NODERE`.
- Commit tecnico imediatamente anterior: `cfd65fb fix: finalizar homologacao comercial e limpar diagnosticos`.
- Evidencia: `git rev-parse HEAD` e `git log --oneline --decorate -30`.

## 5. Status Git

- Estado antes da criacao deste relatorio: limpo em `main`.
- Saida observada: `## main`.
- Evidencia: `git status --short --branch`.

## 6. Arquivos modificados

- Antes deste relatorio: nenhum.
- Depois deste relatorio: somente `RESUMO_TOTAL_VERSAO_ATUAL_NODERE_01_07_2026.md`.
- Evidencia: `git diff --stat`, `git diff --name-only`, `git status`.

## 7. Arquivos nao rastreados

- Antes deste relatorio: nenhum exibido por `git status`.
- Diretorios/artefatos presentes mas ignorados: `dist/`, `nodere-site-premium/`, `apps/web/.next`, `apps/api/dist`.
- `.codex_tmp` existe, mas estava vazio no momento da auditoria.
- Evidencia: `git status --short --branch`, `git check-ignore -v`, `Get-ChildItem -Force .codex_tmp`.

## 8. Arquitetura atual

- Monorepo hibrido com legado preservado na raiz e aplicacao nova em `apps/web` + `apps/api`.
- Frontend atual publicado: Next.js 15 em `apps/web`.
- Backend atual publicado: Express/TypeScript em `apps/api`.
- Banco oficial operacional: Supabase `qhopjggnbzewuuktqntp.supabase.co`, com Render usando Transaction Pooler IPv4.
- Legado preservado: `app.js`, `serve-nodere.mjs`, `backend/src/server.js`, `docs/app.js`, `dist/`.
- Evidencias: `package.json`, `apps/web/package.json`, `apps/api/package.json`, `render.yaml`, `apps/web/vercel.json`, health checks.

## 9. Estrutura de pastas

- `.github/`: workflows/configuracoes GitHub.
- `apps/web/`: frontend Next.js atual.
- `apps/api/`: API Express/TypeScript atual.
- `backend/`: backend legado usado pelo build raiz.
- `packages/database/`: SQLs de schema e migracoes.
- `scripts/`: scripts de aplicacao/validacao/homologacao.
- `docs/`: documentacao e artefatos historicos.
- `dist/`: build estatico legado, ignorado.
- `nodere-site-premium/`: pasta paralela ignorada, nao usar como base atual.
- Evidencia: `Get-ChildItem -Directory`, `rg --files`.

## 10. Rotas publicas

Rotas publicas confirmadas no build Next:

- `/`
- `/login`
- `/register`
- `/reset-password`
- `/forgot-password`
- `/planos`
- `/precos`
- `/plans`
- `/solucoes`
- `/blog`
- `/contato`
- `/terms`
- `/privacy`
- `/termos`
- `/privacidade`
- `/pagina/[slug]`
- `/manual`
- `/ajuda` e `/help` redirecionam para `/manual`.
- `/app/login` redireciona para `/login`.
- `/app/register` redireciona para `/register`.

Evidencias: `apps/web/middleware.ts`, `apps/web/app/page.tsx`, `apps/web/app/*/page.tsx`, saida de `npm run build` em `apps/web`.

## 11. Rotas autenticadas

Rotas autenticadas principais confirmadas:

- `/dashboard`
- `/searches`
- `/companies`
- `/companies/[id]`
- `/crm`
- `/inbox`
- `/calendario` e `/calendar`
- `/automations`
- `/operators`
- `/reports`
- `/marketing`
- `/catalog`
- `/billing`
- `/integrations`
- `/settings`
- `/intelligence`
- `/admin`
- `/app/dashboard`
- `/app/discovery`
- `/app/leads`
- `/app/leads/[id]`
- `/app/proposals`
- `/app/settings`
- `/app/crm/clientes/[id]`

Sem sessao, o middleware redireciona para `/login?next=...`.

Evidencias: `apps/web/middleware.ts`, `apps/web/app/*`, build Next.

## 12. Rotas administrativas

- Frontend: `/admin`, `/admin/content`, `/admin/blog`, `/admin/users`, `/admin/plans`, `/admin/modules`, `/admin/integrations`.
- API admin: `/api/admin/login`, `/api/admin/supabase-session`, `/api/admin/session`, `/api/admin/status`, `/api/admin/users`, `/api/admin/roles`, `/api/admin/audit`, `/api/admin/api-keys`, `/api/admin/cleanup-demo-data`.
- CMS admin: `/api/content/admin/pages`, `/api/content/admin/sections`, `/api/content/admin/navigation`, `/api/content/admin/assets`, `/api/content/admin/plans`.
- Evidencias: `apps/web/app/admin/*`, `apps/api/src/routes/admin.ts`, `apps/api/src/routes/content.ts`.

## 13. Endpoints da API

Endpoints publicos/health:

- `GET /health`
- `GET /api/health`
- `GET /api/health/providers`
- `GET /api/health/supabase`
- `POST /api/auth/forgot-password`
- `GET /api/openai/health`
- Webhooks: `/api/whatsapp/webhook`, `/api/webhooks/whatsapp`, `/api/billing/webhook`
- Docs: `/docs`
- API publica com chave: `/v1`

Routers montados:

- `/api/admin`
- `/api/content`
- `/api/onboarding`
- `/api/workspace`
- `/api/legal`
- `/api/contact`
- `/api/geocode`
- `/api/searches` e `/api/search`
- `/api/settings`
- `/api/companies`
- `/api/crm`
- `/api/leads`
- `/api/discovery`
- `/api/ai`
- `/api/intelligence`
- `/api/dashboard`
- `/api/reports`
- `/api/audit`
- `/api/calendar`
- `/api/catalog`
- `/api/marketing`, `/api/campaigns`, `/api/social`
- `/api/integrations`
- `/api/inbox`
- `/api/sequences`
- `/api/operators`
- `/api/credits`
- `/api/backup`
- `/api/billing`
- `/api/proposals`
- `/api/push`, `/api/notifications`
- `/api/developer`
- `/api/admin/verticals`
- `/api/enrichment`

Evidencia: `apps/api/src/server.ts` e `apps/api/src/routes/*`.

## 14. Funcionalidades atuais

- Home publica institucional/comercial.
- Login, cadastro, reset e recuperacao.
- Dashboard executivo.
- Busca de empresas/Discovery.
- Empresas/leads e ficha do cliente.
- CRM/funil.
- Ficha CRM completa em `/app/crm/clientes/[id]`.
- Contatos, atividades, tarefas, comunicacoes, negociacoes.
- Catalogo de produtos/servicos.
- Propostas, contratos, snapshot, descontos, auditoria e PDF.
- Relatorios, CSV e PDF.
- IA comercial e diagnosticos.
- WhatsApp/inbox e historico.
- Agenda/calendario.
- Operadores, metas e ranking.
- Billing/planos/creditos.
- Integracoes.
- CMS administrativo.
- Configuracoes, tema claro/escuro, PWA.
- Marketing/campanhas/templates.
- Evidencias: `apps/web/app`, `apps/web/lib/api.ts`, `apps/api/src/routes`.

## 15. Funcionalidades preservadas

- Fluxo comercial homologado: catalogo -> proposta -> snapshot -> desconto -> auditoria -> PDF.
- Autenticacao por sessao propria e Supabase JWT.
- Perfis owner/admin/operator/viewer.
- Compatibilidade de API key publica para fluxos legados quando nao ha token de sessao.
- Build raiz legado preservado.
- Evidencias: `apps/web/lib/api.ts`, `apps/api/src/middleware/session.ts`, `apps/api/src/routes/proposals.ts`, `apps/api/src/routes/catalog.ts`, `HOMOLOGACAO_FINAL_PUBLICACAO_NODERE.md`.

## 16. Funcionalidades parciais

- Integracoes externas dependem de variaveis e credenciais reais: Google, OpenAI, WhatsApp Cloud, Stripe, SMTP, redes sociais, Apollo/Econodata.
- Marketing/social possui endpoints e status, mas conexoes OAuth dependem de chaves.
- PWA esta configurado, mas instalacao real em dispositivo nao foi revalidada nesta auditoria.
- Rotas novas em `/app/*` coexistem com rotas antigas autenticadas sem prefixo.
- Evidencias: `apps/api/src/config.ts`, `apps/api/src/routes/integrations.ts`, `apps/api/src/routes/marketing.ts`, `apps/web/public/manifest.webmanifest`, `apps/web/public/sw.js`.

## 17. Funcionalidades pendentes

- Nao confirmado nesta auditoria: smoke manual completo com usuario real para todas as telas depois da criacao deste relatorio.
- Nao confirmado nesta auditoria: funcionamento real de cada provedor externo pago.
- Nao confirmado nesta auditoria: instalacao PWA em mobile real.
- Pontos de risco: links de modulo privado em `apps/web/components/layout/Sidebar.tsx` apontam para rotas `/app/pipeline`, `/app/agenda`, `/app/whatsapp`, `/app/email`, `/app/inbox`, `/app/ai`, `/app/analytics`, `/app/reports`, `/app/projects` que nao apareceram no build como paginas existentes.
- Evidencias: build Next, `apps/web/components/layout/Sidebar.tsx`.

## 18. Integracoes atuais

- Supabase: Auth, REST, Storage e Postgres/Pooler.
- Google: Places, Maps, PageSpeed, Business Profile, Ads, Custom Search.
- OpenAI: analise/diagnostico/insights.
- Anthropic: configuracao prevista.
- WhatsApp Cloud: inbox/webhooks/envios.
- Stripe: checkout, portal, webhook, assinaturas.
- SMTP/Nodemailer: envio de e-mail.
- Apollo/Econodata: enriquecimento.
- Bling/RD Station/redes sociais: conectores/status.
- Web Push/PWA: VAPID e service worker.
- Evidencias: `apps/api/src/config.ts`, `apps/api/src/routes/*`, `apps/api/src/services/*`.

## 19. Banco de dados atual

- Banco oficial atual: Supabase `qhopjggnbzewuuktqntp.supabase.co`.
- Render usa `DATABASE_URL` via Supabase Transaction Pooler IPv4.
- Validacao atual de schema comercial aprovada em modo Supabase REST.
- Observacao: o script local mostrou `database_url=present host=localhost`, mas usou Supabase REST por `supabase_url=present host=qhopjggnbzewuuktqntp.supabase.co`; isso indica que `.env` local ainda contem `DATABASE_URL` local e nao deve ser usado como verdade de producao.
- Evidencias: `node scripts/validate-commercial-schema.mjs`, `render.yaml`, relatorios finais.

## 20. Scripts SQL existentes

- `packages/database/schema.sql`
- `packages/database/block02_interface_settings.sql`
- `packages/database/block03_catalog_items.sql`
- `packages/database/block03_crm_inteligente_existing_schema.sql`
- `packages/database/block04_billing.sql`
- `packages/database/block04_discovery_score_ia_existing_schema.sql`
- `packages/database/block05_06_discovery_crm_existing_schema.sql`
- `packages/database/block05_propostas_billing_admin_existing_schema.sql`
- `packages/database/block08_commercial_calendar.sql`
- `packages/database/block_admin_cms.sql`
- `packages/database/block_produtos_servicos_composicao_comercial.sql`
- `packages/database/block_publicacao_campos_comerciais.sql`
- Evidencia: `rg --files packages/database`.

## 21. Permissoes e perfis

- Perfis: `owner`, `admin`, `operator`, `viewer`.
- `owner/admin`: administracao, catalogo, settings sensiveis, operadores e CMS.
- `operator`: mutacoes operacionais em CRM, propostas, calendario, inbox/marketing conforme routers.
- `viewer`: leitura; mutacoes bloqueadas por guards.
- Owner embutido pode ser elevado por e-mail built-in.
- Evidencias: `apps/api/src/middleware/session.ts`, `apps/api/src/services/adminSession.ts`, `apps/api/src/services/userStore.ts`, testes `phase1-security`.

## 22. Planos e limitacoes

- Planos publicos: Starter, Pro, Agency, Enterprise.
- Billing API usa planos, creditos, checkout, portal e waitlist.
- `nodere_plan_limits` existe para limites de usuarios, creditos, modulos e features.
- UI de upgrade tem modulos por plano: Discovery, Enriquecimento, WhatsApp, Disparos, E-mail, Relatorios, Projetos, Propostas.
- Evidencias: `apps/web/app/billing/page.tsx`, `apps/api/src/routes/billing.ts`, `apps/api/src/routes/content.ts`, `apps/web/components/layout/UpgradeScreen.tsx`, `packages/database/block04_billing.sql`.

## 23. CMS administrativo

- CMS administra paginas, secoes, navegacao, assets e planos.
- Home publica consulta `getPublicPage("home")` e usa CMS se houver secoes publicadas; caso contrario usa fallback institucional em `apps/web/app/page.tsx`.
- Rotas: `/admin/content`, `/api/content/pages`, `/api/content/navigation`, `/api/content/admin/*`.
- Evidencias: `apps/web/app/page.tsx`, `apps/web/app/admin/content/ContentAdminClient.tsx`, `apps/api/src/routes/content.ts`.

## 24. CRM

- Rota principal: `/crm`.
- Ficha nova/expandida: `/app/crm/clientes/[id]`.
- Ficha antiga/lead: `/companies/[id]`.
- APIs: `/api/crm/*`, `/api/leads/*`, `/api/companies/*`.
- Abas e dados: visao geral, contatos, atividades, tarefas, negociacoes, produtos/servicos, propostas/contratos, WhatsApp, agenda, auditoria/inteligencia.
- Evidencias: `apps/web/app/crm/CrmSwitcher.tsx`, `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`, `apps/api/src/routes/crm.ts`, `apps/api/src/routes/leads.ts`, `apps/api/src/routes/companies.ts`.

## 25. Discovery

- Rotas: `/searches`, `/discovery`, `/app/discovery`, `/busca-de-empresas` redireciona.
- APIs: `/api/searches`, `/api/search`, `/api/discovery`.
- Fontes: Google Places/Maps, PageSpeed, website/social scan, Apollo/CNPJ quando configurados.
- Deduplicacao: resultados de busca sao filtrados contra leads salvos antes de virar CRM.
- Evidencias: `apps/web/app/searches/page.tsx`, `apps/web/components/SearchPanel.tsx`, `apps/api/src/routes/searches.ts`, `apps/api/src/routes/discovery.ts`.

## 26. Dashboard

- `/dashboard`: renderiza `apps/web/app/dashboard/DashboardHome.tsx`.
- `/app/dashboard`: reexporta o mesmo `DashboardHome`.
- `/`: nao renderiza dashboard; renderiza home publica institucional ou CMS.
- API: `/api/dashboard`.
- Evidencias: `apps/web/app/page.tsx`, `apps/web/app/dashboard/page.tsx`, `apps/web/app/app/dashboard/page.tsx`, `apps/api/src/routes/dashboard.ts`.

## 27. Produtos e servicos

- Catalogo oficial: `/catalog`.
- API: `/api/catalog`.
- Tabela: `catalog_items`.
- Owner/admin editam; operator/viewer nao criam/editam catalogo oficial.
- Itens inativados nao devem compor propostas.
- Evidencias: `apps/web/app/catalog/CatalogClient.tsx`, `apps/api/src/routes/catalog.ts`, `packages/database/block_produtos_servicos_composicao_comercial.sql`, `scripts/homologate-commercial-flow.mjs`.

## 28. Propostas e contratos

- Rota: `/app/proposals`.
- API: `/api/proposals`.
- Usa `catalog_items` ativos e grava snapshot em `nodere_proposals.items`.
- Desconto por percentual ou valor, motivo obrigatorio quando ha desconto.
- PDFs de proposta/contrato usam snapshot e nao devem expor notas internas/motivo interno.
- Auditoria em `nodere_audit_logs`.
- Evidencias: `apps/api/src/routes/proposals.ts`, `apps/web/app/app/proposals/page.tsx`, `packages/database/block_produtos_servicos_composicao_comercial.sql`, `scripts/homologate-commercial-flow.mjs`.

## 29. Relatorios e exportacoes

- Rota: `/reports`.
- APIs: `/api/reports/dashboard`, `/summary`, `/funnel`, `/timeline`, `/segments`, `/cities`, `/origin`, `/intelligence`, `/operators`, `/proposals`, `/export.csv`, `/pdf`.
- CSV com escape contra formulas de planilha validado em teste.
- PDFs gerados com `pdfkit`.
- Evidencias: `apps/web/app/reports/ReportsClient.tsx`, `apps/api/src/routes/reports.ts`, `apps/api/src/tests/reports.test.ts`.

## 30. WhatsApp

- Rotas: `/inbox`, webhooks `/api/whatsapp/webhook` e `/api/webhooks/whatsapp`.
- APIs: `/api/inbox`.
- Templates e anexos testados.
- Envio/recebimento real depende de `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_SECRET` e verify token.
- Evidencias: `apps/api/src/routes/inbox.ts`, `apps/api/src/routes/webhooks.ts`, `apps/api/src/tests/whatsapp-history.test.ts`, `apps/api/src/config.ts`.

## 31. IA

- Rotas: `/intelligence`, `/ia` redireciona.
- APIs: `/api/ai/*`, `/api/intelligence/summary`, `/api/openai/health`.
- Provider primario padrao: OpenAI; Anthropic previsto por config.
- Fallback sem provedor externo validado em teste.
- Evidencias: `apps/api/src/routes/ai.ts`, `apps/api/src/routes/intelligence.ts`, `apps/api/src/services/openai.ts`, `apps/api/src/tests/ai-discovery.test.ts`.

## 32. Agenda

- Rotas: `/calendario` e `/calendar`.
- API: `/api/calendar`.
- Permissoes: owner/admin/operator podem criar/alterar conforme regra; operator restrito ao que criou/foi atribuido.
- Evidencias: `apps/web/app/calendar/CalendarClient.tsx`, `apps/api/src/routes/calendar.ts`, `apps/api/src/tests/calendar.test.ts`.

## 33. Operadores e metas

- Rota: `/operators`.
- API: `/api/operators`.
- Tabelas: `nodere_operators`, `nodere_operator_goals`, `nodere_platform_users`.
- Owner/admin administram; owner troca papel/remove.
- Evidencias: `apps/web/app/operators/page.tsx`, `apps/api/src/routes/operators.ts`, `apps/api/src/services/operators.ts`.

## 34. Configuracoes

- Rotas: `/settings`, `/configuracoes` redireciona, `/app/settings`.
- APIs: `/api/settings`, `/api/workspace/*`.
- Tema, pipeline, integracoes, workspace e preferencias.
- Evidencias: `apps/web/app/settings/SettingsClient.tsx`, `apps/web/app/app/settings/page.tsx`, `apps/api/src/routes/settings.ts`, `apps/api/src/routes/workspace.ts`.

## 35. Tema claro/escuro

- Fonte de aplicacao inicial: script inline em `apps/web/app/layout.tsx` lendo `nodere_settings`, `nodere_user_preferences`, `nodere-theme`, `nodere_theme`.
- Provider: `apps/web/components/providers/ThemeProvider.tsx`.
- Runtime: `apps/web/components/ThemeRuntime.tsx`.
- Persistencia tambem passa por settings/workspace.
- Evidencias: `apps/web/app/layout.tsx`, `apps/web/components/providers/ThemeProvider.tsx`.

## 36. Mobile/PWA

- Manifest: `apps/web/public/manifest.webmanifest`.
- Service worker: `apps/web/public/sw.js`.
- Registro: `apps/web/components/PwaRegister.tsx`.
- Shortcuts: Dashboard, Busca, CRM, Relatorios, Configuracoes.
- Risco: `start_url` e shortcuts usam rotas sem prefixo (`/dashboard`, `/searches`, `/crm`) enquanto parte da nova area privada tambem usa `/app/*`.
- Evidencias: manifest, service worker e build.

## 37. Identidade visual/logos

- Logo principal: `apps/web/components/brand/Logo.tsx`.
- Logos/icone UI: `apps/web/components/ui/Logo.tsx`.
- Assets: favicons, `android-chrome-*`, `apple-touch-icon`, `og-image`.
- Cores principais: verde NODERE `#03624C`, verde glow/dark no tema.
- Evidencias: `apps/web/app/layout.tsx`, `apps/web/components/brand/Logo.tsx`, `apps/web/public/*`.

## 38. Variaveis de ambiente necessarias

Principais nomes observados, sem valores:

- Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `DATABASE_URL`, `WEB_ORIGIN`, `FRONTEND_URL`, `API_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_PAGESPEED_API_KEY`, `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_*`, `APOLLO_*`, `ECONODATA_*`, `VAPID_*`.
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Evidencias: `apps/api/src/config.ts`, `apps/web/lib/api.ts`, `apps/web/lib/supabaseAuthRest.ts`, `.env.example`, `apps/web/.env.example`, `apps/api/.env.example`, `render.yaml`.

## 39. Scripts de teste e validacao

- API: `npm run typecheck`, `npm run build`, `test:phase1`, `test:calendar`, `test:reports`, `test:crm`, `test:whatsapp`, `test:ai-discovery`.
- Web: `npm run lint`, `npm run typecheck`, `npm run build`, `test:mobile-pwa`.
- Raiz: `npm run build`, `npm run check`.
- Scripts operacionais: `apply-commercial-migration.mjs`, `validate-commercial-schema.mjs`, `homologate-commercial-flow.mjs`, `apply-publication-schema-fixes.mjs`, `apply-nodere-schema.mjs`, `build-vercel.mjs`, `debug-google-places.mjs`.
- Evidencias: `package.json`, `apps/api/package.json`, `apps/web/package.json`, `scripts/*`.

## 40. Resultado dos testes executados

Executados nesta auditoria:

- `apps/api npm run typecheck`: aprovado.
- `apps/api npm run build`: aprovado.
- `apps/api npm run test:phase1`: 11/11 aprovados.
- `apps/api npm run test:calendar`: 5/5 aprovados.
- `apps/api npm run test:reports`: 4/4 aprovados.
- `apps/api npm run test:crm`: 2/2 aprovados.
- `apps/api npm run test:whatsapp`: 5/5 aprovados.
- `apps/api npm run test:ai-discovery`: 2/2 aprovados.
- `apps/web npm run lint`: aprovado.
- `apps/web npm run typecheck`: aprovado.
- `apps/web npm run build`: aprovado, 53 rotas geradas.
- Raiz `npm run build`: aprovado, gerando `dist/`.
- `node scripts/validate-commercial-schema.mjs`: aprovado.

Nao executado nesta auditoria:

- `scripts/homologate-commercial-flow.mjs`, porque cria/edita/inativa dados reais de teste e o escopo atual pediu documentar sem alterar nada.

## 41. Deploy atual Render

- Servico: `nodere-api`.
- Config em repo: `render.yaml`, `rootDir: apps/api`, `healthCheckPath: /health`.
- Health checks publicos nesta auditoria:
  - `https://nodere-api.onrender.com/health`: 200.
  - `https://nodere-api.onrender.com/api/health`: 200.
  - `https://nodere-api.onrender.com/api/health/supabase`: 200.
- Evidencias: `render.yaml`, `Invoke-WebRequest`.

## 42. Deploy atual Vercel

- Projeto: `edipo-lima-s-projects/web`.
- Diretorio correto: `apps/web`.
- Deployment mais recente listado: `https://web-onvu8mtgc-edipo-lima-s-projects.vercel.app`, status Ready, Production.
- Dominio validado: `https://nodere.com.br/` respondeu 200.
- Evidencias: `vercel ls --scope edipo-lima-s-projects`, `Invoke-WebRequest`.

## 43. Pendencias reais

- Validar manualmente/visualmente em producao os provedores pagos: WhatsApp Cloud real, Stripe real, SMTP real, Google Ads/Business/Profile real, Apollo/Econodata conforme plano.
- Conferir rotas privadas novas sem arquivo no build e links do `PlatformSidebar`.
- Avaliar se o PWA deve iniciar em `/dashboard` ou `/app/dashboard`.
- Revisar dependencia do build raiz legado antes de futuras publicacoes para evitar confusao com `apps/web`.
- Evidencias: build Next, `apps/web/components/layout/Sidebar.tsx`, `apps/web/public/manifest.webmanifest`, `package.json`.

## 44. Bloqueios externos

- Nenhum bloqueio externo ativo confirmado nesta auditoria.
- Dependencias externas dependem de credenciais e planos de fornecedor.
- Evidencia: health checks Render/Supabase e Vercel Ready.

## 45. Riscos para proximos ajustes

- Nao misturar raiz legada (`app.js`, `serve-nodere.mjs`, `backend/`) com app atual publicado em `apps/web`/`apps/api`.
- Nao usar `nodere-site-premium/` como base.
- Nao usar `dist/` como fonte de verdade.
- Nao usar `.env` local como fonte de producao; nesta auditoria o validador mostrou `DATABASE_URL` local com host `localhost`.
- Cuidado com rotas duplicadas/aliases: `/dashboard` e `/app/dashboard`, `/terms` e `/termos`, `/privacy` e `/privacidade`, `/plans` e `/planos`.
- Cuidado com PWA/cache ao validar UI antiga vs atual.

## 46. Arquivos que nao podem ser perdidos

- `apps/web/app/page.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/dashboard/DashboardHome.tsx`
- `apps/web/app/app/layout.tsx`
- `apps/web/app/app/dashboard/page.tsx`
- `apps/web/app/app/proposals/page.tsx`
- `apps/web/app/catalog/CatalogClient.tsx`
- `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`
- `apps/web/lib/api.ts`
- `apps/api/src/server.ts`
- `apps/api/src/middleware/session.ts`
- `apps/api/src/routes/catalog.ts`
- `apps/api/src/routes/proposals.ts`
- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/crm.ts`
- `apps/api/src/routes/reports.ts`
- `packages/database/block_produtos_servicos_composicao_comercial.sql`
- `packages/database/block_publicacao_campos_comerciais.sql`
- `scripts/validate-commercial-schema.mjs`
- `scripts/homologate-commercial-flow.mjs`
- Relatorios finais de publicacao/homologacao.

## 47. Pontos que nao devem ser misturados com versoes antigas

- Nao restaurar home antiga azul.
- Nao publicar pela raiz quando o objetivo for frontend atual; publicar `apps/web`.
- Nao tratar `nodere-site-premium/` como app oficial.
- Nao usar `dist/` como codigo-fonte.
- Nao recriar fluxo comercial ja implementado.
- Nao substituir Supabase atual sem decisao explicita.
- Nao apagar compatibilidades legadas sem auditoria, pois ainda existem chamadas e fallbacks controlados.

## 48. Proximo comando recomendado para continuidade

No novo chat, usar:

```text
Leia RESUMO_TOTAL_VERSAO_ATUAL_NODERE_01_07_2026.md como fonte inicial de contexto da versao atual. Nao use versoes antigas como base. Antes de alterar qualquer coisa, confirme git status e o escopo do ajuste.
```

## 49. Checklist para abrir novo chat

- Confirmar `git status --short --branch`.
- Confirmar branch `main`.
- Confirmar HEAD esperado ou commit mais novo.
- Ler este relatorio.
- Ignorar `nodere-site-premium/`, `dist/` e historicos antigos como fonte oficial.
- Se for mexer em frontend atual, usar `apps/web`.
- Se for mexer em backend atual, usar `apps/api`.
- Se for mexer em banco, usar `packages/database` e validar ambiente antes de SQL.
- Nao expor valores de `.env`.
- Rodar validacoes adequadas ao modulo alterado.

## 50. Conclusao final

A versao atual do NODERE em 01/07/2026 esta mapeada como monorepo funcional com frontend Next.js em `apps/web`, API Express/TypeScript em `apps/api`, Supabase como fonte real de dados, Render para backend e Vercel para frontend. A publicacao atual esta saudavel pelos health checks e pela Vercel, e os builds/testes locais executados nesta auditoria passaram.

Status final deste relatorio:

- RELATORIO ATUAL CRIADO: SIM
- VERSAO ATUAL MAPEADA: SIM
- FUNCIONALIDADES MAPEADAS: SIM
- INTEGRACOES MAPEADAS: SIM
- PENDENCIAS LISTADAS: SIM
- VERSOES ANTIGAS IGNORADAS COMO BASE: SIM
- PROXIMO CHAT PODE SER ABERTO COM SEGURANCA: SIM
