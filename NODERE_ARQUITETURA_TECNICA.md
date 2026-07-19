# NODERE - Arquitetura Tecnica

Data: 2026-07-17
Branch: `main`
Commit: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`

## 1. Visao de arquitetura

Arquitetura confirmada:
- Monorepo.
- Frontend canonico: `apps/web`.
- Backend canonico: `apps/api`.
- Banco/autenticacao: Supabase/Postgres.
- Deploy frontend: Vercel com root directory `apps/web`.
- Deploy backend: Render com root directory `apps/api`.
- Camada legada preservada: `app.js`, `serve-nodere.mjs`, `backend/`.

Estado: CONFIRMADO NO CODIGO.

## 2. Frontend

Tecnologias:
- Next.js 15.5.19.
- React 19.
- TypeScript.
- Tailwind CSS 3.4.x.
- Lucide React para icones.
- TipTap para editor rico.
- React Big Calendar.
- jsPDF e html2canvas para algumas exportacoes.
- PWA com manifest/service worker.
- Supabase JS no cliente para autenticacao.

Scripts:
- `apps/web npm run dev`
- `apps/web npm run build`
- `apps/web npm run start`
- `apps/web npm run lint` (executa `tsc --noEmit`)
- `apps/web npm run typecheck`
- `apps/web npm run test:e2e`
- `apps/web npm run test:mobile-pwa`

Arquivos centrais:
- `apps/web/app/layout.tsx`: layout global e script inicial de tema.
- `apps/web/app/app/layout.tsx`: shell privado.
- `apps/web/middleware.ts`: protecao de rotas e redirecionamento raiz.
- `apps/web/components/Sidebar.tsx`: menu lateral desktop.
- `apps/web/components/MobileNav.tsx`: navegacao mobile/drawer.
- `apps/web/components/Header.tsx`: cabecalho privado.
- `apps/web/lib/api.ts`: cliente HTTP central.
- `apps/web/lib/theme.ts`: normalizacao/persistencia de tema.

## 3. Layout e experiencia visual

Layout publico:
- Usado por login, registro, termos, privacidade e paginas publicas.
- A raiz `/` e redirecionada para `/login` quando sem sessao.

Layout privado:
- Sidebar, header, mobile nav, busca, creditos e navegacao interna.
- Menus agrupados em Principal, Comercial, Comunicacao, Inteligencia, Gestao e Administracao.

Tema:
- `apps/web/app/layout.tsx` aplica script inline antes da hidratacao.
- `apps/web/lib/theme.ts` normaliza `light`/`dark`, densidade, fonte, cor primaria e variantes.
- Variaveis CSS em `apps/web/app/globals.css` controlam fundos, textos, bordas, cards e estados.

Status: PARCIALMENTE IMPLEMENTADO.
Risco: historico recente indica retrabalhos de tema, icones, zoom, agenda e Ficha 360; manter validacao visual obrigatoria antes de publicar novas mudancas.

## 4. Middleware e autenticacao no frontend

`apps/web/middleware.ts`:
- considera publicas: login, reset, forgot, terms/privacy, `/app/login` redirecionado, `/api/admin`, `/api/content`, `/api/auth`, assets, manifest, service worker e afins.
- `/`:
  - com cookie de sessao: redireciona para `/dashboard`;
  - sem sessao: redireciona para `/login`.
- rotas nao publicas sem cookie: redirecionam para `/login?next=<rota>`.

Cookies considerados:
- `nodere_session`
- `nodere-session`

Status: CONFIRMADO NO CODIGO.

## 5. Cliente API do frontend

`apps/web/lib/api.ts`:
- base URL vem de `NEXT_PUBLIC_API_URL` com fallback documentado em `apps/web/lib/apiBase.ts`.
- headers usam:
  - `Authorization: Bearer <nodere_admin_token>` quando ha token;
  - fallback para `NEXT_PUBLIC_API_KEY` em endpoints legados quando nao ha token;
  - `credentials: include`.
- downloads PDF/CSV usam `fetchAuthenticatedFile` e blobs.

Risco: o fallback de API key publica e necessario para compatibilidade legada, mas deve permanecer limitado e nunca substituir autorizacao real dos fluxos novos.

## 6. Backend

Tecnologias:
- Express.
- TypeScript.
- Zod.
- Supabase JS.
- `pg` para Postgres direto.
- `pdfkit` para PDFs.
- `multer` para uploads em memoria.
- `stripe`.
- `nodemailer`.
- `web-push`.
- Swagger UI.

Scripts:
- `apps/api npm run dev`
- `apps/api npm run build`
- `apps/api npm run start`
- `apps/api npm run typecheck`
- `apps/api npm run test:phase1`
- `apps/api npm run test:calendar`
- `apps/api npm run test:reports`
- `apps/api npm run test:crm`
- `apps/api npm run test:whatsapp`
- `apps/api npm run test:ai-discovery`

Arquivos centrais:
- `apps/api/src/server.ts`
- `apps/api/src/config.ts`
- `apps/api/src/middleware/session.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/db/supabase.ts`
- `apps/api/src/db/pool.ts`
- `apps/api/src/routes/*`
- `apps/api/src/services/*`

## 7. Rotas backend montadas

Publicas/health:
- `GET /health`
- `GET /api/health`
- `GET /api/health/version`
- `GET /api/health/providers`
- `GET /api/health/supabase`
- `GET /api/openai/health`
- `POST /api/auth/forgot-password`

Protegidas por sessao/workspace:
- `/api/companies`
- `/api/crm`
- `/api/leads`
- `/api/discovery`
- `/api/ai`
- `/api/intelligence`
- `/api/dashboard`
- `/api/reports`
- `/api/calendar`
- `/api/catalog`
- `/api/marketing`
- `/api/integrations`
- `/api/inbox`
- `/api/sequences`
- `/api/operators`
- `/api/credits`
- `/api/backup`
- `/api/proposals`
- `/api/push`
- `/api/notifications`
- `/api/developer`

Protegidas por role:
- `/api/audit`: owner/admin.
- `PATCH /api/settings`: owner/admin.
- `PATCH /api/settings/pipeline`: owner/admin/operator.
- `POST /api/settings/test-smtp`: owner/admin.

Webhooks:
- `POST /api/billing/webhook`: Stripe raw body.
- `GET/POST /api/whatsapp/webhook`.
- `/api/webhooks`.

Outros:
- `/api/admin`
- `/api/content`
- `/api/onboarding`
- `/api/workspace`
- `/api/legal`
- `/api/contact`
- `/api/geocode`
- `/api/searches`
- `/api/search`
- `/api/settings`
- `/api/billing`
- `/api/admin/verticals`
- `/v1`
- `/docs`

## 8. Autenticacao e autorizacao backend

`attachSession`:
- tenta validar token de sessao proprio.
- se falhar e houver Supabase, tenta `supabase.auth.getUser(token)`.
- cria/garante usuario interno via `ensureSupabaseAuthUser`.
- normaliza sessao com role, workspace e userId.

`requireWorkspaceSession`:
- sem sessao retorna 401 `Login obrigatorio`.

`requireWorkspaceRole`:
- aceita roles especificadas;
- built-in owner email e tratado como owner.

`requireAuth`:
- fallback legado por `API_KEY` quando configurada.
- se `API_KEY` nao existe, libera.

Estado: CONFIRMADO NO CODIGO.
Risco: validar com usuario real owner/admin/operator/viewer antes de mudancas de permissao.

## 9. Dados e persistencia

Supabase:
- `apps/api/src/db/supabase.ts` usa service role no backend.
- `apps/web` usa anon key para auth client.

Postgres direto:
- `apps/api/src/db/pool.ts` usa `DATABASE_URL`, parse de `sslmode`, `ssl.rejectUnauthorized=false`.

Fallbacks:
- `companyStore` possui memoria local quando Supabase nao configurado ou ambiente nao-producao.
- `userStore`, `admin`, `onboardingStore` possuem memoria/fallbacks.
- Frontend usa localStorage para token, preferencias, segmentos customizados e alguns caches de UX.

Estado: PARCIALMENTE IMPLEMENTADO.

## 10. Seguranca tecnica

Confirmado:
- Helmet no Express.
- CORS com origins explicitos e `.vercel.app`.
- Rotas privadas por sessao.
- Service role apenas backend por design.
- `vercel.json` bloqueia deploy raiz.

Riscos:
- CORS aceita qualquer `.vercel.app`.
- `requireAuth` por API key legado permanece ativo.
- Fallbacks/memoria podem mascarar ausencia de schema se usados fora do contexto correto.
- Variaveis locais `.env` existem; nao devem ser commitadas.

## 11. Observabilidade e operacao

Confirmado:
- Health checks.
- Logs de erro no error handler.
- Keepalive Render em producao.
- Swagger em `/docs`.

Nao confirmado:
- Monitoramento externo.
- Alertas.
- Log drain Vercel/Render.
- Backup automatizado Supabase.

## 12. Legado e duplicidades

Legado preservado:
- `app.js`
- `serve-nodere.mjs`
- `backend/`
- root `package.json` ainda executa checks desses arquivos e `scripts/build-vercel.mjs`.

Duplicidades/aliases:
- `/dashboard` e `/app/dashboard`
- `/companies` e `/empresas`
- `/reports` e `/relatorios`
- `/settings` e `/configuracoes`
- `/calendar` e `/calendario`
- `/manual`, `/ajuda`, `/help`

Diretriz: nao apagar sem plano de migracao. Documentar antes de qualquer remocao.
