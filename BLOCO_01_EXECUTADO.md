# Fase 2 — Bloco 1 Executado

Data: 22/06/2026  
Branch: `fase-02-desenvolvimento`  
Módulo: Calendário e Agendamentos  
Deploy: não executado  
SQL em produção: não executado

## 1. Escopo executado

O trabalho permaneceu exclusivamente no módulo Calendário e Agendamentos. WhatsApp, Relatórios, CRM avançado, Mobile/PWA, IA e Discovery avançado não foram iniciados.

## 2. Funcionalidades implementadas e consolidadas

### Calendário persistente

- `public.calendar_events` permanece como fonte única de verdade.
- A listagem consulta o Supabase pelo `workspace_id` da sessão.
- A tela envia o intervalo atualmente visível e deixa de carregar todo o histórico sem necessidade.
- Eventos que atravessam o início ou fim do período agora são incluídos corretamente pela regra de sobreposição.

### Criação de eventos

- Datas, título, tipo, prioridade, status e lembretes são validados.
- O término deve ser posterior ao início.
- Empresa/lead, contato e operador são validados no workspace antes da gravação.
- Operator sempre cria evento atribuído a si, mesmo que tente enviar outro `assignedTo` pela API.

### Edição de eventos

- Owner/Admin podem editar eventos do workspace.
- Operator edita somente evento criado por ele ou atribuído a ele.
- Viewer permanece somente leitura.
- Alterações de empresa, contato e operador passam novamente pela validação de relacionamento.
- Evento inexistente retorna `404` controlado.

### Exclusão de eventos

- A exclusão valida workspace e propriedade/atribuição do Operator.
- Evento inexistente retorna `404`.
- Viewer recebe `403` pela guarda de mutação existente.

### Associação ao CRM e ao lead

- `nodere_companies` continua sendo a entidade oficial para empresa e lead.
- A API aceita `companyId` e o alias `leadId`, sem criar entidade paralela.
- O mini calendário da ficha comercial continua filtrado por `company_id`.
- Tarefas com vencimento continuam podendo criar evento vinculado à empresa.
- Contato vinculado deve pertencer à mesma empresa e ao mesmo workspace.

### Visualizações mensal e semanal

- As visões mês e semana foram preservadas e passam a consultar sua faixa visível.
- As visões dia e agenda existentes também foram preservadas.
- Mudanças de navegação atualizam `start` e `end` na API.

### Lembretes internos

- Foi criada uma central de lembretes vencidos e das próximas 24 horas.
- O usuário autorizado pode adiar o lembrete por 15 minutos.
- O usuário autorizado pode marcar o compromisso como realizado.
- Os campos `reminder_at`, `reminder_minutes` e `reminder_enabled` continuam persistidos.
- Notificações do navegador foram preservadas como complemento, não como fonte de verdade.

## 3. Arquivos alterados

- `apps/api/package.json`
- `apps/api/src/routes/calendar.ts`
- `apps/web/app/calendar/CalendarClient.tsx`
- `apps/web/lib/api.ts`

## 4. Arquivos criados

- `apps/api/src/tests/calendar.test.ts`
- `RELATORIO_PRE_EXECUCAO_BLOCO_01.md`
- `BLOCO_01_EXECUTADO.md`

O arquivo `PLANO_EXECUCAO_FASE_02.md`, criado na etapa anterior de planejamento, permanece pendente no worktree e não foi modificado funcionalmente por este bloco.

## 5. Tabelas utilizadas

### Persistência

- `public.calendar_events`

### Validação de relacionamento

- `public.nodere_companies`
- `public.company_contacts`
- `public.nodere_platform_users`

Nenhuma tabela foi criada, removida ou alterada. Nenhum SQL foi executado.

## 6. APIs consolidadas

| Método | Endpoint | Resultado |
| --- | --- | --- |
| GET | `/api/calendar` | Filtros validados e período por sobreposição |
| POST | `/api/calendar` | Criação persistente com validação de workspace |
| PATCH | `/api/calendar/:id` | Edição com autorização e `404` controlado |
| DELETE | `/api/calendar/:id` | Exclusão com autorização e confirmação real |

## 7. Testes executados

### Testes do calendário

Comando: `npm run test:calendar`  
Resultado: **5/5 aprovados**

- Intervalo válido e intervalo invertido.
- Data inválida e divergência entre lead e empresa.
- Permissão Owner/Admin.
- Escopo de mutação do Operator e bloqueio do Viewer.
- Consulta por sobreposição e uso das entidades oficiais.

### Regressão da Fase 1

Comando: `npm run test:phase1`  
Resultado: **11/11 aprovados**

### Lint e TypeScript

- API `npm run lint`: **OK**
- Web `npm run lint`: **OK**
- API typecheck: **OK**
- Web typecheck: **OK**
- `git diff --check`: **OK**

### Builds

- API `npm run build`: **OK**
- Web `npm run build`: **OK**
- Next.js: 58 páginas geradas; `/calendar` e `/calendario` compiladas.

## 8. Validação local

- Servidor Web local: `http://localhost:3011`.
- Acesso anônimo a `/calendar`: `307` para `/login?next=%2Fcalendar`, conforme proteção esperada.
- O servidor iniciou sem erro de compilação.
- A automação visual do navegador não iniciou porque o runner do Windows recusou a criação do processo. Não foi usado workaround e nenhum resultado visual foi marcado como aprovado sem evidência.

## 9. Checklist

| Item | Status | Evidência |
| --- | --- | --- |
| Branch correta | OK | `fase-02-desenvolvimento` |
| Calendário persistente | OK técnico | API usa `calendar_events`; build e tipos aprovados |
| Criação | OK técnico | POST consolidado e validado |
| Edição | OK técnico | PATCH com autorização, vínculos e 404 |
| Exclusão | OK técnico | DELETE com autorização e confirmação |
| Associação CRM | OK técnico | `company_id` validado em `nodere_companies` |
| Associação ao lead | OK técnico | Lead usa a entidade oficial `nodere_companies` |
| Visão mensal | OK técnico | Componente compilado e faixa visível integrada |
| Visão semanal | OK técnico | Componente compilado e faixa visível integrada |
| Lembretes internos | OK técnico | Central, adiamento e conclusão implementados |
| Viewer somente leitura | OK | Guarda existente e testes de permissão |
| Operator limitado ao próprio escopo | OK | Regra e testes específicos |
| Owner/Admin com gestão do workspace | OK | Regra e testes específicos |
| Persistência autenticada contra banco real | PENDENTE CONTROLADO | Não foi feita mutação em ambiente externo nesta etapa |
| Validação visual autenticada | PENDENTE CONTROLADO | Browser local bloqueado pelo runner do Windows |
| API build | OK | TypeScript compilado |
| Web build | OK | Next.js compilado |
| Deploy | NÃO EXECUTADO | Conforme instrução |
| SQL em produção | NÃO EXECUTADO | Conforme instrução |

## 10. Pendências e riscos restantes

1. Executar homologação autenticada manual ou automatizada em navegador funcional para criar, editar, excluir e recarregar um evento real.
2. Validar visualmente mês e semana em desktop e mobile durante a homologação, sem iniciar o Bloco Mobile/PWA.
3. Confirmar notificações do navegador em um contexto seguro que permita a permissão `Notification`.
4. Não avançar para WhatsApp ou qualquer outro bloco sem nova instrução.

## 11. Status final

Implementação técnica do **Bloco 1 — Calendário e Agendamentos** concluída, com builds e testes aprovados. Deploy e SQL não foram executados. A homologação autenticada visual permanece pendente controlada e deve ocorrer antes de publicação.
