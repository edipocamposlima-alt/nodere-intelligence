# NODERE — Matriz de Testes

Data: 2026-07-18

## Critérios de aceite

- **Aprovado:** comando/cenário executado com resultado esperado.
- **Ignorado:** teste existe, mas pré-requisito exclusivo não está disponível.
- **Pendente:** ainda precisa de execução ou ambiente.
- Nenhum teste aprovado substitui backup de banco, staging ou monitoramento de produção.

| ID | Camada | Cenário | Método | Resultado esperado | Estado |
|---|---|---|---|---|---|
| WEB-01 | Web | TypeScript | `npm run typecheck` | zero erros | Aprovado |
| WEB-02 | Web | build de produção | `npm run build` | 62 páginas compiladas | Aprovado |
| API-01 | API | TypeScript/build | scripts de typecheck/build | zero erros | Aprovado |
| API-02 | API | segurança de rotas | 11 testes | 11 passam | Aprovado |
| API-03 | API | calendário | 5 testes | 5 passam | Aprovado |
| API-04 | API | relatórios/período | 4 testes | 4 passam com relógio fixo | Aprovado |
| API-05 | API | CRM | 2 testes | 2 passam | Aprovado |
| API-06 | API | WhatsApp | 5 testes | 5 passam | Aprovado |
| API-07 | API | descoberta/IA | 2 testes | 2 passam | Aprovado |
| API-08 | API | importação segura | 4 testes | CSV/XLSX válido, limites e XLS rejeitado | Aprovado |
| DEP-01 | Dependências | auditoria frontend | `npm audit` | 0 vulnerabilidades | Aprovado |
| DEP-02 | Dependências | auditoria backend | `npm audit` | 0 vulnerabilidades | Aprovado |
| PWA-01 | PWA | manifest/viewport/mobile | validador local | todos os checks passam | Aprovado, 19/19 |
| PWA-02 | PWA | cache privado | inspeção service worker | navegação não é armazenada | Aprovado |
| AUTH-01 | Browser | raiz sem sessão | Playwright desktop/Pixel 5 | redireciona a `/login` | Aprovado, 2 cenários |
| AUTH-02 | Browser | token inválido | Playwright desktop/Pixel 5 | sem dados privados, volta ao login | Aprovado, 2 cenários |
| AUTH-03 | Route | criação de sessão inválida | POST local | 401 e sem cookie válido | Aprovado |
| AUTH-04 | Browser | login e navegação real | Playwright | Dashboard/CRM/Ficha com conta teste | Ignorado: credenciais ausentes |
| UX-01 | Visual | login local | Chrome | sem overlay e layout legível | Aprovado |
| UX-02 | Visual | Dashboard/CRM autenticados | Chrome | hierarquia, 100% máximo, sessão correta | Pendente de conta teste/deploy |
| DB-01 | Supabase | saúde/schema | API de gestão | projeto saudável, 49 tabelas com RLS | Aprovado com achados |
| DB-02 | Supabase | migração de hardening | staging + backup | migração e rollback íntegros | Bloqueado |
| PROD-01 | Produção | health API | GET público | 200, banco/OpenAI observáveis | Aprovado no baseline |
| PROD-02 | Produção | frontend final | deploy Vercel + smoke | login, redirect e ativos atualizados | A executar no deploy |
| PROD-03 | Produção | backend final | Render + health versionado | commit final saudável | A executar após push |

## Cobertura de regressão prioritária

1. sessão expirada não pode coexistir com Dashboard/CRM renderizados;
2. qualquer token postado à rota de sessão deve ser validado no backend;
3. conversão do CRM deve permanecer entre 0% e 100%;
4. uma nova busca não mistura resultados temporários anteriores;
5. Ficha abre somente registro persistido/canônico;
6. importações excedentes ou XLS legado falham de forma controlada;
7. service worker não cacheia navegação autenticada;
8. usuário sem workspace/módulo não ganha acesso por fallback local.

## Testes necessários para fechamento total

- criar usuário exclusivo de teste com workspace descartável;
- executar login, Dashboard, busca, salvar lead, Ficha, CRM, Agenda, proposta e logout em desktop/mobile;
- executar Lighthouse/axe autenticado;
- restaurar backup em staging e testar os dois scripts SQL;
- confirmar cold start, logs e métricas após 30–60 minutos de produção.
