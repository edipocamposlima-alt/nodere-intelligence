# 25 — Plano de migração D1/R2 para NODERE

## Estado

Planejado, não executado. Não foram disponibilizados dump D1, inventário R2, credenciais de leitura ou checksum do legado.

## Procedimento seguro de retomada

1. Congelar o intervalo de exportação e gerar dumps somente leitura.
2. Inventariar tabelas, objetos, tamanhos, hashes e chaves de vínculo.
3. Mapear os 47 campos para o catálogo NODERE, preservando `legacy_source`, `legacy_id`, `legacy_code`, snapshot e data da origem.
4. Executar importação sombra em workspace de homologação.
5. Conciliar contagens, obrigatórios, duplicidades, versões, anexos e checksums.
6. Corrigir divergências sem alterar o legado.
7. Executar lote de produção com idempotência por origem/ID.
8. Manter relatório de rejeições e rollback por `import_batch`.

## Gate

Nenhum dado D1/R2 será declarado migrado até haver exportação verificável e reconciliação igual a 100% dos registros aceitos, com rejeições explicadas individualmente.

