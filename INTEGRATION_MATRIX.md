# Nodere Intelligence - Matriz de Integracoes

## Prioridade 1 - MVP real

| Integracao | Objetivo | Status tecnico | Dados |
|---|---|---|---|
| Supabase | Banco, auth e persistencia | Preparado | leads, CRM, historico, auditorias |
| Google Places | Descoberta de empresas | Preparado no backend | nome, telefone, site, endereco, rating, reviews, horario |
| PageSpeed Insights | Performance e SEO tecnico | A implementar | mobile, performance, SEO, boas praticas |
| OpenAI | Diagnostico e abordagem | Preparado no backend | resumo, score, mensagem, proposta |
| WhatsApp link | Contato manual imediato | Ativo | mensagem pre-preenchida |

## Prioridade 2 - Prospecção avançada

| Integracao | Objetivo | Observacao |
|---|---|---|
| Google Business Profile | Auditoria profunda de perfil | exige OAuth e permissoes |
| SerpAPI | Posicionamento e SERP | exige plano pago/API key |
| DataForSEO | SEO, SERP e backlinks | exige plano pago |
| BuiltWith | tecnologias do site | alternativa ao scanner proprio |
| Hunter.io | emails profissionais | exige API key |
| Clearbit/Apollo | enriquecimento B2B | exige API key e compliance |

## Prioridade 3 - Operacao comercial

| Integracao | Objetivo |
|---|---|
| WhatsApp Cloud API | envio oficial, webhooks e inbox |
| Gmail API | email outbound e inbound |
| Twilio/Evolution API | alternativas WhatsApp/SMS |
| HubSpot/RD Station | sincronizacao CRM |
| Stripe/Mercado Pago | assinatura e billing |

## Politica de credenciais

- Nunca inserir chaves no frontend.
- Usar `backend/.env` em ambiente local.
- Em producao, usar secrets da plataforma de deploy.
- Criptografar tokens OAuth no banco.
- Registrar logs de uso por provedor.
- Respeitar limites, termos e LGPD.
