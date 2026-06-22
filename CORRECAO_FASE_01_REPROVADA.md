# Correção da Homologação Reprovada - Fase 1

Data: 22/06/2026  
Branch: `stabilization-phase-01`  
Escopo: autorização, schema, endpoints críticos e regressão técnica.  
Deploy: não executado.  
SQL em produção: não executado.

## Resumo

Foram corrigidas as falhas de autorização e os erros não tratados causados por tabelas ou colunas ausentes. O runtime foi alinhado ao schema real `nodere_*`, e foi gerada uma migração incremental para aplicação manual no Supabase.

A Fase 2 permanece bloqueada porque a migração ainda não foi aplicada e, por consequência, as mutações dependentes das novas tabelas ainda não podem ser homologadas com `200/201` e persistência real.

## Causas encontradas

| Área | Causa raiz | Correção |
| --- | --- | --- |
| Autorização | `GET /api/settings` estava público | Adicionado `requireWorkspaceSession` |
| Perfis | Rotas operacionais não tinham guarda uniforme de mutação | Aplicado `requireWorkspaceMutation` e separação 401/403 |
| Admin | Perfil autenticado sem privilégio recebia 401 | Corrigido para 403; 401 reservado à ausência de sessão |
| Schema | Código escrevia colunas em português inexistentes em `nodere_workspaces` | Padronizado para `name`, `plan`, `credits`, `expires_at`, `created_at`, `updated_at` |
| Endpoints | Tabelas/colunas ausentes geravam `PGRST205`, `42703` ou 500 | Classificação central e fallback vazio somente em leituras |
| Endpoints 404 | `/api/communications`, `/api/contracts` e `/api/files` não existiam | Criados endpoints agregados protegidos por workspace |
| Inbox | Tabela existente tinha formato antigo | Migração incremental adiciona as colunas exigidas sem apagar dados |

## Arquivos alterados na correção

- `apps/api/src/server.ts`
- `apps/api/src/middleware/session.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/routes/ai.ts`
- `apps/api/src/routes/audit.ts`
- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/inbox.ts`
- `apps/api/src/routes/marketing.ts`
- `apps/api/src/routes/proposals.ts`
- `apps/api/src/routes/settings.ts`
- `apps/api/src/routes/workspace.ts`
- `apps/api/src/services/onboardingStore.ts`
- `apps/api/src/services/userStore.ts`
- `apps/api/src/tests/phase1-security.test.ts`
- `apps/api/src/utils/supabaseErrors.ts`
- `MIGRACAO_CORRECAO_FASE_01.sql`

As demais alterações já existentes no worktree foram preservadas e não foram revertidas.

## Migração gerada

Arquivo: `MIGRACAO_CORRECAO_FASE_01.sql`

Características:

- Não cria `users`, `workspaces`, `workspace_members` ou `companies` paralelos.
- Usa apenas `nodere_workspaces`, `nodere_platform_users` e `nodere_companies` como entidades centrais.
- Usa `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`.
- Não contém `DROP TABLE`, `TRUNCATE` ou `DELETE FROM`.
- Cria RLS por `workspace_id` nas tabelas operacionais.
- Adiciona relacionamentos como `NOT VALID` para preservar registros históricos.
- Solicita recarga do schema PostgREST ao final.

## Impacto da migração

Tabelas criadas ou completadas:

- `custom_roles`
- `company_contacts`
- `communications`
- `company_contracts`
- `company_files`
- `activity_logs`
- `download_logs`
- `nodere_audit_logs`
- `intelligence_insights`
- `nodere_proposals`
- `proposal_templates`
- `proposal_versions`
- `inbox_messages`
- `message_templates`
- `campaigns`
- `social_connections`

Colunas operacionais são adicionadas somente a `nodere_workspaces`. Não há alteração destrutiva de dados.

## Validações executadas

| Validação | Resultado |
| --- | --- |
| API lint/typecheck | OK |
| API build | OK |
| Testes Fase 1 | OK - 11/11 |
| Web lint/typecheck | OK |
| Web build | OK - 58 páginas |
| Build raiz legado | OK |
| Referências runtime a tabelas genéricas | OK - nenhuma encontrada |
| Migração sem comandos destrutivos | OK |
| Rotas operacionais sem sessão | OK - 401 |
| Leituras Owner/Admin/Operator/Viewer | OK - 200 |
| Admin/Audit/Integrações para Operator/Viewer | OK - 403 |
| Mutações Viewer | OK - 403 |
| Rotas protegidas do frontend sem sessão | OK - redirecionam para login |

## Pendências obrigatórias

1. Revisar e aplicar manualmente `MIGRACAO_CORRECAO_FASE_01.sql` no Supabase correto.
2. Recarregar o schema PostgREST após a aplicação.
3. Retestar mutações válidas e persistência real para cada perfil.
4. Revalidar visualmente as áreas autenticadas com sessão real. O navegador integrado local foi bloqueado pelo ambiente Windows, portanto essa validação não foi marcada como concluída.
5. Não iniciar a Fase 2 antes dessas quatro etapas.

## Riscos restantes

- Dados históricos que violem novos relacionamentos continuam preservados por constraints `NOT VALID` e devem ser saneados antes da validação futura das constraints.
- Até a migração ser aplicada, leituras retornam listas vazias de forma controlada, mas gravações dependentes das tabelas ausentes continuam indisponíveis.
- Nenhuma alteração foi publicada; produção permanece inalterada.
