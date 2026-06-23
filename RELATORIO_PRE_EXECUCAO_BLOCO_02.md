# Relatório Pré-Execução — Fase 2, Bloco 2

Data: 22/06/2026  
Branch: `fase-02-desenvolvimento`  
Escopo: Relatórios e Exportações  
Deploy: não autorizado  
SQL em produção: não autorizado

## 1. Decisão de escopo

Este comando define o Bloco 2 como **Relatórios e Exportações**. Nenhum trabalho será iniciado em WhatsApp, CRM avançado, Mobile/PWA, IA ou Discovery avançado. Os arquivos e comportamentos do Calendário homologado no Bloco 1 não serão alterados.

## 2. Estado atual encontrado

- A API possui endpoints de resumo, funil, timeline, segmentos, cidades, origem, inteligência, operadores, propostas e PDF.
- A página `/reports` já exibe cards e gráficos e possui botões CSV/PDF.
- O período é enviado ao backend em parte dos endpoints.
- Filtros de operador, empresa, status/origem e outros aparecem na interface, porém vários são apenas locais ou não alteram as métricas centrais.
- O CSV é montado no navegador com subconjuntos já carregados.
- O PDF consulta métricas no backend, mas não compartilha todos os filtros da tela.
- Endpoints antigos calculam dados completos do workspace mesmo para Operator.

## 3. Problema central

Cards, gráficos, CSV e PDF não usam uma fonte filtrada única. Isso permite que a tela mostre um recorte enquanto o resumo ou arquivo exportado apresenta números diferentes. A correção deve centralizar filtros e autorização no backend, preservando os endpoints existentes.

## 4. Arquivos impactados

### Alteração prevista

- `apps/api/src/routes/reports.ts`
- `apps/api/src/services/reports.ts`
- `apps/api/package.json`
- `apps/web/lib/api.ts`
- `apps/web/app/reports/ReportsClient.tsx`

### Criação prevista

- `apps/api/src/tests/reports.test.ts`
- `BLOCO_02_EXECUTADO.md`

### Referência sem alteração prevista

- `apps/api/src/middleware/session.ts`
- `apps/api/src/services/companyStore.ts`
- `apps/api/src/services/metricsStore.ts`
- `apps/api/src/services/userStore.ts`
- `apps/api/src/server.ts`
- `apps/web/app/reports/page.tsx`

### Fora do escopo e protegido

- `apps/api/src/routes/calendar.ts`
- `apps/web/app/calendar/CalendarClient.tsx`
- `apps/api/src/tests/calendar.test.ts`

## 5. APIs impactadas

| Método | Endpoint | Ação prevista |
| --- | --- | --- |
| GET | `/api/reports/dashboard` | Novo contrato consolidado com filtros e sete indicadores |
| GET | `/api/reports/export.csv` | CSV gerado no backend com os mesmos filtros |
| POST | `/api/reports/pdf` | Aplicar os mesmos filtros e indicadores ao PDF |
| GET | `/api/reports/summary` | Preservar e alinhar filtros/autorização |
| GET | `/api/reports/funnel` | Preservar e alinhar filtros/autorização |
| GET | `/api/reports/timeline` | Preservar e alinhar filtros/autorização |
| GET | `/api/reports/segments` | Preservar e alinhar filtros/autorização |
| GET | `/api/reports/cities` | Preservar e alinhar filtros/autorização |
| GET | `/api/reports/origin` | Preservar e alinhar filtros/autorização |
| GET | `/api/reports/intelligence` | Preservar e alinhar filtros/autorização |
| GET | `/api/reports/operators` | Respeitar papel e filtro de operador |
| GET | `/api/reports/proposals` | Preservar endpoint legado |

## 6. Tabelas impactadas

### Leitura

- `public.nodere_companies`
- `public.user_metrics`
- `public.activity_logs`
- `public.communications`
- `public.nodere_platform_users`
- `public.nodere_proposals`

### Registro de exportação já existente

- `public.download_logs`

Nenhuma tabela será criada ou alterada. Nenhum SQL será executado.

## 7. Componentes impactados

