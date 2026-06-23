# RELATORIO PRE-EXECUCAO - FASE 2 BLOCO 3

Data: 23/06/2026
Branch obrigatoria: fase-02-desenvolvimento
Escopo: CRM avancado

## Contexto

A Fase 1 esta homologada e os Blocos 1 e 2 da Fase 2 foram preservados. Este bloco executa somente melhorias de CRM avancado, sem iniciar Mobile/PWA, IA/Discovery avancado ou outros blocos.

## Divergencia de numeracao

O arquivo PLANO_EXECUCAO_FASE_02.md lista CRM avancado como Bloco 4, mas o comando operacional atual define Fase 2 Bloco 3 como CRM AVANCADO. A execucao segue o comando mais recente do usuario.

## Arquivos impactados

- apps/api/src/services/companyStore.ts
- apps/api/src/routes/leads.ts
- apps/api/src/routes/companies.ts
- apps/api/src/routes/crm.ts
- apps/api/src/types.ts
- apps/api/src/tests/crm-advanced.test.ts
- apps/api/package.json
- apps/web/lib/types.ts
- apps/web/lib/api.ts
- apps/web/app/crm/CrmBoard.tsx
- apps/web/app/crm/CrmSwitcher.tsx
- components CRM compartilhados, se estritamente necessario

## APIs impactadas

- GET /api/crm/cards
- PATCH /api/crm/cards/bulk-stage
- PATCH /api/leads/:id/stage
- PATCH /api/companies/:id/status
- PATCH /api/companies/:id
- GET /api/leads/:id/activities
- POST /api/leads/:id/activities

## Tabelas impactadas

- public.nodere_companies
  - Colunas ja previstas na migracao existente: temperature, probability, deal_value, expected_close_date, lost_reason, next_action, owner_id, last_contact_at, digital_signals.
- public.communications
  - Usada para historico completo de movimentacoes e interacoes.
- public.company_contracts
  - Usada para negociacoes ja existentes.

## Componentes impactados

- Kanban CRM em apps/web/app/crm/CrmBoard.tsx
- Resumo e lista CRM em apps/web/app/crm/CrmSwitcher.tsx
- Cards de lead em components/crm/LeadCard.tsx, se necessario
- Tipos compartilhados em apps/web/lib/types.ts e apps/api/src/types.ts

## Lacunas encontradas

- O drag-and-drop ja existe, mas a atualizacao de etapa salva apenas status basico.
- Metadados comerciais existem no SQL, mas nem todos sao mapeados entre Supabase, API e frontend.
- O historico de movimentacoes existe em communications no endpoint /api/leads/:id/stage, mas precisa receber motivo, probabilidade, temperatura, proxima acao e motivo de perda.
- O dashboard do CRM mostra contadores basicos, mas nao exibe valor total do pipeline, forecast, negocios por etapa e conversao por etapa de forma consolidada.
- A lista e o kanban nao exibem de forma consistente probabilidade, temperatura, ultimo contato, proxima acao, motivo de perda e tempo parado na etapa.

## Estrategia de execucao

- Reutilizar nodere_companies como fonte unica de verdade.
- Persistir campos avancados nas colunas ja existentes quando disponiveis.
- Guardar metadados extras em digital_signals sem criar tabela paralela.
- Registrar movimentacoes em communications com metadata estruturado.
- Manter permissoes existentes: owner/admin/operator editam; viewer apenas leitura pelas guardas ja homologadas.
- Nao gerar SQL novo neste bloco, pois a migracao existente block03_crm_inteligente_existing_schema.sql ja contem as colunas necessarias.

## Riscos

- Ambientes sem colunas atualizadas podem exigir aplicar/reaplicar block03_crm_inteligente_existing_schema.sql.
- Campos extras em digital_signals dependem do mapeamento correto em companyStore.
- Dashboard de CRM usa estimativas quando deal_value/probability nao estiverem preenchidos.

## Criterios de saida

- Funil visual drag-and-drop preservado.
- Movimentacao de etapa persiste status e historico.
- Probabilidade, temperatura, proxima acao, ultimo contato, tempo parado e motivo de perda aparecem no CRM.
- Dashboard CRM mostra pipeline, forecast, negocios por etapa e conversao por etapa.
- Testes CRM, lint e builds API/Web aprovados.

