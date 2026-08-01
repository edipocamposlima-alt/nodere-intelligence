# 24 — Evidências antes e depois

Data: 2026-07-22

| Tema | Antes | Depois no branch |
|---|---|---|
| Entrada autenticada | Dashboard | /ai; Dashboard como módulo |
| IA | endpoints dispersos | gateway único e medido |
| Modelos | variável única | registry com preço, perfil e agente |
| Chaves | UI aceitava openai_key | backend-only; campo/allowlist removidos |
| Créditos | bypass e sentinela infinita | carteira/ledger, sem bypass |
| Escritas por IA | sem tool registry | schemas estritos, aprovação e recibos |
| Retry de tool | risco de duplicar | chave conversa + toolCallId e claim exclusivo |
| Streaming proxy | resposta bufferizada | body transmitido |
| PWA | iniciava Dashboard | inicia NODERE AI |
| PDF | CSV testado, PDF sem teste binário | assinatura, EOF, página e tamanho testados |
| Bundle /ai | 731 kB medidos antes da otimização | 380 kB no build atual |
| Dependências runtime | achados corrigidos durante auditoria | npm audit API/Web: 0 |

Evidência produtiva V3: não existe, pois schema e deploy não foram promovidos. Produção permanece no commit baseline 098ef844.
