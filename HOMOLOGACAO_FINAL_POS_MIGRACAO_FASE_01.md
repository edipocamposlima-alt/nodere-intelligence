# Homologação Final Pós-Migração - Fase 1

Data: 22/06/2026  
Branch: `stabilization-phase-01`  
Supabase: projeto `qhopjggnbzewuuktqntp`  
Ambiente da aplicação: local, conectado ao Supabase migrado  
Deploy: não executado

## Resultado executivo

| Bloco | Status | Evidência principal |
| --- | --- | --- |
| Autenticação | APROVADA | Login Supabase real do administrador, access token, refresh token e cookie HTTP-only emitidos com sucesso |
| Autorização | APROVADA | Matriz Owner/Admin/Operator/Viewer com 401, 403 e 200 conforme o perfil |
| Schema | APROVADO | 19 tabelas e suas colunas consultadas sem `PGRST205`, `42703` ou erro de cache |
| Endpoints | APROVADOS | Endpoints críticos, ficha comercial, relatórios e PDF responderam corretamente |
| Regressão | APROVADA | 12 páginas autenticadas, builds e testes passaram sem 404/500 |

## 1. Schema

O schema foi validado por consultas somente leitura usando o backend configurado para o projeto correto.

### Tabelas centrais

- `nodere_workspaces`: OK, incluindo as colunas operacionais adicionadas pela migração.
- `nodere_platform_users`: OK.
- `nodere_companies`: OK.

### Tabelas da migração

- `custom_roles`: OK.
- `company_contacts`: OK.
- `communications`: OK.
- `company_contracts`: OK.
- `company_files`: OK.
- `activity_logs`: OK.
- `download_logs`: OK.
- `nodere_audit_logs`: OK.
- `intelligence_insights`: OK.
- `nodere_proposals`: OK.
- `proposal_templates`: OK.
- `proposal_versions`: OK.
- `inbox_messages`: OK.
- `message_templates`: OK.
- `campaigns`: OK.
- `social_connections`: OK.

Resultado: nenhuma tabela ou coluna consultada retornou erro de schema.

### RLS

As 16 tabelas migradas foram consultadas com a chave anônima e não expuseram registros. Resultado: isolamento anônimo aprovado.

## 2. Endpoints críticos

### Matriz de leitura

| Rota | Sem sessão | Owner | Admin | Operator | Viewer |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/api/companies` | 401 | 200 | 200 | 200 | 200 |
| `/api/crm/leads` | 401 | 200 | 200 | 200 | 200 |
| `/api/inbox` | 401 | 200 | 200 | 200 | 200 |
| `/api/marketing` | 401 | 200 | 200 | 200 | 200 |
| `/api/operators` | 401 | 200 | 200 | 200 | 200 |
| `/api/settings` | 401 | 200 | 200 | 200 | 200 |
| `/api/ai` | 401 | 200 | 200 | 200 | 200 |
| `/api/sequences` | 401 | 200 | 200 | 200 | 200 |
| `/api/credits` | 401 | 200 | 200 | 200 | 200 |
| `/api/communications` | 401 | 200 | 200 | 200 | 200 |
| `/api/contracts` | 401 | 200 | 200 | 200 | 200 |
| `/api/files` | 401 | 200 | 200 | 200 | 200 |
| `/api/intelligence/summary` | 401 | 200 | 200 | 200 | 200 |
| `/api/proposals` | 401 | 200 | 200 | 200 | 200 |
| `/api/audit` | 401 | 200 | 200 | 403 | 403 |
| `/api/admin/roles` | 401 | 200 | 200 | 403 | 403 |
| `/api/settings/integrations` | 401 | 200 | 200 | 403 | 403 |
| `/api/dashboard` | 401 | 200 | 200 | 200 | 200 |
| `/api/reports/summary` | 401 | 200 | 200 | 200 | 200 |
| `/api/catalog` | 401 | 200 | 200 | 200 | 200 |
| `/api/calendar` | 401 | 200 | 200 | 200 | 200 |

### Relatórios

As 15 subrotas reais de Relatórios responderam `200`: pipeline, summary, executive, forecast, trends, funnel, timeline, segments, cities, origin, intelligence, leads, performance, operators e proposals.

### Persistência real controlada

| Operação | Status |
| --- | ---: |
| Criar papel personalizado temporário | 201 |
| Excluir papel personalizado temporário | 200 |
| Criar template de marketing temporário | 201 |
| Excluir template de marketing temporário | 200 |
| Criar comunicação temporária | 201 |
| Excluir comunicação temporária | 200 |

Após o teste, as três tabelas foram consultadas e não restou nenhum registro temporário.

## 3. Regressão autenticada

Foi usado login real do administrador no Supabase. A rota oficial `/api/auth/session` retornou `200` e emitiu os cookies HTTP-only esperados.

### Páginas autenticadas

- `/dashboard`: 200.
- `/app/dashboard`: 200.
- `/app/discovery`: 200.
- `/app/leads`: 200.
- `/companies`: 200.
- `/companies/{id}`: 200.
- `/app/leads/{id}`: 200.
- `/reports`: 200.
- `/app/settings`: 200.
- `/catalog`: 200.
- `/calendar`: 200.
- `/inbox`: 200.

### Ficha comercial

- Dados da empresa: 200.
- Contatos: 200.
- Tarefas: 200.
- Notas: 200.
- Atividades: 200.
- Comunicações: 200.
- Contratos: 200.
- Arquivos: 200.
- Proposta PDF: 200, `application/pdf`.

Não foram encontrados 404, 500, `PGRST205` ou `42703` nos fluxos validados.

## 4. Perfis

- Owner: leitura e mutação operacional aprovadas; acesso administrativo aprovado.
- Admin: login real aprovado; leitura, mutação e administração aprovadas.
- Operator: leitura e mutação operacional aprovadas; administração bloqueada com 403.
- Viewer: leitura aprovada; POST, PUT, PATCH e DELETE bloqueados com 403.
- Sem sessão: rotas protegidas bloqueadas com 401.

No cadastro atual existem um Admin ativo vinculado ao Supabase Auth e um Operator inativo. Como não existem contas reais ativas Owner e Viewer, esses perfis foram validados pela mesma camada de tokens assinados e middleware usada pela API, sem criar usuários de produção.

## 5. Builds e testes

- API lint/typecheck: APROVADO.
- API build: APROVADO.
- Testes de segurança Fase 1: APROVADOS, 11/11.
- Web lint/typecheck: APROVADO.
- Web build: APROVADO, 58 páginas geradas.

## Status final

AUTENTICAÇÃO: APROVADA

AUTORIZAÇÃO: APROVADA

SCHEMA: APROVADO

ENDPOINTS: APROVADOS

REGRESSÃO: APROVADA

LIBERADO PARA FASE 2: SIM

## Observações

- Nenhum deploy foi executado.
- Nenhum layout foi alterado.
- Nenhuma funcionalidade nova foi criada.
- Nenhum usuário de teste foi criado.
- Nenhum registro temporário permaneceu no banco.
