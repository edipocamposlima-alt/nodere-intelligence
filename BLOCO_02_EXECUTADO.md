# Bloco 02 Executado — Fase 2

Data: 22/06/2026  
Branch: `fase-02-desenvolvimento`  
Escopo executado: Relatórios e Exportações  
Deploy: não executado  
SQL em produção: não executado

## 1. Resumo

O Bloco 2 foi implementado exclusivamente no módulo de Relatórios e Exportações. A tela de relatórios passou a consumir um contrato consolidado no backend, com filtros aplicados antes do cálculo dos indicadores e reaproveitados nas exportações CSV/PDF.

O Calendário homologado no Bloco 1 não foi alterado.

## 2. Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `apps/api/src/services/reports.ts` | Adicionado contrato consolidado, normalização de filtros, cálculo dos indicadores, escopo por perfil e geração CSV |
| `apps/api/src/routes/reports.ts` | Adicionados `GET /api/reports/dashboard`, `GET /api/reports/export.csv` e PDF com filtros compartilhados |
| `apps/api/package.json` | Adicionado script `test:reports` |
| `apps/api/src/tests/reports.test.ts` | Testes de filtros, escopo de operador e sanitização/exportação CSV |
| `apps/web/lib/api.ts` | Tipos e clientes para dashboard, CSV e PDF filtrados |
| `apps/web/app/reports/ReportsClient.tsx` | Tela de relatórios conectada ao endpoint consolidado, filtros e exportações reais |
| `RELATORIO_PRE_EXECUCAO_BLOCO_02.md` | Relatório pré-execução do bloco |

## 3. APIs alteradas

| Método | Endpoint | Status |
| --- | --- | --- |
| GET | `/api/reports/dashboard` | Criado |
| GET | `/api/reports/export.csv` | Criado |
| POST | `/api/reports/pdf` | Atualizado para usar filtros e indicadores consolidados |
| GET | `/api/reports/*` legados | Preservados para compatibilidade |

## 4. Tabelas impactadas

Somente leitura e registro de auditoria de download, sem migração de banco:

| Tabela | Uso |
| --- | --- |
| `public.nodere_companies` | Base principal dos leads/empresas e funil |
| `public.user_metrics` | Atividades realizadas no período |
| `public.nodere_platform_users` | Opções e ranking de operadores |
| `public.download_logs` | Registro de exportação CSV/PDF |

Nenhuma tabela foi criada, alterada ou removida.

## 5. Funcionalidades implementadas

| Item | Status |
| --- | --- |
| Filtro por período | OK |
| Filtro por operador | OK |
| Filtro por empresa | OK |
| Filtro por status | OK |
| Filtro por origem | OK |
| Leads criados | OK |
| Leads convertidos | OK |
| Taxa de conversão | OK |
| Oportunidades em aberto | OK |
| Negócios ganhos | OK |
| Negócios perdidos | OK |
| Atividades realizadas | OK |
| Exportação CSV no backend | OK |
| Exportação PDF com filtros | OK |
| Proteção contra fórmula em CSV | OK |
| Escopo de Operator no backend | OK |
| Viewer sem mutações pela regressão da Fase 1 | OK |

## 6. Testes executados

| Comando | Status |
| --- | --- |
| `apps/api npm run lint` | OK |
| `apps/api npm run test:reports` | OK |
| `apps/api npm run test:calendar` | OK |
| `apps/api npm run test:phase1` | OK |
| `apps/api npm run build` | OK |
| `apps/web npm run lint` | OK |
| `apps/web npm run build` | OK |

## 7. Validação de permissões

| Perfil | Resultado |
| --- | --- |
| Owner | OK — acesso operacional preservado |
| Admin | OK — acesso operacional preservado |
| Operator | OK — escopo de relatórios forçado para o próprio usuário |
| Viewer | OK — leitura preservada e mutações bloqueadas pela regressão da Fase 1 |

## 8. Riscos encontrados

| Risco | Tratamento |
| --- | --- |
| Empresas antigas sem operador explícito | Owner/Admin/Viewer conseguem ver no workspace; Operator só vê registros associados ao próprio usuário |
| Atividades históricas ausentes em `user_metrics` | Indicador retorna zero quando não houver eventos, sem quebrar o relatório |
| Endpoints legados ainda possuem contratos antigos | Tela principal passou a usar `/api/reports/dashboard`; endpoints legados foram preservados por compatibilidade |

## 9. Pendências restantes

- Homologação visual/manual em ambiente autenticado ainda não executada nesta etapa, pois deploy não foi autorizado.
- Dados históricos só aparecem como atividades realizadas quando já houver eventos persistidos em `user_metrics`.
- Bloco 3 não iniciado.

## 10. Checklist final

| Item | Status |
| --- | --- |
| Não iniciar Bloco 3 | OK |
| Não alterar Calendário | OK |
| Não executar deploy | OK |
| Não executar SQL em produção | OK |
| Criar relatório pré-execução | OK |
| Criar relatório de execução | OK |
| API build OK | OK |
| Web build OK | OK |
| Testes dos relatórios OK | OK |

## 11. Decisão

O Bloco 2 está concluído localmente e pronto para checkpoint Git quando autorizado.

Pronto para Bloco 3: SIM
