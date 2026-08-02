# 06 — Catálogo de ferramentas da IA

| Ferramenta | Risco | Papéis | Confirmação | Recibo |
|---|---|---|---|---|
| `list_companies` | leitura | todos | não | sim |
| `get_company` | leitura | todos | não | sim |
| `create_company` | escrita | owner/admin/operator | sempre | sim |
| `update_pipeline_stage` | escrita | owner/admin/operator | sempre | sim |
| `briefing.create` | escrita | owner/admin/operator | sempre | sim |
| `briefing.open` / `briefing.list` / `briefing.search` | leitura | todos | não | sim |
| `briefing.saveDraft` | escrita | owner/admin/operator | sempre | sim |
| `briefing.complete` | escrita integrada | owner/admin/operator | sempre | sim |
| `briefing.createVersion` | escrita | owner/admin/operator | sempre | sim |
| `briefing.compareWithClient` | leitura | todos | não | sim |
| `briefing.generatePdf` / `briefing.export` | documento | todos | não | sim |
| `briefing.import` | lote | owner/admin/operator | sempre | sim |
| `briefing.archive` / `briefing.restore` | ciclo de vida | owner/admin/operator | sempre | sim |
| `company.archive` / `company.trash` / `company.restore` | ciclo de vida | owner/admin/operator | sempre | sim |
| `communication.draft` | escrita | owner/admin/operator | sempre | sim |

Todas usam Zod como `inputSchema`, `strict: true`, filtro obrigatório por `workspace_id` e idempotência `execution_id + tool_call_id`. Nenhuma ferramenta recebe credencial ou permite escolher workspace.

Envio externo de WhatsApp/e-mail, purga definitiva, checkout e qualquer outra ação destrutiva permanecem bloqueados para execução autônoma. Cada uma exige confirmação específica, contrato de entrada/saída, teste de isolamento e rollback/compensação.
