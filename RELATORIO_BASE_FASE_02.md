# Relatório Base para Início da Fase 2

Data: 22/06/2026  
Branch ativa: `fase-02-desenvolvimento`  
Base: estado homologado da Fase 1  
Deploy nesta etapa: não executado  
SQL nesta etapa: não executado

## 1. Status de entrada

| Área | Status homologado |
| --- | --- |
| Autenticação | APROVADA |
| Autorização | APROVADA |
| Schema | APROVADO |
| Endpoints | APROVADOS |
| Regressão | APROVADA |
| Liberação para Fase 2 | SIM |

A homologação definitiva está registrada em `HOMOLOGACAO_FINAL_POS_MIGRACAO_FASE_01.md`. Relatórios anteriores à aplicação da migração são mantidos apenas como histórico e não substituem esse resultado final.

## 2. Funcionalidades estabilizadas

### Autenticação e sessão

- Login real via Supabase Auth.
- Conversão da sessão Supabase para sessão da API.
- Access token e refresh token validados.
- Cookies HTTP-only `nodere_session` e `nodere-session` emitidos pela rota oficial.
- Persistência de sessão e proteção das rotas web.
- Respostas `401` reservadas para ausência ou expiração de sessão.

### Autorização e perfis

- Owner com acesso operacional e administrativo.
- Admin com acesso operacional e administrativo.
- Operator com acesso operacional e bloqueio administrativo.
- Viewer com leitura e bloqueio de POST, PUT, PATCH e DELETE.
- Respostas `403` aplicadas para sessão válida sem permissão.
- Workspace obtido da sessão, sem aceitar injeção por header externo.

### Schema e isolamento

- Runtime padronizado para `nodere_workspaces`, `nodere_platform_users` e `nodere_companies`.
- Dependências ativas de `workspaces`, `workspace_members`, `users` e `companies` genéricos eliminadas.
- Tabelas especializadas da Fase 1 criadas ou reconciliadas.
- RLS por `workspace_id` validado nas tabelas migradas.
- Nenhuma exposição de registros com acesso anônimo.
- Nenhum `PGRST205`, `42703` ou erro de schema cache nos fluxos homologados.

### API operacional

- Companies e CRM.
- Inbox.
- Marketing e templates.
- Operators.
- Settings e integrações.
- AI e Intelligence.
- Sequences.
- Credits.
- Communications.
- Contracts.
- Files.
- Audit.
- Proposals e PDF.
- Dashboard.
- Reports.
- Catalog.
- Calendar.

### Regressão autenticada

- Dashboard principal e rota `/app/dashboard`.
- Discovery.
- Leads e ficha comercial.
- Empresas e ficha 360 graus.
- Relatórios.
- Configurações.
- Catálogo.
- Calendário.
- Inbox.
- Contatos, tarefas, notas, atividades, comunicações, contratos e arquivos.
- Proposta PDF com resposta `application/pdf`.

## 3. Arquivos alterados na Fase 1

### Segurança, sessão e servidor

- `apps/api/src/middleware/session.ts`
- `apps/api/src/services/adminSession.ts`
- `apps/api/src/server.ts`
- `apps/api/src/utils/supabaseErrors.ts`
- `apps/api/src/tests/phase1-security.test.ts`
- `apps/api/package.json`

### Rotas da API