- `ReportsClient`: filtros, cards, carregamento consolidado e exportações.
- Funções de relatórios em `apps/web/lib/api.ts`.
- Serviço de cálculo em `apps/api/src/services/reports.ts`.
- Roteador e geração de arquivos em `apps/api/src/routes/reports.ts`.

## 8. Filtros obrigatórios

- Período: `7d`, `30d`, `90d` e `12m`.
- Operador: usuário responsável/criador disponível no registro.
- Empresa: `nodere_companies.id`.
- Status: etapa/status real do CRM.
- Origem: `source` real da empresa.

Os filtros devem ser enviados ao backend, normalizados, aplicados antes dos cálculos e repetidos no CSV/PDF.

## 9. Indicadores obrigatórios

1. Leads criados no período e filtros.
2. Leads convertidos.
3. Taxa de conversão.
4. Oportunidades em aberto.
5. Negócios ganhos.
6. Negócios perdidos.
7. Atividades realizadas.

### Regras planejadas

- Ganhos: status final equivalente a `Fechado`, `Cliente` ou ganho normalizado.
- Perdidos: status equivalente a `Perdido` ou perda normalizada.
- Convertidos: negócios ganhos.
- Em aberto: registros que não estejam ganhos nem perdidos.
- Taxa de conversão: ganhos divididos por decisões (ganhos + perdidos), evitando divisão por zero.
- Atividades realizadas: eventos operacionais persistidos dentro do período e escopo autorizado, com fallback explícito quando a fonte não estiver disponível.

## 10. Permissões

- Sem sessão: `401` pela montagem protegida existente.
- Owner: dados completos do workspace e todos os filtros.
- Admin: dados completos do workspace e todos os filtros.
- Operator: dados associados ao próprio usuário; não pode ampliar escopo por query string.
- Viewer: leitura do workspace, sem endpoints de mutação; exportações permanecem operações de leitura autenticada.

O backend será a autoridade de escopo. O frontend não poderá ampliar acesso alterando parâmetros.

## 11. Plano de implementação

1. Criar tipo e parser único de filtros.
2. Criar função pura para filtrar empresas e calcular indicadores.
3. Criar endpoint consolidado `/dashboard`.
4. Aplicar filtros aos endpoints legados consumidos pela tela.
5. Implementar CSV no backend com proteção contra formula injection.
6. Atualizar PDF para usar filtros e sete indicadores.
7. Atualizar `ReportsClient` para buscar uma resposta consolidada.
8. Popular seletores de empresa, operador, status e origem com opções retornadas pelo backend.
9. Garantir que CSV/PDF recebam exatamente os filtros ativos.
10. Adicionar testes de cálculo, filtros, papéis e sanitização de CSV.
11. Executar lint, builds e regressões da Fase 1 e do Calendário.

## 12. Critérios de homologação

- Os sete indicadores aparecem com dados calculados no backend.
- Alterar qualquer filtro atualiza cards e distribuições.
- CSV e PDF recebem os mesmos filtros da tela.
- CSV abre como UTF-8 e neutraliza fórmulas perigosas.
- PDF possui conteúdo, MIME type e nome válidos.
- Operator não consegue consultar outro operador.
- Viewer não executa mutações e visualiza somente o permitido.
- Endpoints legados continuam respondendo.
- Calendário permanece sem alterações.
- API e Web compilam sem erro.

## 13. Riscos e controles

| Risco | Controle |
| --- | --- |
| Registros antigos sem operador | Exibir no consolidado apenas para Owner/Admin/Viewer; Operator vê apenas os explicitamente associados |
| Nomes históricos diferentes para ganho/perda | Normalização central e testada de status |
| Métricas divergentes entre tela e arquivos | Uma função de cálculo e um objeto de filtros compartilhados |
| Tabela de atividades ausente | Erro controlado ou valor zero com aviso, sem quebrar o relatório inteiro |
| Exportação CSV com fórmula | Prefixar células iniciadas por `=`, `+`, `-` ou `@` |
| PDF demorado | Consultas paralelas e limite de linhas detalhadas |
| Vazamento entre workspaces | `workspace_id` sempre obtido da sessão e aplicado no backend |

## 14. Decisão pré-execução

O Bloco 2 pode ser implementado sem SQL e sem alterar o Calendário. A execução deve permanecer nos arquivos listados e parar antes de deploy.
