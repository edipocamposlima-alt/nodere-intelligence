# 26 — Relatório de reconciliação do Briefing

## Banco de produção após a migração

- 47 mapeamentos ativos e únicos; posições 1–47.
- 4 campos obrigatórios, 7 mapeamentos para empresa e 5 para contato.
- 12 tabelas V5 com RLS habilitada e forçada.
- 15 índices/FKs esperados presentes.
- Bucket `briefing-attachments` privado, limite 5.242.880 bytes.

## Preservação do baseline

| Conjunto | Quantidade | Checksum antes/depois |
|---|---:|---|
| Empresas | 863 | `d814205b042a85c7552154aec67a5709` |
| Observações | 520 | `73922c5e5bf3a9364674f83a61f01975` |
| Crédito do workspace | 1 | `0239497ab5a8dc3e844c1a7ceb58f999` |

Não houve alteração dos três conjuntos durante as migrations V5.

## Legado D1/R2

Sem fonte exportada, a reconciliação de registros legados é **não executada**. O relatório não usa zero registros como evidência de migração concluída.

