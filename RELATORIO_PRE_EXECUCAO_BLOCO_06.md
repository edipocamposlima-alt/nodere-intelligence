# RELATÓRIO PRÉ-EXECUÇÃO — FASE 2 BLOCO 6

Data: 23/06/2026  
Branch: `fase-02-desenvolvimento`  
Escopo: Bloco 6 — IA e Discovery Avançado  
Status inicial: árvore Git limpa após checkpoint do Bloco 5.

## Objetivo

Executar exclusivamente o Bloco 6 do `PLANO_EXECUCAO_FASE_02.md`, reforçando IA comercial e Discovery avançado sem alterar funcionalidades dos Blocos 1, 2, 3, 4 e 5.

## Arquivos impactados previstos

| Área | Arquivos |
| --- | --- |
| API Discovery | `apps/api/src/routes/discovery.ts`, `apps/api/src/routes/searches.ts` |
| API IA | `apps/api/src/routes/ai.ts`, `apps/api/src/services/ai.ts`, `apps/api/src/services/openai.ts` |
| API CRM/Companies | `apps/api/src/routes/companies.ts`, `apps/api/src/routes/crm.ts` |
| Serviços de score | `apps/api/src/services/scoring.ts`, `apps/api/src/services/websiteScanner.ts` |
| Tipos API | `apps/api/src/types.ts` |
| Frontend Discovery | `apps/web/app/discovery/page.tsx`, `apps/web/components/discovery/*` |
| Frontend CRM/Ficha | `apps/web/app/companies/[id]/LeadOperations.tsx`, `apps/web/app/crm/*` |
| Cliente API web | `apps/web/lib/api.ts`, `apps/web/lib/types.ts` |
| Testes | `apps/api/src/tests/*`, `apps/web/scripts/*` quando necessário |

## APIs impactadas previstas

| API | Finalidade |
| --- | --- |
| `POST /api/discovery/search` | Busca e priorização de leads |
| `POST /api/discovery/score` | Score de presença digital |
| `GET /api/discovery/details/:placeId` | Enriquecimento por placeId |
| `POST /api/ai/*` | Diagnóstico, abordagem, proposta, follow-up e resumo |
| `POST /api/companies/:id/diagnosis` | Diagnóstico e insights por lead |
| `GET /api/companies/:id` | Exibição dos campos de score/recomendação |
| `PATCH /api/companies/:id` | Atualização segura de insights e temperatura |
| `GET /api/crm/leads` | Listagem com score/recomendação quando disponível |

## Tabelas impactadas previstas

| Tabela | Uso |
| --- | --- |
| `nodere_companies` | Score, temperatura, oportunidade, sinais comerciais e recomendação |
| `nodere_company_activities` | Registro histórico de insights e ações da IA |
| `nodere_ai_usage_log` | Uso de IA/tokens, se disponível no schema |
| `nodere_discovery_runs` | Histórico de buscas Discovery, se disponível no schema |
| `nodere_workspace_settings` | Credencial/estado de integração OpenAI |

## Serviços impactados previstos

| Serviço | Impacto |
| --- | --- |
| `ai.ts` | Geração controlada de textos e fallback quando provedor falhar |
| `openai.ts` | Chamada segura via backend |
| `scoring.ts` | Regras de presença digital e maturidade |
| `websiteScanner.ts` | Sinais digitais usados no score |
| `companyStore.ts` | Persistência/consulta de dados de empresa |

## Integrações impactadas previstas

| Integração | Regra |
| --- | --- |
| OpenAI | Usar apenas no backend; erro amigável quando ausente/sem crédito |
| Google Places/Maps | Preservar busca existente; enriquecer contexto quando disponível |
| PageSpeed/Website Scanner | Usar sinais para score sem bloquear fluxo |
| Supabase | Não executar SQL em produção; usar somente schema existente |

## Riscos antes da execução

- Campos de insights podem não existir em todas as instalações; a implementação deve usar `metadata` ou campos já existentes quando possível.
- OpenAI pode não estar configurada; o fluxo precisa retornar fallback controlado e não mascarar erro real.
- Não deve haver envio de chaves ao frontend.
- Não deve haver migração automática.

## Critérios de validação

- `npm run lint` em `apps/web`.
- `npm run build` em `apps/web`.
- `npm run build` em `apps/api`.
- Testes de IA/Discovery.
- Regressão estrutural dos Blocos 1, 2, 3, 4 e 5.

## Fora de escopo

- Deploy.
- SQL em produção.
- Bloco ou fase nova.
- Alterações em calendário, relatórios, WhatsApp, mobile/PWA, layout ou billing fora do necessário para integração de IA/Discovery.
