# 07 — Catálogo de agentes

| ID | Missão | Modelo padrão | Ferramentas |
|---|---|---|---|
| `commercial-copilot` | coordenar operação comercial | Automático/Terra | CRM + Briefing + comunicação em rascunho |
| `prospecting-analyst` | priorizar contas e oportunidades | Automático/Luna | leitura e diagnóstico |
| `pipeline-coach` | diagnosticar gargalos do funil | Automático/Terra | leitura + etapa + próxima ação |
| `proposal-strategist` | estruturar proposta e próximos passos | Automático/Sol | leitura + documentos/rascunhos |

Agentes são configurações persistidas e versionáveis. Eles não são identidades autônomas, não possuem secrets e não podem ampliar as permissões da sessão. A lista de ferramentas resulta da interseção agente × papel.

Modelos permitidos: Copiloto usa Luna/Terra/Sol; Analista usa Luna/Terra; Coach usa Luna/Terra; Estrategista usa Terra/Sol. O modo padrão é Automático e considera complexidade, capacidade, custo, saldo e disponibilidade. O perfil do usuário ainda restringe a lista, portanto viewer nunca recebe Sol nem ferramenta de escrita.
