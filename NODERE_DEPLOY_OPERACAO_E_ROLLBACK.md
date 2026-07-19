# NODERE - Deploy, Operacao e Rollback

Data: 2026-07-17
Branch: `main`
Commit: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`

## 1. Principio operacional

O projeto deve ser operado a partir dos modulos canonicos:
- Frontend: `apps/web`
- Backend: `apps/api`
- Banco/migrations: `packages/database`

A raiz contem camada legada e mecanismo de protecao contra deploy Vercel incorreto. Nao publicar frontend pela raiz.

## 2. Ambientes conhecidos

Producao frontend:
- `https://nodere.com.br`
- `https://www.nodere.com.br`

Producao backend:
- `https://nodere-api.onrender.com`

Banco:
- Supabase/Postgres associado ao projeto `qhopjggnbzewuuktqntp`.

Local:
- Web: `apps/web`, usualmente porta 3000.
- API: `apps/api`, porta definida por `PORT`/`API_PORT`.

Staging:
- NAO CONFIRMADO nesta etapa. Historico indica que producao e desenvolvimento ja apontaram para o mesmo Supabase. Confirmar antes de qualquer teste destrutivo.

## 3. Vercel

Evidencias:
- `vercel.json` na raiz define `buildCommand` que falha propositalmente com mensagem: deploy pela raiz desativado; use o projeto Vercel oficial com Root Directory `apps/web`.
- Frontend deve publicar somente o projeto Vercel configurado para `apps/web`.

Configuracao esperada:
- Project/root directory: `apps/web`
- Framework: Next.js
- Build command: `npm run build`
- Output: `.next`
- Domains: `nodere.com.br`, `www.nodere.com.br`

Variaveis esperadas no Vercel:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` quando necessario.

Status do painel Vercel: BLOQUEADO POR ACESSO nesta etapa.

## 4. Render

Evidencias em `render.yaml`:
- Servico canonico: `nodere-api`
- Runtime: Node
- RootDir: `apps/api`
- BuildCommand: `npm install --include=dev`
- StartCommand: `npm start`
- HealthCheckPath: `/health`

Servico adicional:
- `nodere-ts-api`: marcado no proprio `render.yaml` como LEGACY / A CONFIRMAR. Nao remover automaticamente.

Variaveis esperadas:
- `NODE_ENV=production`
- `WEB_ORIGIN=https://nodere.com.br`
- `FRONTEND_URL`, quando usado
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- integracoes conforme modulo.

Status do painel Render: BLOQUEADO POR ACESSO nesta etapa.

## 5. Health checks

Endpoints backend:
- `GET /health`
- `GET /api/health`
- `GET /api/health/version`
- `GET /api/health/providers`
- `GET /api/health/supabase`

Validacoes recomendadas:
- `/health`: API no ar.
- `/api/health`: configuracoes basicas sem expor secrets.
- `/api/health/version`: commit/runtime.
- `/api/health/supabase`: acesso a `nodere_companies`.
- `/api/health/providers`: IA providers.

Status nesta etapa:
- Codigo confirmado.
- Chamada ao vivo nao executada nesta auditoria.

## 6. Scripts de build e validacao

Raiz:
- `npm run build`: verifica `app.js`, `serve-nodere.mjs`, `backend/src/server.js` e executa `scripts/build-vercel.mjs`.
- `npm run check`: checa arquivos legados.

API:
- `npm run typecheck`
- `npm run build`
- `npm run test:phase1`
- `npm run test:calendar`
- `npm run test:reports`
- `npm run test:crm`
- `npm run test:whatsapp`
- `npm run test:ai-discovery`

