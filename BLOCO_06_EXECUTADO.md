# BLOCO 06 EXECUTADO — IA e Discovery Avançado

Data: 23/06/2026  
Branch: `fase-02-desenvolvimento`  
Escopo: Fase 2 — Bloco 6, IA e Discovery Avançado  
Status: concluído localmente, sem deploy e sem SQL em produção.

## Itens implementados

| Item | Status |
| --- | --- |
| Análise de presença digital | OK |
| Score comercial da empresa | OK |
| Classificação de oportunidade | OK |
| Identificação de baixa maturidade digital | OK |
| Priorização de leads | OK |
| Sinais de oportunidade comercial | OK |
| Resumo automático da empresa | OK |
| Recomendação de abordagem | OK |
| Geração de diagnóstico comercial com fallback | OK |
| Sugestão de primeira abordagem | OK |
| Sugestão de follow-up | OK |
| Sugestão de proposta | OK |
| Resumo do histórico do lead | OK |
| Próximos passos recomendados | OK |
| Classificação de temperatura do lead | OK |
| Insight exibido no Discovery | OK |
| Insight persistido na ficha do lead | OK |
| Registro de insight no histórico | OK |
| Registro tolerante em `nodere_ai_usage_log` | OK |

## Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `apps/api/src/services/commercialInsights.ts` | Novo serviço de insight comercial com fallback determinístico, prompt seguro e parser de retorno IA. |
| `apps/api/src/routes/ai.ts` | Nova rota `POST /api/ai/commercial-insights`, persistência opcional no lead, registro em histórico e log de uso de IA. |
| `apps/api/src/services/scoring.ts` | Score enriquecido com análise de presença digital, sinais, temperatura, prioridade e próximos passos. |
| `apps/api/src/types.ts` | Tipos de empresa ampliados para campos de insights. |
| `apps/api/src/tests/ai-discovery.test.ts` | Testes de score avançado e fallback de insight comercial. |
| `apps/api/package.json` | Script `test:ai-discovery`. |
| `apps/web/lib/api.ts` | Cliente `generateCommercialInsights` e tipo `CommercialInsight`. |
| `apps/web/lib/types.ts` | Tipos de empresa ampliados para insights. |
| `apps/web/components/discovery/CompanyCard.tsx` | Botão `Insight IA` e exibição de resumo, classificação, abordagem e próximo passo. |
| `apps/web/app/companies/[id]/LeadOperations.tsx` | Botão `Insight comercial` na aba IA; persiste insight e registra no histórico do lead. |
| `RELATORIO_PRE_EXECUCAO_BLOCO_06.md` | Relatório pré-execução com mapeamento de impacto. |

## APIs alteradas

| API | Status |
| --- | --- |
| `POST /api/ai/commercial-insights` | Criada |
| `POST /api/discovery/opportunities` | Reforçada via score enriquecido |
| `POST /api/discovery/search` | Reforçada indiretamente via score enriquecido |
| `POST /api/discovery/add-to-crm` | Reforçada indiretamente via score enriquecido |
| `POST /api/companies/:id/diagnosis` | Preservada |
| `GET /api/companies/:id/communications` | Preservada e usada para exibir histórico do insight |

## Integrações impactadas

| Integração | Tratamento |
| --- | --- |
| OpenAI/Anthropic | Usados apenas no backend via `callAI`; fallback determinístico quando ausente, sem expor chave. |
| Supabase | Atualização de campos existentes e registro em `communications`; `nodere_ai_usage_log` best-effort. |
| Google Places/Discovery | Fluxo preservado; score enriquecido usa sinais já retornados. |
| Website Scanner | Sinais de site continuam alimentando score e análise. |

## Testes executados

| Comando | Resultado |
| --- | --- |
| `npm run test:ai-discovery` em `apps/api` | OK |
| `npm run build` em `apps/api` | OK |
| `npm run lint` em `apps/web` | OK |
| `npm run build` em `apps/web` | OK |
| `npm run test:phase1` em `apps/api` | OK |
| `npm run test:calendar` em `apps/api` | OK |
| `npm run test:reports` em `apps/api` | OK |
| `npm run test:crm` em `apps/api` | OK |
| `npm run test:whatsapp` em `apps/api` | OK |
| `npm run test:mobile-pwa` em `apps/web` | OK |

## Permissões

| Perfil | Status |
| --- | --- |
| Owner | Mutação IA permitida |
| Admin | Mutação IA permitida |
| Operator | Mutação IA permitida |
| Viewer | Bloqueado para mutação pela guarda existente |

## Riscos encontrados

- O log em `nodere_ai_usage_log` é tolerante para preservar compatibilidade com ambientes onde a tabela ainda não exista.
- A análise com IA real depende das variáveis do provedor configuradas no backend; sem provedor, o sistema retorna fallback comercial controlado.
- A persistência de campos avançados no lead usa colunas existentes e `digital_signals` quando aplicável; não houve criação automática de schema.

## Pendências restantes

- Homologação autenticada em ambiente de produção após deploy autorizado.
- Validação com credencial real de OpenAI/Anthropic para confirmar resposta do provedor além do fallback.
- Revisão de métricas reais de tokens caso o provedor passe a retornar usage detalhado.

## Observações

- Não houve deploy.
- Não houve execução de SQL em produção.
- Não foi criada nova fase.
- Não foram alteradas funcionalidades dos Blocos 1, 2, 3, 4 e 5 fora da regressão necessária.
