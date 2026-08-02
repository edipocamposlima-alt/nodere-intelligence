# 24 — Matriz de campos do Briefing para CRM

O catálogo possui 47 campos, posições 1 a 47, sem duplicidade. Obrigatórios: `company_name`, `segment`, `decision_maker_name` e `next_action`.

| Campo do briefing | Destino canônico | Regra |
|---|---|---|
| `company_name` | `nodere_companies.name` | obrigatório |
| `segment` | `nodere_companies.category` | obrigatório |
| `cnpj` | `nodere_companies.cnpj` | normalizado |
| `city` | `nodere_companies.city` | texto |
| `state` | `nodere_companies.state` | UF |
| `full_address` | `nodere_companies.address` | texto |
| `website` | `nodere_companies.website` | URL |
| `decision_maker_name` | `company_contacts.name` | obrigatório |
| `decision_maker_role` | `company_contacts.role` | texto |
| `phone` | `company_contacts.phone` | telefone |
| `whatsapp` | `company_contacts.whatsapp` | telefone |
| `email` | `company_contacts.email` | e-mail |

Os outros 35 campos permanecem no JSON canônico `answers`, com chave estável e metadados de seção, tipo, opções, posição e obrigatoriedade na tabela `briefing_field_mappings`. A conclusão compara valores atuais antes de aplicar os 12 mapeamentos acima e nunca atualiza campo desconhecido.

