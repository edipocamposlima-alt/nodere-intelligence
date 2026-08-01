# 06 — Catálogo de ferramentas da IA

| Ferramenta | Risco | Papéis | Confirmação | Recibo |
|---|---|---|---|---|
| `list_companies` | leitura | todos | não | sim |
| `get_company` | leitura | todos | não | sim |
| `create_company` | escrita | owner/admin/operator | sempre | sim |
| `update_pipeline_stage` | escrita | owner/admin/operator | sempre | sim |

Todas usam Zod como `inputSchema`, `strict: true`, filtro obrigatório por `workspace_id` e idempotência `execution_id + tool_call_id`. Nenhuma ferramenta recebe credencial ou permite escolher workspace.

Próximas candidatas, ainda bloqueadas: criar proposta, enviar WhatsApp/e-mail, agendar reunião, iniciar checkout, apagar registro. Cada uma requer contrato de entrada/saída, política de aprovação, teste de isolamento e rollback/compensação.
