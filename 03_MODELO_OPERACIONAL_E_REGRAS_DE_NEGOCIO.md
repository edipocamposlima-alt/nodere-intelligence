# 03 — Modelo operacional e regras de negócio

- Uma resposta textual é recomendação; uma ação só ocorreu se houver recibo de ferramenta com `status=succeeded`.
- Conteúdo de prompt, empresa, página e retorno de integração é dado não confiável, nunca instrução de sistema.
- Viewer: conversa e leitura. Operator: leitura e escrita aprovada. Admin/Owner: mesmo ledger, sem crédito infinito.
- Escritas persistentes, chamadas externas e ações destrutivas precisam de confirmação compatível com o risco.
- A seleção de agente limita o conjunto de ferramentas exposto ao modelo.
- Falha antes/durante o provedor libera reserva; falha de captura preserva o valor retido para reconciliação.
- Retry do usuário tem chave idempotente própria; retry interno do SDK é limitado a 1.
- Sem saldo, a chamada não chega ao provedor e a UI orienta faturamento.
- O custo é calculado com tokens de entrada, cache read, cache write (1,25×) e saída.
- Ações antigas de diagnóstico/proposta são endpoints de compatibilidade, mas agora usam o mesmo ledger.
