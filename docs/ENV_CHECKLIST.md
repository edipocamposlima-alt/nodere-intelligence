# Checklist de Variáveis — NODERI Nexus

Data: 2026-06-17

## Frontend — Vercel

| Variável | Status | Observação |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Configurada com fallback | Código usa `https://nodere-api.onrender.com` como fallback seguro. |
| `NEXT_PUBLIC_SUPABASE_URL` | Obrigatória | Usada por Auth e workspace. Validar valor no projeto Vercel `web`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Obrigatória | Usada por Auth. Deve ser pública, não sensível, para build frontend. |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Opcional pendente | Sem ela, o mapa usa incorporação visual; pins interativos dependem da chave. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Opcional alternativa | Aceita como fallback do mapa interativo. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Opcional | Usada no site público e botão WhatsApp. |
| `NEXT_PUBLIC_GA4_ID` | Opcional | Não bloqueia funcionamento. |
| `NEXT_PUBLIC_API_KEY` | Legado/opcional | Código ainda aceita como fallback, mas sessão Supabase é o caminho principal. |

## Backend — Render

| Variável | Status | Observação |
|---|---|---|
| `DATABASE_URL` | Verificar | Necessária para conexão direta quando usada. |
| `SUPABASE_URL` | Obrigatória | Health informa se está ausente. |
| `SUPABASE_SERVICE_ROLE_KEY` | Obrigatória | Necessária para rotas persistentes do backend. |
| `SUPABASE_ANON_KEY` | Opcional backend | Configurada no `config.ts`. |
| `JWT_SECRET` | Não localizado no código atual | Auth principal usa Supabase/session middleware. |
| `GOOGLE_MAPS_API_KEY` | Verificar | Maps/Places usam fallback entre chaves Google. |
| `GOOGLE_PLACES_API_KEY` | Obrigatória para busca real | Sem ela, busca Google Places fica indisponível. |
| `GOOGLE_PAGESPEED_API_KEY` | Opcional | Alimenta auditoria digital. |
| `STRIPE_SECRET_KEY` | Pendente controlado | Checkout real depende desta variável. |
| `STRIPE_WEBHOOK_SECRET` | Pendente controlado | Webhook real depende desta variável. |
| `STRIPE_PRICE_STARTER_MONTHLY` | Pendente controlado | Billing mensal/anual. |
| `STRIPE_PRICE_STARTER_YEARLY` | Pendente controlado | Billing mensal/anual. |
| `STRIPE_PRICE_PRO_MONTHLY` | Pendente controlado | Billing mensal/anual. |
| `STRIPE_PRICE_PRO_YEARLY` | Pendente controlado | Billing mensal/anual. |
| `STRIPE_PRICE_AGENCY_MONTHLY` | Pendente controlado | Billing mensal/anual. |
| `STRIPE_PRICE_AGENCY_YEARLY` | Pendente controlado | Billing mensal/anual. |
| `WHATSAPP_CLOUD_TOKEN` | Verificar | WhatsApp Cloud real. |
| `WHATSAPP_PHONE_NUMBER_ID` | Verificar | WhatsApp Cloud real. |
| `WHATSAPP_VERIFY_TOKEN` | Verificar | Webhook WhatsApp. |
| `OPENAI_API_KEY` | Verificar | IA principal. |
| `ANTHROPIC_API_KEY` | Opcional | Fallback de IA. |
| `APOLLO_API_KEY` | Verificar | Enriquecimento de decisores. |
| `SMTP_HOST` | Pendente controlado | Envio real de e-mail. |
| `SMTP_PORT` | Pendente controlado | Porta SMTP, padrão 587. |
| `SMTP_USER` | Pendente controlado | Usuário SMTP. |
| `SMTP_PASS` | Pendente controlado | Senha SMTP. |
| `SMTP_PASSWORD` | Compatível | Fallback aceito quando `SMTP_PASS` não existir. |
| `SMTP_FROM` | Pendente controlado | Remetente SMTP. |

## Observações

- Variáveis sensíveis devem ficar apenas no backend.
- Variáveis `NEXT_PUBLIC_*` são embutidas no build do frontend.
- Nenhuma chave real deve aparecer em tela, HTML, bundle ou documentação pública.
