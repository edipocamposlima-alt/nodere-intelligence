# 09 — Planos, créditos e ledger

Conversão inicial explícita: 100 créditos = US$ 1 de custo calculado do provedor. É configuração da wallet/ambiente, não constante de UI.

Fluxo: `estimate -> reserve -> provider -> capture(actual) -> release(difference)`. Em erro: `release(all)`. As RPCs travam uma wallet por vez com `FOR UPDATE`, verificam idempotência e atualizam saldo + ledger na mesma transação curta.

Limites canônicos: Demo/Starter 200, Pro 600, Agency 1.800, Enterprise definido por contrato. Owner/Admin não têm bypass. Buscas/enriquecimentos também passam por `nodere_consume_credits` após a migração.

O custo OpenAI inclui entrada sem cache, cache read, cache write a 1,25× e saída. Long context e ferramentas hospedadas possuem precificação adicional; até serem suportados pelo cálculo, não são expostos pela NODERE.
