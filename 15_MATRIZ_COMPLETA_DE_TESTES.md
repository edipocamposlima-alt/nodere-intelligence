# 15 — Matriz completa de testes

| Camada | Caso | Estado |
|---|---|---|
| Unit | reserva > custo normal | passou |
| Unit | preço de cache descontado | passou |
| Unit | viewer somente leitura | passou |
| Unit | mutações exigem aprovação | passou |
| Unit | modelos por perfil/agente | passou |
| Unit | chave idempotente de tool | passou |
| API | TypeScript noEmit | passou |
| API | build TypeScript | passou |
| Web | TypeScript noEmit | passou |
| Web | build Next 15.5.21 produção | passou; /ai 380 kB first load |
| Supply chain | audit runtime API/Web | passou, 0 vulnerabilidades |
| DB | migração/rollback real | bloqueado por aprovação de produção |
| E2E | /ai sem sessão -> login | passou desktop e mobile |
| E2E | sessão inválida não revela CRM | passou desktop e mobile |
| E2E | login -> /ai -> stream | não executado: sem credenciais/schema |
| E2E | aprovação cria lead uma vez | pendente de schema/deploy |
| Segurança | isolamento cross-workspace | pendente de schema/deploy |
| PDF | assinatura, EOF, página e tamanho | passou |
| Mobile/PWA | 25 verificações estáticas | passou; start_url /ai |
| Browser visual | webview local | bloqueado: attach falhou duas vezes |

Resumo: 53 testes unitários/regressivos passaram; 4 E2E públicos passaram e 2 autenticados foram pulados; typecheck/build API e Web passaram; audit runtime API/Web encontrou 0 vulnerabilidades. O ledger e isolamento do novo schema ainda não foram testados no PostgreSQL porque a migration não foi aplicada.
