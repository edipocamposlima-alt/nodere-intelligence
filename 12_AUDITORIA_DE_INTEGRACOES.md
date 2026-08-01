# 12 — Auditoria de integrações

| Integração | Estado | Segredo | Observação |
|---|---|---|---|
| OpenAI | local validada | backend `.env.local`/Render | Responses API no gateway |
| Anthropic | health existente | backend | sem modelos semeados no registro V3 |
| Supabase | produção saudável | service role backend | migração V3 bloqueada aguardando aprovação |
| Vercel | produção saudável | projeto Vercel | preview V3 ainda não publicado |
| Render | API produção saudável | env Render | deploy V3 ainda não publicado |
| Stripe | compatibilidade existente | backend | grant de plano ligado ao ledger |
| Google/WhatsApp/SMTP/Apollo | preservadas | backend/workspace legado | não expostas como tools da IA |

O proxy Next preserva o corpo streaming e repassa apenas headers necessários. Nenhuma integração da IA é chamada diretamente pelo browser.
