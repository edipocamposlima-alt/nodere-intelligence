# 01 — Auditoria técnica de código e arquitetura

Data de corte: 2026-07-22. Branch: `codex/nodere-ai-first-v3`.

## Fonte oficial

- Frontend canônico: `apps/web` (Next.js 15.5.21, React 19).
- Backend canônico: `apps/api` (Express, TypeScript).
- Banco canônico: Supabase `qhopjggnbzewuuktqntp`.
- Deploy atual: Vercel + Render; o app raiz e `backend/` são legados.

## Achados críticos e tratamento

| Achado | Evidência anterior | Tratamento V3 |
|---|---|---|
| IA via chamadas diretas | `services/ai.ts` usava Chat Completions/fetch | Gateway único em `aiGateway.ts`; rotas legadas também são medidas |
| Créditos sentinela | `999999` em rotas, planos e SQL | Removido; Agency = 1.800, Enterprise = contrato, sem bypass administrativo |
| Sem ledger/idempotência | saldo alterado diretamente | wallet + ledger + RPCs atômicas de reserva/captura/liberação/consumo |
| Chave OpenAI no formulário | `openai_key` aceito pelo workspace | removido do frontend e da allowlist do backend |
| Proxy quebrava streaming | `arrayBuffer()` no BFF | corpo upstream encaminhado como stream |
| IA era módulo secundário | login e `/` levavam ao dashboard | entrada autenticada passa a ser `/ai`; dashboard permanece módulo |

## Dívidas preservadas

- `app.js`, `serve-nodere.mjs` e `backend/` continuam legados e não foram removidos para não ampliar o risco.
- O banco vivo possui débitos anteriores de policies/advisors não alterados por esta migração aditiva.
- A migração AI-first ainda não foi aplicada em produção: o controle de segurança exigiu aprovação explícita por ausência de staging/backup comprovado.
