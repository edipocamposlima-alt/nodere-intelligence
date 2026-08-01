# ADR-002 — Ledger transacional de créditos

Data: 2026-07-22
Status: aceito no código; migração pendente

## Decisão

nodere_credit_wallets é a carteira atual e nodere_credit_ledger é o histórico imutável. Geração usa reserve -> capture; falha anterior ao provedor usa release. Capture devolve a diferença da reserva. Grant e consumo operacional usam RPCs idempotentes e bloqueio de linha.

## Regras

- saldo e retenção nunca ficam negativos;
- não existe bypass por owner/admin;
- custo deriva do registry e do usage real, inclusive cache;
- falha de capture após custo mantém a reserva para reconciliação;
- retries repetem a chave idempotente, não a cobrança.

## Consequências

O banco é a fonte de verdade. Se a RPC não existir, a operação não é executada. O ledger só será validado integralmente após aplicação controlada da migração e testes concorrentes no banco.
