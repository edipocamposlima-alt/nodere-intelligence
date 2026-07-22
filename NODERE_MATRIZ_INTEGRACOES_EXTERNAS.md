# NODERE — Matriz de Integrações Externas

Data: 2026-07-19

| Integração | Configuração detectada | Probe real final | Estado |
|---|---:|---:|---|
| Supabase | sim | sim, leitura aprovada | OK |
| OpenAI | sim | sim, endpoint autenticado | OK |
| Google Places | sim | não no health genérico | configurado, teste específico pendente |
| Google Maps | sim | não | configurado, teste específico pendente |
| Apollo | sim | não | configurado, contrato/endpoint pendente |
| Anthropic | não | probe retorna indisponível | não configurado |
| PageSpeed | não | não executável | não configurado |
| Google Business Profile | não | não | não configurado |
| WhatsApp Cloud | não | webhook fail-closed | não configurado |
| Econodata | não | não | não configurado |
| Bling | não | não | não configurado |
| RD Station | não | não | não configurado |
| Stripe | não | não | não configurado |
| SMTP | não | não | não configurado |
| Meta | não | assinatura exigida | não configurado |

Resumo: 5/15 configurações detectadas; 2/15 comprovadas por probe real na rodada final. “Configurado” não é sinônimo de “operacional”. A interface foi corrigida para preservar essa distinção e para usar o campo `required` retornado pelo backend.

## Critério de certificação

Cada integração só muda para OK após chamada real, resposta coerente, cenário de erro, rate limit, segredo protegido, log sanitizado e responsável comercial. Provedores não contratados podem permanecer ausentes, desde que a UI não os apresente como ativos ou obrigatórios.
