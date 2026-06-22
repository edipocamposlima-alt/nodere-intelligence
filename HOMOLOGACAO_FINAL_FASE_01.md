# HOMOLOGAÇÃO FINAL — FASE 01

**Data:** 22/06/2026  
**Branch:** `stabilization-phase-01`  
**Escopo:** validação somente  
**Código alterado:** não  
**SQL executado:** não  
**Deploy executado:** não

## Resumo executivo

| Área | Status | Resultado principal |
|---|---|---|
| Autenticação | ✅ Aprovado | Login real, refresh, cookie, logout e expiração validados localmente |
| Autorização | ❌ Reprovado | `GET /api/settings` retorna 200 sem sessão |
| Schema | ❌ Reprovado | `nodere_workspaces` real usa colunas em inglês; código da FASE 1 grava colunas em português |
| Endpoints críticos | ❌ Reprovado | Inbox retorna 500 e várias tabelas retornam `PGRST205` |
| Build | ✅ Aprovado | API, Web e build da raiz concluídos |
| Regressão | ❌ Reprovado | Páginas abrem, mas Discovery e endpoints operacionais críticos permanecem indisponíveis |

**Status geral:** ❌ REPROVADO  
**Liberado para FASE 2:** NÃO

## 1. Autenticação

| Validação | Status | Evidência |
|---|---|---|
| Login Supabase Auth | ✅ Aprovado | Login real do administrador retornou sessão válida |
| Vínculo NODERE | ✅ Aprovado localmente | `/api/admin/supabase-session` local retornou 200 e token NODERE |
| Logout Supabase | ✅ Aprovado | `signOut` concluído sem erro |
| Refresh Token | ✅ Aprovado | Refresh real do Supabase concluído |
| Cookie de sessão | ✅ Aprovado localmente | Dois cookies HTTP-only criados |
| Persistência `/api/auth/me` | ✅ Aprovado localmente | Cookie persistido retornou 200 em ambiente local coerente |
| Limpeza no logout | ✅ Aprovado | Cookies removidos; contagem final igual a zero |
| Token expirado | ✅ Aprovado | Token assinado e expirado foi rejeitado |
| Recuperação após expiração | ✅ Aprovado | Refresh Supabase gera nova sessão válida |
| Owner/Admin/Operator/Viewer | ✅ Aprovado no middleware local | Matriz executada com tokens NODERE assinados |

Observações:

- O usuário administrativo está ativo em `nodere_platform_users`, com `role=admin`, `workspace_id` e `auth_user_id` preenchidos.
- A elevação interna do administrador geral para owner foi aprovada pelos testes automatizados.
- A API atualmente publicada respondeu 401 na troca Supabase → NODERE porque a correção ainda não foi implantada. Isso é esperado nesta etapa, que proíbe deploy, e não invalida o teste local do código da branch.
- Não existem credenciais reais separadas para admin, operator e viewer. Esses perfis foram homologados com tokens locais assinados, não com quatro contas Supabase distintas.

## 2. Autorização

### Acesso sem sessão

| Rota | Resultado esperado | Resultado real | Status |
|---|---:|---:|---|
| `/api/companies` | 401 | 401 | ✅ Aprovado |
| `/api/crm/leads` | 401 | 401 | ✅ Aprovado |
| `/api/inbox` | 401 | 401 | ✅ Aprovado |
| `/api/marketing` | 401 | 401 | ✅ Aprovado |
| `/api/operators` | 401 | 401 | ✅ Aprovado |
| `/api/ai` | 401 | 401 | ✅ Aprovado |
| `/api/sequences` | 401 | 401 | ✅ Aprovado |
| `/api/settings` | 401 | 200 | ❌ Reprovado |

### Matriz por perfil

Ordem dos status em cada célula: `GET, POST, PUT, PATCH, DELETE`.

| Módulo | Owner | Admin | Operator | Viewer | Status |
|---|---|---|---|---|---|
| CRM | `200,400,404,404,404` | `200,400,404,404,404` | `200,400,404,404,404` | `200,403,403,403,403` | ✅ Aprovado para autorização |
| Companies | `200,400,404,404,404` | `200,400,404,404,404` | `200,400,404,404,404` | `200,403,403,403,403` | ✅ Aprovado para autorização |
| Inbox | `500,400,404,404,404` | `500,400,404,404,404` | `500,400,404,404,404` | `500,403,403,403,403` | ⚠️ Permissão correta; leitura quebrada |
| Marketing | `503,400,404,404,404` | `503,400,404,404,404` | `503,400,404,404,404` | `503,403,403,403,403` | ⚠️ Permissão correta; schema ausente |
| Operators | `200,400,404,404,404` | `200,400,404,404,404` | `200,403,403,403,403` | `200,403,403,403,403` | ✅ Aprovado |
| Settings | `200,404,404,200,404` | `200,404,404,200,404` | `200,404,404,403,404` | `200,404,404,403,404` | ❌ GET público sem sessão |
| AI | `404,404,404,404,404` | `404,404,404,404,404` | `404,404,404,404,404` | `404,403,403,403,403` | ⚠️ Raiz não implementada; escrita protegida |
| Sequences | `200,404,404,404,404` | `200,404,404,404,404` | `200,404,404,404,404` | `200,403,403,403,403` | ✅ Aprovado para autorização |

Os status 400 indicam que autenticação e autorização foram aprovadas e a requisição chegou à validação do payload. Status 404 em métodos não implementados não representa falha de permissão.

**Conclusão de autorização:** ❌ REPROVADA devido a `GET /api/settings` público.

