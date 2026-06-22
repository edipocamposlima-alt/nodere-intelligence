# RELATÓRIO PRÉ-EXECUÇÃO — FASE 01

**Data:** 22/06/2026  
**Branch:** `stabilization-phase-01`  
**Base:** `main` local, com worktree preexistente não limpo  
**Escopo autorizado:** somente P0 da FASE 1 — segurança/permissões, sessão, schema e endpoints críticos.  
**Restrições:** sem deploy, sem SQL em produção e sem início das FASES 2–7.

## 1. Estado preservado

O trabalho começou com alterações locais anteriores em API, Web, CMS, CRM e documentação. Elas foram preservadas na nova branch e não serão revertidas. As correções da FASE 1 serão mantidas no menor conjunto possível de arquivos.

## 2. Diagnóstico inicial

1. `requireWorkspaceRole` existe, mas várias mutações de companies, CRM, marketing, inbox, sequences, credits, AI e operators não o utilizam.
2. `requireWorkspaceSession` protege os routers, porém garante apenas autenticação; não diferencia owner/admin/operator/viewer.
3. Há duas verificações de autenticação: sessão NODERE/Supabase em `middleware/session.ts` e API key opcional em `middleware/auth.ts`.
4. O token NODERE tem validade própria e o frontend também usa sessão Supabase/cookie, criando risco de expiração inconsistente.
5. `onboardingStore.ts` ainda tenta atualizar a tabela genérica `workspaces` após atualizar `nodere_workspaces`.
6. Rotas críticas usam tabelas genéricas como `communications`, `contracts`, `company_files`, `audit_logs`, `intelligence_insights`, `proposals`, `inbox_messages`, `marketing_items` e `custom_roles`; a existência no schema real precisa ser tratada sem SQL automático.
7. `/api/audit` é montada depois de um middleware de API key legado, em vez de usar a sessão de workspace aplicada às rotas operacionais.

## 3. Arquivos potencialmente impactados

### Segurança e sessão

- `apps/api/src/middleware/session.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/services/adminSession.ts`
- `apps/api/src/services/userStore.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/server.ts`
- `apps/web/app/login/LoginClient.tsx`
- `apps/web/contexts/WorkspaceContext.tsx`
- `apps/web/lib/api.ts`
- `apps/web/middleware.ts`

### Autorização por rota

- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/crm.ts`
- `apps/api/src/routes/marketing.ts`
- `apps/api/src/routes/inbox.ts`
- `apps/api/src/routes/sequences.ts`
- `apps/api/src/routes/credits.ts`
- `apps/api/src/routes/ai.ts`
- `apps/api/src/routes/intelligence.ts`
- `apps/api/src/routes/operators.ts`
- `apps/api/src/routes/audit.ts`
- `apps/api/src/routes/proposals.ts`
- `apps/api/src/routes/admin.ts`

### Schema

- `apps/api/src/services/onboardingStore.ts`
- `apps/api/src/db/schema.sql` (somente auditoria; não executar)
- `packages/database/schema.sql` (somente auditoria; não executar)

## 4. Tabelas impactadas ou referenciadas

### Estruturas oficiais

- `nodere_workspaces`
- `nodere_platform_users`
- `nodere_companies`
- `nodere_operators`
- `nodere_workspace_modules`

### Estruturas críticas a reconciliar/verificar

- `communications`
- `contracts`
- `company_files`
- `company_documents`
- `audit_logs`
- `intelligence_insights`
- `proposals`
- `proposal_templates`
- `inbox_messages`
- `marketing_items`
- `marketing_templates`
- `marketing_campaigns`
- `custom_roles`

### Dependências genéricas a eliminar

- `workspaces`
- `workspace_members`
- `users`
- `companies`

## 5. APIs impactadas

- `/api/companies` e subrotas `/communications`, `/contracts`, `/files`, `/audit`, `/intelligence`
- `/api/crm`
- `/api/marketing`
- `/api/inbox`
- `/api/sequences`
- `/api/credits`
- `/api/ai`
- `/api/intelligence`
- `/api/operators`
- `/api/audit`
- `/api/proposals`
- `/api/admin/roles`
- `/api/admin/session`
- `/api/admin/supabase-session`

## 6. Matriz de autorização esperada

| Operação | Owner | Admin | Operator | Viewer |
|---|---:|---:|---:|---:|
| Leitura operacional do workspace | 200 | 200 | 200 | 200 |
| Criar/editar companies e CRM | 200 | 200 | 200 | 403 |
| Marketing, inbox e sequences — mutação | 200 | 200 | 200 | 403 |
| Consumir créditos/AI operacional | 200 | 200 | 200 | 403 |
| Gerenciar operadores e roles | 200 | 200 quando permitido | 403 | 403 |
| Alterar papel owner | 200 | 403 | 403 | 403 |
| Sem sessão válida | 401 | 401 | 401 | 401 |

## 7. Riscos antes da execução

- **Crítico:** acesso de viewer a mutações sem guard específico.
- **Crítico:** contexto de workspace inconsistente entre token, cookie e sessão Supabase.
- **Crítico:** dependência residual de schema genérico.
- **Alto:** endpoints 500 por tabela/coluna ausente no schema real.
- **Alto:** alterações locais anteriores nos mesmos arquivos aumentam o risco de mistura de escopo.

## 8. Plano de validação

1. Testes unitários/integração dos middlewares para 401/403/200.
2. Testes por papel nas rotas companies, CRM, marketing, inbox, sequences, credits, AI e operators.
3. Busca estática por dependências de tabelas genéricas.
4. Teste de emissão, verificação e expiração de token.
5. `npm run lint`.
6. Build API.
7. Build Web.

Este checkpoint não executa SQL nem altera produção.
