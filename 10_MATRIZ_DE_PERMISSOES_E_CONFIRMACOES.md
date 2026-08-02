# 10 — Matriz de permissões e confirmações

| Ação | Viewer | Operator | Admin | Owner | Confirmação |
|---|---:|---:|---:|---:|---|
| Conversar/ler CRM | sim | sim | sim | sim | não |
| Criar lead | não | sim | sim | sim | sempre |
| Mover etapa | não | sim | sim | sim | sempre |
| Selecionar modelo/agente | sim | sim | sim | sim | não |
| Gerenciar secrets de IA | não | não | não | não | operação de ambiente |
| Consumir crédito | sim | sim | sim | sim | reserva automática |
| Ler briefing/comunicações | sim | sim | sim | sim | não |
| Criar/editar/concluir briefing | não | sim | sim | sim | mutação confirmada na IA |
| Criar template/rascunho/outbox | não | sim | sim | sim | consentimento e confirmação |
| Arquivar/restaurar CRM | não | sim | sim | sim | confirmação |
| Mover para lixeira | não | sim | sim | sim | confirmação nominal |
| Purga após retenção | não | não | sim | sim | frase nominal + 30 dias + sem dependências/legal hold |

O papel efetivo vem da sessão; owner embutido continua owner, porém sem saldo infinito. IDs de workspace/usuário não são aceitos do corpo. Aprovação da UI é validada pelo protocolo do AI SDK antes do `execute` da ferramenta e toda mutação sensível registra auditoria.