Web:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run test:mobile-pwa`

Schema/comercial:
- `node scripts/validate-commercial-schema.mjs`
- `node scripts/homologate-commercial-flow.mjs`
- `node scripts/apply-commercial-migration.mjs` somente com autorizacao explicita e ambiente correto.

Visual/mobile:
- `node scripts/validate-theme-correction-05.mjs`
- `node scripts/validate-responsive-overflow.mjs`
- scripts CDP em `.codex_tmp` quando existirem.

## 7. Processo seguro de desenvolvimento

1. `git status --short`.
2. Confirmar branch.
3. Ler documentos de continuidade.
4. Identificar modulo exato.
5. Evitar arquivos legados se o modulo canonico existir em `apps/web`/`apps/api`.
6. Fazer alteracoes pequenas.
7. Atualizar Manual/Ajuda se qualquer funcionalidade/fluxo mudar.
8. Rodar validacoes do modulo.
9. Rodar build/typecheck/lint obrigatorios.
10. Validar visualmente se UI foi alterada.
11. Gerar/atualizar relatorio especifico.
12. Commit apenas apos testes.

## 8. Processo seguro de deploy frontend

Pre-condicoes:
- branch correta;
- build web aprovado;
- `git diff --check` aprovado;
- login/dashboard/rotas criticas validados localmente quando aplicavel;
- sem secrets em commit;
- Vercel root directory confirmado como `apps/web`.

Passos:
1. `git status --short`.
2. `git log -1 --oneline`.
3. Push da branch/merge conforme politica.
4. Publicar/promover no projeto Vercel correto.
5. Aguardar READY.
6. Confirmar commit publicado.
7. Confirmar aliases `nodere.com.br` e `www.nodere.com.br`.
8. Smoke test em producao:
   - `/login`;
   - `/dashboard`;
   - `/app/dashboard`;
   - menu lateral/mobile;
   - modulo alterado.

Rollback frontend:
- usar rollback/promote para ultimo deployment READY conhecido e validado;
- confirmar aliases;
- registrar commit e motivo.

## 9. Processo seguro de deploy backend

Pre-condicoes:
- `apps/api npm run typecheck`;
- `apps/api npm run build`;
- testes de rota/middleware relevantes;
- Render rootDir confirmado `apps/api`;
- variaveis conferidas sem expor valor.

Passos:
1. Conferir `render.yaml`.
2. Conferir commit atual no Render.
3. Redeploy do `nodere-api`.
4. Aguardar healthy.
5. Validar:
   - `/health`;
   - `/api/health`;
   - `/api/health/version`;
   - `/api/health/supabase`;
   - login owner/admin se auth foi tocada.
6. Revalidar modulo consumidor no frontend.

Rollback backend:
- redeploy do ultimo commit estavel ou rollback pelo painel Render;
- validar health;
- validar login;
- registrar motivo.

## 10. Processo seguro de banco/migrations

Nunca executar SQL em producao sem autorizacao explicita.

Checklist antes de migration:
1. Confirmar ambiente: local/staging/producao.
2. Confirmar Supabase project id.
3. Fazer backup logico do objeto afetado quando possivel.
4. Ler SQL completo.
5. Confirmar idempotencia.
6. Confirmar que constraints nao quebram dados existentes.
7. Aplicar primeiro em staging quando existir.
8. Rodar `scripts/validate-commercial-schema.mjs` ou validador especifico.
9. Rodar homologacao funcional.
10. Documentar objetos criados/alterados.

Rollback banco:
- preferir migration reversa idempotente preparada antes;
- se nao houver, restaurar backup logico;
- nao apagar dados reais sem aprovacao explicita.

## 11. Monitoramento e logs

Confirmado no codigo:
- Express error handler com logs de schema.
- Render keepalive em producao.
- Swagger UI `/docs`.
- health providers.

Nao validado:
- Vercel logs.
- Render logs.
- Supabase logs.
- Alertas externos.
- Backups automatizados.

## 12. Artefatos que nao devem ir para commit/deploy

- `.env`
- `.env.local`
- `.env.production`
- `.vercel`
- `.next`
- `node_modules`
- `dist` salvo se artefato historico intencional, confirmar antes
- logs
- caches
- arquivos temporarios `.codex_tmp` sem necessidade
- connection strings ou tokens em relatorios
- `nodere-site-premium/` sem decisao explicita

## 13. Comando de retomada sugerido

Para um novo chat antes de qualquer publicacao:

1. Ler `NODERE_CHECKLIST_CONTINUIDADE_NOVO_CHAT.md`.
2. Rodar `git status --short`.
3. Rodar `git log -1 --oneline`.
4. Validar `apps/web npm run typecheck`.
5. Validar `apps/api npm run typecheck`.
6. Consultar Vercel/Render se a tarefa envolver producao.
