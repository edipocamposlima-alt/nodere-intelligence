# 04 — Modelo de dados canônico AI-first

| Entidade | Chave/escopo | Finalidade |
|---|---|---|
| `nodere_ai_model_registry` | `id` global | provider, modelo, tier, preços e esforço |
| `nodere_ai_agents` | `id`, `workspace_id?` | prompt, modelo padrão e ferramentas permitidas |
| `nodere_ai_conversations` | UUID + workspace | conversa, agente, modelo e título |
| `nodere_ai_messages` | UUID + conversa/workspace | parts do protocolo AI SDK |
| `nodere_ai_executions` | UUID + workspace | tokens, custo, status, erro e idempotência |
| `nodere_ai_tool_receipts` | execução + tool call | entrada, saída, aprovação, risco e recibo |
| `nodere_credit_wallets` | workspace | disponível, retido, gasto e conversão |
| `nodere_credit_ledger` | workspace + idempotência | razão imutável de grants/reservas/capturas/liberações |

Todos os FKs usados em joins possuem índices. Timestamps usam `timestamptz`; dinheiro/crédito usa `numeric`; RLS está habilitado e acesso público/autenticado direto é revogado. As RPCs usam `security definer`, `search_path=''` e grant exclusivo ao `service_role`.
