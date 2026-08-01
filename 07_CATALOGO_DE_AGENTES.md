# 07 — Catálogo de agentes

| ID | Missão | Modelo padrão | Ferramentas |
|---|---|---|---|
| `commercial-copilot` | coordenar operação comercial | Terra | leitura + criação + etapa |
| `prospecting-analyst` | priorizar contas e oportunidades | Luna | leitura |
| `pipeline-coach` | diagnosticar gargalos do funil | Terra | leitura + etapa |
| `proposal-strategist` | estruturar proposta e próximos passos | Sol | leitura |

Agentes são configurações persistidas e versionáveis. Eles não são identidades autônomas, não possuem secrets e não podem ampliar as permissões da sessão. A lista de ferramentas resulta da interseção agente × papel.

Modelos permitidos: Copiloto usa Luna/Terra/Sol; Analista usa Luna/Terra; Coach usa Luna/Terra; Estrategista usa Terra/Sol. O perfil do usuário ainda restringe essa lista, portanto viewer nunca recebe Sol.
