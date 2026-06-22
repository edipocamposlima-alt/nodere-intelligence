# FASE 01 EXECUTADA - ESTABILIZACAO CRITICA

**Data:** 22/06/2026  
**Branch:** `stabilization-phase-01`  
**Deploy:** nao executado  
**SQL em producao:** nao executado

## Arquivos alterados na FASE 01

### API

- `apps/api/package.json`
- `apps/api/src/middleware/session.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/routes/ai.ts`
- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/credits.ts`
- `apps/api/src/routes/crm.ts`
- `apps/api/src/routes/inbox.ts`
- `apps/api/src/routes/marketing.ts`
- `apps/api/src/routes/operators.ts`
- `apps/api/src/routes/proposals.ts`
- `apps/api/src/routes/sequences.ts`
- `apps/api/src/routes/workspace.ts`
- `apps/api/src/server.ts`
- `apps/api/src/services/onboardingStore.ts`
- `apps/api/src/services/userStore.ts`
- `apps/api/src/tests/phase1-security.test.ts`

### Web/sessao

- `apps/web/app/api/auth/me/route.ts`
- `apps/web/app/register/RegisterClient.tsx`
- `apps/web/components/layout/Topbar.tsx`
- `apps/web/context/AuthProvider.tsx`

### Documentacao

- `RELATORIO_PRE_EXECUCAO_FASE_01.md`
- `RELATORIO_IMPACTO_SCHEMA_FASE_01.md`
- `FASE_01_EXECUTADA.md`

O worktree ja possuia alteracoes locais anteriores. Elas foram preservadas e nao foram revertidas.

## Correcoes executadas

1. Criado `requireWorkspaceMutation`, mantendo leitura para todos os perfis autenticados e restringindo mutacoes operacionais a owner/admin/operator.
2. Companies, CRM, marketing, inbox, sequences, credits, AI e proposals passaram a bloquear escrita de viewer com 403.
3. Operators passou a aceitar mutacoes somente de owner/admin; alteracao de owner continua restrita.
4. `/api/audit` foi movido para o conjunto autenticado por sessao e limitado a owner/admin, sem dependencia do middleware legado de API key.
5. Guarda administrativa agora diferencia 401 (sem sessao) de 403 (perfil sem permissao).
6. Refresh de sessao foi disponibilizado a owner/admin/operator/viewer autenticados; o frontend renova o token e atualiza os cookies HTTP-only.
7. Cadastro Supabase Auth agora troca o access token por uma sessao NODERE assinada antes de acessar `/workspace`.
8. Logout limpa cookies, token e perfil local.
9. Vinculo Supabase Auth valida `auth_user_id`; divergencia retorna 403 e impede sequestro de conta.
10. Escritas em `nodere_workspaces` foram alinhadas a `nome` e `atualizado_em`.
11. Removida a atualizacao residual da tabela generica `workspaces`.
12. Erros `PGRST205`/`42P01` agora retornam 503 controlado com codigo `SCHEMA_DEPENDENCY_UNAVAILABLE`, sem 500 opaco.

## Rotas corrigidas e validadas

Sem sessao, retornaram 401:

- `/api/companies`
- `/api/crm/leads`
- `/api/marketing`
- `/api/inbox`
- `/api/sequences`
- `/api/credits`
- `/api/ai`
- `/api/operators`
- `/api/intelligence`
- `/api/proposals`
- `/api/audit`
- `/api/admin/roles`
- `/api/companies/:id/communications`
- `/api/companies/:id/contracts`
- `/api/companies/:id/files`
- `/api/companies/:id/audit`
- `/api/companies/:id/intelligence`

`/api/health` retornou 200.

## Matriz de perfis local

| Perfil | Leitura `/api/credits` | Mutacao `/api/marketing` | `/api/admin/roles` |
|---|---:|---:|---:|
| owner | 200 | 400 de validacao, autorizacao aprovada | 503 schema controlado |
| admin | 200 | 400 de validacao, autorizacao aprovada | 503 schema controlado |
| operator | 200 | 400 de validacao, autorizacao aprovada | 403 |
| viewer | 200 | 403 | 403 |

O status 400 de marketing foi provocado por payload vazio e comprova que a requisicao ultrapassou autenticacao/autorizacao antes de falhar na validacao de entrada.

## Testes e builds

| Validacao | Resultado |
|---|---|
| API lint/typecheck | OK |
| API build | OK |
| Testes FASE 01 | OK - 10/10 |
| Web build | OK - 58 paginas |
| Web lint/typecheck | OK |
| Prova HTTP sem sessao | OK |
| Prova HTTP owner/admin/operator/viewer | OK com pendencia de schema descrita |

## Tabelas impactadas

- Oficiais: `nodere_workspaces`, `nodere_platform_users`, `nodere_companies`, `nodere_operators`, `nodere_workspace_modules`.
- Especializadas verificadas: `communications`, `contracts`, `company_files`, `company_documents`, `audit_logs`, `intelligence_insights`, `proposals`, `proposal_templates`, `inbox_messages`, `marketing_items`, `marketing_templates`, `marketing_campaigns`, `custom_roles`.
- Nenhum SQL foi executado e nenhum dado foi alterado durante a validacao.

## Pendencias restantes

1. Aplicacao manual/reconciliacao segura da tabela `custom_roles` no Supabase correto; ate la `/api/admin/roles` responde 503 para owner/admin.
2. Confirmar manualmente a existencia e as colunas das demais tabelas especializadas listadas no relatorio de impacto.
3. Executar homologacao autenticada com usuarios reais owner/admin/operator/viewer apos a reconciliacao do schema.
4. Os SQLs legados com tabelas genericas continuam preservados, mas nao devem ser executados em producao.

## Problemas encontrados

- Mutacoes acessiveis a viewer por falta de guarda por metodo.
- Refresh de sessao inicialmente acoplado ao perfil administrativo.
- 401 e 403 misturados em rotas administrativas.
- Escrita com nomes de colunas diferentes do schema real de `nodere_workspaces`.
- Dependencia residual de `workspaces` no onboarding.
- `/api/audit` posicionado depois do middleware legado de API key.
- Ausencia de `custom_roles` no schema conectado.

## Riscos

- Nao iniciar a FASE 2 antes de homologar `custom_roles` e as tabelas especializadas no Supabase.
- O teste local por papel usa tokens NODERE assinados; ainda e necessaria homologacao final com contas reais Supabase Auth.
- Alteracoes locais anteriores permanecem no worktree e precisam ser separadas cuidadosamente antes de qualquer commit futuro.

## Status

Implementacao de codigo P0 da FASE 01: **CONCLUIDA**.  
Homologacao integral de schema e perfis reais: **PENDENTE**.  
Pronto para iniciar FASE 2: **NAO**.
