# BLOCO 03 EXECUTADO - CRM AVANCADO

Data: 23/06/2026
Branch: fase-02-desenvolvimento
Deploy: nao executado
SQL em producao: nao executado

## Resumo

O Bloco 3 da Fase 2 foi executado com foco exclusivo em CRM avancado. O funil visual drag-and-drop foi preservado e passou a persistir metadados comerciais adicionais, historico estruturado de movimentacoes e indicadores consolidados no dashboard CRM.

## Itens implementados

- Funil visual drag-and-drop preservado.
- Movimentacao de leads entre etapas com persistencia de:
  - status
  - probabilidade de fechamento
  - temperatura do lead
  - proxima acao
  - ultimo contato quando aplicavel
  - motivo de perda quando a etapa for Perdido
- Historico completo de movimentacoes registrado em `communications`.
- Mapeamento backend dos campos ja existentes em `nodere_companies`:
  - `temperature`
  - `probability`
  - `deal_value`
  - `expected_close_date`
  - `lost_reason`
  - `next_action`
  - `owner_id`
- Cards do Kanban exibindo:
  - temperatura
  - probabilidade
  - ultimo contato
  - tempo parado na etapa
  - proxima acao
  - motivo de perda
- Dashboard CRM com:
  - valor total do pipeline
  - previsao de fechamento ponderada pela probabilidade
  - negocios por etapa
  - taxa de conversao por etapa
- Testes unitarios para inferencia de probabilidade e temperatura por etapa.

## Arquivos alterados

- `apps/api/package.json`
- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/crm.ts`
- `apps/api/src/routes/leads.ts`
- `apps/api/src/services/companyStore.ts`
- `apps/api/src/types.ts`
- `apps/api/src/tests/crm-advanced.test.ts`
- `apps/web/app/crm/CrmBoard.tsx`
- `apps/web/app/crm/CrmSwitcher.tsx`
- `apps/web/components/crm/LeadCard.tsx`
- `apps/web/lib/api.ts`
- `apps/web/lib/types.ts`
- `RELATORIO_PRE_EXECUCAO_BLOCO_03.md`

## APIs alteradas

- `PATCH /api/companies/:id/status`
- `PATCH /api/leads/:id/stage`
- `PATCH /api/crm/cards/bulk-stage`

## Tabelas impactadas

- `public.nodere_companies`
- `public.communications`

## SQL

Nenhum SQL novo foi gerado neste bloco. A migracao existente `packages/database/block03_crm_inteligente_existing_schema.sql` ja contem as colunas necessarias para o CRM avancado.

## Permissoes

- Owner: edicao operacional permitida.
- Admin: edicao operacional permitida.
- Operator: edicao operacional permitida conforme guardas homologadas.
- Viewer: leitura permitida e mutacao bloqueada pelas guardas da Fase 1.

## Testes executados

- `apps/api`: `npm run test:crm` - OK
- `apps/api`: `npm run lint` - OK
- `apps/api`: `npm run build` - OK
- `apps/api`: `npm run test:calendar` - OK
- `apps/api`: `npm run test:reports` - OK
- `apps/api`: `npm run test:phase1` - OK
- `apps/web`: `npm run build` - OK
- `apps/web`: `npm run lint` - OK apos regeneracao de `.next/types` pelo build

## Riscos encontrados

- Ambientes onde `block03_crm_inteligente_existing_schema.sql` nao tenha sido aplicado podem nao possuir as colunas avancadas em `nodere_companies`.
- O valor de pipeline usa `deal_value` quando preenchido e estimativa por score quando vazio.
- O motivo de perda em drag-and-drop usa prompt simples para manter o escopo pequeno; edicao rica permanece na ficha/negociacoes.

## Pendencias restantes

- Homologacao autenticada em navegador/produção nao executada porque este bloco nao autoriza deploy.
- Checkpoint Git do Bloco 3 deve ser criado somente se aprovado pelo usuario.

## Status final

- CRM avancado: OK
- Blocos 1 e 2 preservados: OK
- Deploy: NAO EXECUTADO
- SQL producao: NAO EXECUTADO
- Pronto para Bloco 4: SIM