- `apps/api/src/routes/admin.ts`
- `apps/api/src/routes/ai.ts`
- `apps/api/src/routes/audit.ts`
- `apps/api/src/routes/catalog.ts`
- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/credits.ts`
- `apps/api/src/routes/crm.ts`
- `apps/api/src/routes/inbox.ts`
- `apps/api/src/routes/leads.ts`
- `apps/api/src/routes/marketing.ts`
- `apps/api/src/routes/operators.ts`
- `apps/api/src/routes/proposals.ts`
- `apps/api/src/routes/sequences.ts`
- `apps/api/src/routes/settings.ts`
- `apps/api/src/routes/workspace.ts`

### Serviços da API

- `apps/api/src/services/onboardingStore.ts`
- `apps/api/src/services/userStore.ts`

### Sessão e integração do frontend

- `apps/web/app/api/auth/me/route.ts`
- `apps/web/app/login/LoginClient.tsx`
- `apps/web/context/AuthProvider.tsx`
- `apps/web/contexts/WorkspaceContext.tsx`
- `apps/web/lib/adminAuth.ts`
- `apps/web/lib/api.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.ts`

O worktree contém outras alterações locais de etapas anteriores, incluindo CMS e interface. Elas foram preservadas, mas não fizeram parte da homologação crítica da Fase 1 e devem ter escopo separado antes de qualquer commit da Fase 2.

## 4. Tabelas criadas ou ajustadas

### Tabelas centrais preservadas

- `nodere_workspaces`: colunas operacionais, trial, créditos, onboarding, segmentos e white-label ajustadas.
- `nodere_platform_users`: vínculo com Supabase Auth e perfis preservados.
- `nodere_companies`: entidade oficial de empresas e leads preservada.

### Tabelas especializadas homologadas

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

### Controles aplicados

- Índices por workspace e campos de consulta crítica.
- RLS nas tabelas especializadas.
- Relacionamentos compatíveis com dados históricos.
- Migração incremental, sem exclusão de dados e sem tabelas paralelas de usuários, workspaces ou empresas.

## 5. Endpoints validados

### Núcleo operacional

- `GET /api/companies`
- `GET /api/crm/leads`
- `GET /api/inbox`
- `GET /api/marketing`
- `GET /api/operators`
- `GET /api/settings`
- `GET /api/ai`
- `GET /api/sequences`
- `GET /api/credits`
- `GET /api/communications`
- `GET /api/contracts`
- `GET /api/files`
- `GET /api/intelligence/summary`
- `GET /api/proposals`
- `GET /api/dashboard`
- `GET /api/catalog`
- `GET /api/calendar`

### Endpoints administrativos

- `GET /api/audit`
- `GET /api/admin/roles`
- `GET /api/settings/integrations`

Owner e Admin receberam `200`. Operator e Viewer receberam `403` nas áreas administrativas. Todas as rotas protegidas receberam `401` sem sessão.

### Relatórios

Foram validados com `200`: pipeline, summary, executive, forecast, trends, funnel, timeline, segments, cities, origin, intelligence, leads, performance, operators e proposals.

### Ficha comercial

- `GET /api/companies/{id}`
- `GET /api/companies/{id}/contacts`
- `GET /api/companies/{id}/tasks`
- `GET /api/companies/{id}/notes`
- `GET /api/companies/{id}/communications`
- `GET /api/companies/{id}/contracts`
- `GET /api/companies/{id}/files`
- `GET /api/leads/{id}/activities`
- `GET /api/leads/{id}/contacts`
- `GET /api/crm/leads/{id}/proposal.pdf`

### Persistência controlada

- Criação e exclusão de papel personalizado: `201/200`.
- Criação e exclusão de template de marketing: `201/200`.
- Criação e exclusão de comunicação: `201/200`.
- Nenhum registro temporário permaneceu no banco.

## 6. Pendências para a Fase 2

As pendências abaixo são candidatas de recuperação operacional. O escopo definitivo deve ser confirmado pelas instruções formais da Fase 2 antes de qualquer implementação.

1. Consolidar fluxos completos de CRM além da estabilização técnica: criação, edição, movimentação e histórico.
2. Homologar Discovery com integrações externas reais e tratamento de indisponibilidade.
3. Completar contratos, propostas e arquivos com operações funcionais, não apenas leitura e schema.
4. Validar Inbox e Marketing em cenários completos de criação, atualização, envio e auditoria.
5. Revisar Relatórios com dados reais, filtros e consistência entre métricas.
6. Definir cobertura de testes automatizados de integração para Supabase e APIs externas.
7. Separar alterações locais anteriores por domínio antes de preparar commits da Fase 2.
8. Criar contas de homologação reais para Owner, Operator e Viewer, caso a Fase 2 exija testes end-to-end por login real.
9. Validar constraints `NOT VALID` depois do saneamento dos dados históricos.
10. Atualizar documentação intermediária que ainda descreve o schema anterior à migração.

Não estão autorizados neste momento: implementação, SQL, deploy, alterações de layout ou início automático de qualquer item acima.

## 7. Riscos antes de novas funcionalidades

| Risco | Impacto | Controle recomendado |
| --- | --- | --- |
| Worktree amplo e não commitado | Mistura de Fase 1, CMS e alterações antigas | Definir escopo e checkpoint antes do primeiro commit da Fase 2 |
| Ausência de Owner e Viewer reais | Limita teste end-to-end por login desses perfis | Criar usuários de homologação somente com autorização explícita |
| Operator cadastrado inativo | Não permite homologação real desse perfil | Ativar ou criar usuário dedicado somente quando autorizado |
| Constraints históricas `NOT VALID` | Dados antigos podem conter referências inconsistentes | Auditar e validar constraints em migração separada |
| Dependências externas | Google, OpenAI, SMTP, WhatsApp e Stripe podem falhar por credencial/configuração | Testar cada integração com fallback controlado e sem expor chaves |
| Arquivos SQL históricos legados | Execução acidental pode recriar dependências genéricas | Marcar como históricos e usar apenas migrações aprovadas |
| Produção não recebeu estas alterações locais | Homologação atual não equivale a deploy | Manter preview e produção bloqueados até a fase de publicação autorizada |
| Fallback vazio em ausência de schema | Pode ocultar indisponibilidade se monitoramento for insuficiente | Adicionar observabilidade e alertas sem alterar o contrato da API |

## 8. Baseline técnico

- Branch de desenvolvimento: `fase-02-desenvolvimento`.
- Branch de origem homologada: `stabilization-phase-01`.
- Branch `recovery-production-2026-06-11`: não alterada.
- Supabase pós-migração: homologado.
- API lint/typecheck: aprovado.
- API build: aprovado.
- Testes de segurança: 11/11 aprovados.
- Web lint/typecheck: aprovado.
- Web build: aprovado, 58 páginas.
- Deploy: não executado.

## 9. Critério para iniciar implementação

A Fase 2 pode ser iniciada tecnicamente, mas somente após receber um comando de execução com escopo explícito. Cada bloco deverá preservar a baseline da Fase 1, evitar tabelas paralelas, rodar builds e testes e parar antes de SQL ou deploy quando esses atos não estiverem expressamente autorizados.
