# Relatório Pré-Execução — Fase 2, Bloco 1

Data: 22/06/2026  
Branch: `fase-02-desenvolvimento`  
Escopo: Calendário e Agendamentos  
Deploy: não autorizado  
SQL em produção: não autorizado

## 1. Baseline

A Fase 1 está homologada em autenticação, autorização, schema, endpoints e regressão. O Bloco 1 reutilizará a sessão, a matriz Owner/Admin/Operator/Viewer e as entidades oficiais `nodere_workspaces`, `nodere_platform_users` e `nodere_companies`.

O calendário já possui uma implementação funcional parcial. Não será recriado; o trabalho deste bloco consiste em consolidar persistência, segurança dos vínculos, CRUD, intervalos de visualização, integração com CRM/lead e lembretes internos.

## 2. Estado atual encontrado

- A API `/api/calendar` está montada com sessão obrigatória.
- A tabela `public.calendar_events` já é a fonte persistente no Supabase.
- Existem operações GET, POST, PATCH e DELETE.
- A interface usa `react-big-calendar` e oferece mês, semana, dia e agenda.
- A ficha comercial inclui um mini calendário filtrado por `company_id`.
- Tarefas com vencimento podem criar eventos vinculados à empresa.
- Existem campos persistentes para responsável, criador e lembretes.
- Viewer está em modo de leitura; Owner/Admin/Operator podem criar e alterar conforme a guarda atual.

## 3. Lacunas identificadas

1. A consulta por período usa `start_at >= início` e `end_at <= fim`, excluindo eventos que atravessam os limites do intervalo.
2. Empresa, contato e operador recebidos pela API não são validados contra o workspace autenticado.
3. Um Operator pode enviar `assignedTo` de outro usuário diretamente pela API.
4. Datas inválidas ou término anterior ao início não possuem validação de domínio explícita.
5. PATCH e DELETE podem devolver sucesso inadequado ou erro técnico quando o evento não existe ou não pertence ao escopo.
6. A tela carrega todos os eventos quando não há filtros de data.
7. Lembretes do navegador dependem da aba aberta e não há uma central interna clara para eventos vencidos ou próximos.
8. Não existem testes automatizados específicos para regras de calendário.

## 4. Arquivos impactados

### Alteração prevista

- `apps/api/src/routes/calendar.ts`
- `apps/web/app/calendar/CalendarClient.tsx`
- `apps/web/lib/api.ts`
- `apps/api/package.json`

### Criação prevista

- `apps/api/src/tests/calendar.test.ts`
- `BLOCO_01_EXECUTADO.md` ao final

### Apenas referência, sem alteração prevista

- `apps/api/src/middleware/session.ts`
- `apps/api/src/server.ts`
- `apps/api/src/routes/operators.ts`
- `apps/web/app/companies/[id]/LeadOperations.tsx`
- `packages/database/block05_06_discovery_crm_existing_schema.sql`
- `packages/database/block08_commercial_calendar.sql`

## 5. Tabelas impactadas

### Leitura e escrita

- `public.calendar_events`

### Validação de relacionamento

- `public.nodere_companies`
- `public.company_contacts`
- `public.nodere_platform_users`

Não será criada tabela nova. Não será executado SQL. Os campos já existentes em `calendar_events` atendem ao escopo:

- `workspace_id`
- `company_id`
- `contact_id`
- `assigned_to`
- `created_by`
- `start_at`
- `end_at`
- `reminder_at`
- `reminder_minutes`
- `reminder_enabled`
- `metadata`

## 6. APIs impactadas

| Método | Endpoint | Ação prevista |
| --- | --- | --- |
| GET | `/api/calendar` | Corrigir sobreposição de período e validar filtros |
| POST | `/api/calendar` | Validar datas e vínculos; restringir responsável do Operator |
| PATCH | `/api/calendar/:id` | Validar escopo, datas e vínculos; retornar 404 controlado |
| DELETE | `/api/calendar/:id` | Confirmar exclusão dentro do workspace e retornar 404 quando aplicável |

Não serão criadas rotas de WhatsApp, Relatórios, CRM avançado, PWA, IA ou Discovery.

## 7. Componentes impactados

- `CalendarClient`: carregamento por intervalo visível, CRUD, filtros e central de lembretes.
- `CompanyMiniCalendar`: continuará reutilizando `CalendarClient` com filtro fixo da empresa.
- `LeadOperations`: continuará criando eventos pela API existente, sem mudança de contrato obrigatória.
- Tipos e funções de calendário em `apps/web/lib/api.ts`.

## 8. Regras de autorização

- Sem sessão: `401`.
- Viewer: leitura dentro do workspace; mutações retornam `403`.
- Operator: lê eventos próprios/criados por ele, cria para si e altera/exclui apenas eventos próprios ou atribuídos.
- Owner/Admin: leitura e gestão integral do calendário do workspace.
- Nenhuma requisição pode escolher outro `workspace_id`.

## 9. Plano de implementação

1. Tornar os schemas e validadores de calendário testáveis.
2. Validar intervalo, empresa, contato e responsável no backend.
3. Corrigir consulta de eventos sobrepostos.
4. Tornar PATCH e DELETE determinísticos para evento ausente ou fora do escopo.
5. Enviar o intervalo visível pela interface nas visões mensal e semanal.
6. Exibir lembretes internos vencidos/próximos e permitir conclusão ou adiamento.
7. Preservar notificações do navegador como recurso complementar.
8. Adicionar testes de datas, permissões e contrato das rotas.
9. Executar lint, typecheck, testes e builds de API e Web.

## 10. Critérios de homologação

- Evento persiste após recarregar a página.
- Criação, edição e exclusão funcionam dentro do workspace.
- Eventos sobrepostos ao início/fim da visão são carregados.
- Empresa e contato pertencem ao workspace e permanecem associados.
- Operator não atribui eventos a terceiros.
- Calendário global e mini calendário do lead mostram dados coerentes.
- Visões mensal e semanal carregam o intervalo correto.
- Lembretes internos aparecem e podem ser concluídos ou adiados.
- Viewer permanece somente leitura.
- API e Web compilam sem erro.
- Nenhum módulo fora do Bloco 1 é implementado.

## 11. Riscos e controles

| Risco | Controle |
| --- | --- |
| Divergência entre IDs de Auth e usuário da plataforma | Usar exclusivamente `session.userId`, que corresponde a `nodere_platform_users.id` |
| Evento associado a empresa de outro workspace | Validar `nodere_companies.id` e `workspace_id` antes de persistir |
| Contato associado à empresa errada | Validar `company_contacts` por workspace e company |
| Intervalo excessivo | Limitar consultas e enviar apenas a faixa visível |
| Lembrete duplicado no navegador | Manter timers por evento carregado e limpar no unmount/refresh |
| Regressão na ficha comercial | Preservar o contrato atual de `createCalendarEvent` e o filtro `company_id` |

## 12. Decisão pré-execução

O Bloco 1 pode ser implementado sem SQL e sem alterar entidades centrais. A execução deve permanecer nos arquivos listados e parar antes de deploy.
