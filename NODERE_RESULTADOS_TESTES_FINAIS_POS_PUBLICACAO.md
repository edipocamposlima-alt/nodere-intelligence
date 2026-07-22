# NODERE — Resultados dos Testes Finais Pós-Publicação

Data: 2026-07-19  
Versão: `v1.1.0`

| Conjunto | Resultado |
|---|---:|
| API phase 1 | 11 aprovados |
| Calendário | 5 aprovados |
| Relatórios | 4 aprovados |
| CRM | 2 aprovados |
| WhatsApp | 5 aprovados |
| IA/Discovery | 2 aprovados |
| Importação | 4 aprovados |
| Security hardening | 13 aprovados |
| **API total** | **46/46** |
| API build/typecheck | aprovado |
| Web Next build | aprovado, 53 páginas |
| Web typecheck | aprovado |
| PWA | 23/23 |
| npm audit produção — API | 0 vulnerabilidades |
| npm audit produção — Web | 0 vulnerabilidades |
| Playwright desktop/mobile | 4 aprovados, 2 ignorados |

## Testes de produção

- health raiz/API/version: HTTP 200;
- health Supabase: leitura real aprovada;
- health OpenAI: probe autenticado aprovado;
- Anthropic: indisponível por configuração ausente, corretamente reportado;
- CORS com origem não autorizada: 403 explícito;
- webhook sem segredo/assinatura: 503 fail-closed;
- manifest, service worker e offline: HTTP 200;
- smoke autenticado nas rotas operacionais principais: aprovado;
- Vercel runtime errors na janela final: nenhum;
- logs Render: API 1.1.0 iniciada e serviço live.

## Testes não executados

- dois E2E autenticados sem conta técnica;
- PageSpeed real sem chave;
- Anthropic real sem chave;
- envio real de WhatsApp/e-mail/cobrança/publicação;
- migração/rollback SQL e reconciliação com `--apply` sem backup/staging;
- axe/Lighthouse autenticado completo.

Esses itens são pendências declaradas, não aprovações implícitas.
