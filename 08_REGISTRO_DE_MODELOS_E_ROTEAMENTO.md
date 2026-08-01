# 08 — Registro de modelos e roteamento

Preços oficiais consultados em 2026-07-22, USD por 1M tokens.

| Modelo | Tier | Entrada | Cache read | Saída | Uso padrão |
|---|---:|---:|---:|---:|---|
| GPT-5.6 Luna | efficient | 1,00 | 0,10 | 6,00 | volume/latência/custo |
| GPT-5.6 Terra | balanced | 2,50 | 0,25 | 15,00 | padrão comercial |
| GPT-5.6 Sol | frontier | 5,00 | 0,50 | 30,00 | propostas/tarefas difíceis |

O registro filtra modelos desabilitados e provedores sem secret. Modelo solicitado indisponível falha explicitamente; não há troca silenciosa. O provedor OpenAI usa Responses API, `reasoningEffort` por registro e `safetyIdentifier` estável/privado. Fallback pós-início de stream ainda não é automático e consta em limites conhecidos.

Cada modelo possui `allowed_roles`; Luna e Terra aceitam todos os perfis, enquanto Sol aceita Owner, Admin e Operador. Cada agente possui `allowed_model_ids`. O endpoint de registry retorna apenas a interseção perfil + agente, e o gateway repete a mesma validação antes da reserva. O teste unitário de registry passou.