## 3. Schema

### Tabelas oficiais

| Tabela | Existência | Colunas validadas | Status |
|---|---|---|---|
| `nodere_workspaces` | Existe | `id` e conjunto atual em inglês | ❌ Incompatível com parte da FASE 1 |
| `nodere_platform_users` | Existe | `id, workspace_id, name, email, role, active, password_hash, auth_user_id` | ✅ Aprovado |
| `nodere_companies` | Existe | `id, workspace_id, name` | ✅ Aprovado |

No projeto Supabase configurado e confirmado como o projeto esperado:

- Colunas existentes em `nodere_workspaces`: `id`, `name`, `owner_email`, `plan`, `credits`, `expires_at`, `created_at`, `updated_at`.
- Colunas não encontradas: `nome`, `plano`, `creditos`, `expira_em`, `criado_em`, `atualizado_em`.
- A FASE 1 alterou escritas para os nomes em português. Criação/atualização de workspace pode falhar com `42703`.

### Estruturas genéricas

| Tabela genérica | Banco | Referência ativa `.from(...)` no runtime |
|---|---|---|
| `workspaces` | Não existe (`PGRST205`) | Não encontrada |
| `workspace_members` | Não existe (`PGRST205`) | Não encontrada |
| `users` | Não existe (`PGRST205`) | Não encontrada |
| `companies` | Não existe (`PGRST205`) | Não encontrada |

Os SQLs legados ainda contêm essas estruturas, mas não foram executados.

**Conclusão de schema:** ❌ REPROVADO por incompatibilidade de colunas e dependências especializadas ausentes.

## 4. Endpoints críticos

| Endpoint | Resultado | Status |
|---|---|---|
| `companies/:id/communications` | 503, tabela `communications` ausente | ❌ Reprovado |
| `companies/:id/contracts` | 503, tabela `contracts` ausente | ❌ Reprovado |
| `companies/:id/files` | Empresa de teste 404; `company_files` ausente no schema | ❌ Reprovado |
| `companies/:id/audit` | Empresa de teste 404; `audit_logs` ausente | ❌ Reprovado |
| `companies/:id/intelligence` | Empresa de teste 404; `intelligence_insights` ausente | ❌ Reprovado |
| `/api/proposals` | 503, tabela `proposals` ausente | ❌ Reprovado |
| `/api/inbox` | 500, erro de coluna `42703` | ❌ Reprovado |
| `/api/marketing` | 503, tabela `marketing_items` ausente | ❌ Reprovado |
| `/api/admin/roles` | 503, tabela `custom_roles` ausente | ❌ Reprovado |

Também foram confirmadas como ausentes: `company_files`, `audit_logs`, `intelligence_insights`, `marketing_items` e `custom_roles`. `inbox_messages` existe, mas a consulta usa pelo menos uma coluna não disponível.

**Conclusão de endpoints:** ❌ REPROVADOS.

## 5. Build e testes automatizados

| Validação | Resultado | Status |
|---|---|---|
| `apps/api` lint/typecheck | Sem erros | ✅ Aprovado |
| `apps/api` build | Sem erros | ✅ Aprovado |
| `apps/api` testes FASE 1 | 10/10 | ✅ Aprovado |
| `apps/web` build | 58 páginas geradas | ✅ Aprovado |
| `apps/web` lint/typecheck | Sem erros | ✅ Aprovado |
| Build da raiz | Concluído | ✅ Aprovado |

## 6. Regressão

### Páginas autenticadas locais

Com sessão administrativa real, todas responderam 200 sem redirecionar ao login:

| Área | Página | API principal | Status |
|---|---|---:|---|
| Dashboard | `/dashboard` | 200 | ✅ Aprovado |
| Discovery | `/discovery` | 503 sem Google Places local | ⚠️ Parcial |
| CRM | `/crm` | 200 | ✅ Aprovado |
| Relatórios | `/reports` | 200 | ✅ Aprovado técnico |
| Configurações | `/settings` | 200 | ❌ Reprovado em segurança por GET público |
| Catálogo | `/catalog` | 200 | ✅ Aprovado |
| Calendário | `/calendar` | 200 | ✅ Aprovado |

O Discovery retornou erro controlado `KEY_NOT_CONFIGURED` porque `GOOGLE_PLACES_API_KEY` não está disponível no ambiente local. Não foi possível homologar uma busca real sem essa configuração.

Apesar das páginas responderem 200, Inbox, Marketing, Proposals e Admin Roles permanecem operacionalmente quebrados. Por isso a regressão geral não pode ser aprovada.

**Conclusão de regressão:** ❌ REPROVADA.

## 7. Pendências bloqueadoras

1. Proteger `GET /api/settings` com sessão válida.
2. Reconciliar o código de workspace com as colunas reais em inglês de `nodere_workspaces`.
3. Corrigir a coluna inexistente usada por `/api/inbox`.
4. Reconciliar manualmente as tabelas de communications, contracts, files, audit, intelligence, proposals, marketing e custom roles.
5. Homologar owner/admin/operator/viewer com quatro contas Supabase reais.
6. Configurar Google Places no ambiente de homologação e executar busca real.
7. Repetir toda esta homologação depois das correções, antes de iniciar a FASE 2.

## Status geral da FASE 1

AUTENTICAÇÃO: **APROVADA**  
AUTORIZAÇÃO: **REPROVADA**  
SCHEMA: **REPROVADO**  
ENDPOINTS: **REPROVADOS**  
REGRESSÃO: **REPROVADA**  
LIBERADO PARA FASE 2: **NÃO**
