# RELATORIO DE IMPACTO DE SCHEMA - FASE 01

**Data:** 22/06/2026  
**Branch:** `stabilization-phase-01`  
**Escopo:** auditoria e adequacao de runtime. Nenhum SQL foi executado.

## Resultado

A busca exata nas chamadas de runtime nao encontrou mais referencias `.from(...)` para as tabelas genericas `workspaces`, `workspace_members`, `users` ou `companies` em `apps/api/src` e `apps/web`.

O fluxo de onboarding deixou de atualizar `workspaces`. Criacao, leitura e atualizacao de workspace foram alinhadas aos campos reais de `nodere_workspaces`: `id`, `nome`, `plano`, `creditos`, `expira_em`, `criado_em` e `atualizado_em`.

O vinculo de autenticacao utiliza `nodere_platform_users.auth_user_id`, preservando `workspace_id`, `name`, `email`, `role` e `active`. Empresas continuam utilizando `nodere_companies`.

## Tabelas oficiais preservadas

| Tabela | Uso na FASE 01 | Alteracao de dados |
|---|---|---|
| `nodere_workspaces` | Contexto e metadados do workspace | Nenhuma durante a auditoria |
| `nodere_platform_users` | Usuario, perfil e vinculo Supabase Auth | Nenhuma durante a auditoria |
| `nodere_companies` | Empresas e CRM | Nenhuma durante a auditoria |
| `nodere_operators` | Operadores | Nenhuma durante a auditoria |
| `nodere_workspace_modules` | Modulos/permissoes | Nenhuma durante a auditoria |

## Dependencias funcionais verificadas

As rotas criticas ainda dependem das estruturas especializadas abaixo. Elas nao duplicam users, workspaces ou companies, mas precisam existir no projeto Supabase correto:

- `communications`
- `contracts`
- `company_files` e/ou `company_documents`
- `audit_logs`
- `intelligence_insights`
- `proposals` e `proposal_templates`
- `inbox_messages`
- `marketing_items`, `marketing_templates` e `marketing_campaigns`
- `custom_roles`

## Risco identificado

`custom_roles` nao esta disponivel no schema acessado no teste local. Por isso `/api/admin/roles`, com sessao owner/admin valida, retorna `503 SCHEMA_DEPENDENCY_UNAVAILABLE`. A API nao retorna mais erro 500 generico, mas a funcionalidade so podera ser homologada depois da reconciliacao manual do schema.

Os arquivos `packages/database/schema.sql`, `apps/api/src/db/schema.sql` e `apps/api/src/db/rls_policies.sql` ainda contem definicoes legadas com `users`, `companies`, `workspaces` ou `workspace_members`. Eles foram mantidos sem execucao para preservar o historico e devem ser considerados **nao aplicaveis em producao** ate uma reconciliacao manual com o schema NODERE real.

## Decisao

- SQL executado: **NAO**
- Dados apagados ou migrados: **NAO**
- Tabelas paralelas criadas: **NAO**
- Dependencias genericas de runtime eliminadas: **SIM**
- Schema integralmente homologado: **NAO**, pendente `custom_roles` e verificacao das tabelas especializadas.
