# 10 — Matriz de permissões e confirmações

| Ação | Viewer | Operator | Admin | Owner | Confirmação |
|---|---:|---:|---:|---:|---|
| Conversar/ler CRM | sim | sim | sim | sim | não |
| Criar lead | não | sim | sim | sim | sempre |
| Mover etapa | não | sim | sim | sim | sempre |
| Selecionar modelo/agente | sim | sim | sim | sim | não |
| Gerenciar secrets de IA | não | não | não | não | operação de ambiente |
| Consumir crédito | sim | sim | sim | sim | reserva automática |

O papel efetivo vem da sessão; owner embutido continua owner, porém sem saldo infinito. Aprovação da UI é validada pelo protocolo do AI SDK antes do `execute` da ferramenta.
