# 14 — Auditoria de performance

- Streaming deixou de ser bufferizado pelo BFF.
- Transações de crédito não englobam chamadas HTTP; locks duram apenas durante RPCs.
- Índices compostos cobrem workspace + tempo/status nas tabelas de alto volume.
- Histórico limita 30 conversas e ferramenta limita 50 empresas.
- Chat limita 100 mensagens, 5 steps, 2.048 tokens de saída padrão e 1 retry.
- AI Elements está isolado na rota `/ai`; plugins Mermaid/math/code foram removidos.

Build inicial antes da redução: `/ai` 595 kB / first load 731 kB. Build final medido: rota 274 kB / first load 380 kB, redução aproximada de 48% no carregamento inicial. Metas posteriores: lazy load de histórico/painéis, paginação por cursor e telemetria p95 de first-token/tool/ledger.
