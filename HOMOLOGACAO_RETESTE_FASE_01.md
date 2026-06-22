# Homologação de Reteste - Fase 1

Data: 22/06/2026  
Ambiente: local  
Deploy: não executado  
Migração em produção: não aplicada

## Resultado executivo

| Bloco | Status | Evidência |
| --- | --- | --- |
| Autenticação | APROVADA | Estado aprovado da homologação anterior preservado; rotas protegidas redirecionam corretamente sem sessão |
| Autorização | APROVADA | Matriz HTTP e testes de middleware confirmam 401/403/200 por perfil |
| Schema | REPROVADO | Migração segura foi gerada, mas ainda não foi aplicada no Supabase |
| Endpoints | REPROVADOS | Leituras estão controladas; mutações reais ainda dependem da migração para retornar 200/201 |
| Regressão | REPROVADA | Builds e rotas passaram, mas falta validação autenticada visual e de persistência após SQL |

## Matriz de leitura HTTP

| Rota | Sem sessão | Owner | Admin | Operator | Viewer |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/api/companies` | 401 | 200 | 200 | 200 | 200 |
| `/api/crm/leads` | 401 | 200 | 200 | 200 | 200 |
| `/api/inbox` | 401 | 200 | 200 | 200 | 200 |
| `/api/marketing` | 401 | 200 | 200 | 200 | 200 |
| `/api/operators` | 401 | 200 | 200 | 200 | 200 |
| `/api/settings` | 401 | 200 | 200 | 200 | 200 |
| `/api/ai` | 401 | 200 | 200 | 200 | 200 |
| `/api/sequences` | 401 | 200 | 200 | 200 | 200 |
| `/api/credits` | 401 | 200 | 200 | 200 | 200 |
| `/api/communications` | 401 | 200 | 200 | 200 | 200 |
| `/api/contracts` | 401 | 200 | 200 | 200 | 200 |
| `/api/files` | 401 | 200 | 200 | 200 | 200 |
| `/api/intelligence/summary` | 401 | 200 | 200 | 200 | 200 |
| `/api/proposals` | 401 | 200 | 200 | 200 | 200 |
| `/api/audit` | 401 | 200 | 200 | 403 | 403 |
| `/api/admin/roles` | 401 | 200 | 200 | 403 | 403 |
| `/api/settings/integrations` | 401 | 200 | 200 | 403 | 403 |

## Matriz de mutação sem persistência

Foi enviado payload inválido `{}` para validar somente a passagem pelos guardas, sem criar dados.

| Rota | Owner | Admin | Operator | Viewer |
| --- | ---: | ---: | ---: | ---: |
| `POST /api/marketing` | 400 | 400 | 400 | 403 |
| `POST /api/operators` | 400 | 400 | 403 | 403 |
| `POST /api/admin/roles` | 400 | 400 | 403 | 403 |

O código 400 para perfis autorizados confirma que a requisição alcançou a validação de payload. O Viewer e os perfis fora do escopo são bloqueados antes da operação.

## Build e testes

- API lint/typecheck: APROVADO.
- API build: APROVADO.
- Suíte `test:phase1`: APROVADA, 11 testes de 11.
- Web lint/typecheck: APROVADO.
- Web build: APROVADO, 58 páginas geradas.
- Build raiz: APROVADO.

## Regressão de rotas web sem sessão

- `/login`: 200.
- `/app/dashboard`: 307 para login.
- `/app/discovery`: 307 para login.
- `/app/leads`: 307 para login.
- `/reports`: 307 para login.
- `/app/settings`: 307 para login.
- `/catalog`: 307 para login.
- `/calendar`: 307 para login.

Não houve 404 ou 500 nessas rotas. A validação funcional autenticada não foi declarada porque não foi usada sessão sintética no navegador.

## Status final obrigatório

AUTENTICAÇÃO: APROVADA

AUTORIZAÇÃO: APROVADA

SCHEMA: REPROVADO

ENDPOINTS: REPROVADOS

REGRESSÃO: REPROVADA

LIBERADO PARA FASE 2: NÃO

## Condição para novo reteste

Aplicar manualmente `MIGRACAO_CORRECAO_FASE_01.sql`, recarregar o schema PostgREST e executar novamente a matriz com payloads válidos e sessão real para Owner, Admin, Operator e Viewer.
