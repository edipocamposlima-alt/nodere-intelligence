# 22 — Inventário de variáveis de ambiente sem valores

Nenhum valor secreto é reproduzido neste documento.

| Variável | Escopo | Obrigatória | Finalidade |
|---|---|---:|---|
| OPENAI_API_KEY | API por ambiente | para OpenAI | credencial central do provedor |
| OPENAI_MODEL | API | não | compatibilidade; padrão gpt-5.6-terra |
| ANTHROPIC_API_KEY | API por ambiente | não | habilita modelos Anthropic registrados |
| AI_DEFAULT_AGENT_ID | API | sim | agente padrão |
| AI_DEFAULT_MODEL_ID | API | sim | modelo padrão no registry |
| AI_CREDITS_PER_USD | API | sim | conversão contábil |
| AI_MAX_OUTPUT_TOKENS | API | sim | limite de saída |
| AI_RESERVATION_BUFFER | API | sim | margem da reserva |
| SUPABASE_URL | API/Web | sim | projeto de dados |
| SUPABASE_SERVICE_ROLE_KEY | API | sim | acesso backend com RLS fechado |
| NEXT_PUBLIC_SUPABASE_URL | Web | quando usado | URL pública, não segredo |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Web | quando usado | chave pública limitada por RLS |
| SESSION_SECRET | API/Web | sim | sessão assinada |
| NEXT_PUBLIC_API_URL | Web | produção | URL do backend |
| STRIPE_SECRET_KEY | API | cobrança | Stripe server-side |
| STRIPE_WEBHOOK_SECRET | API | cobrança | autenticação de webhook |

Separação comprovada: local e produção usam secrets distintos. Separação DEV/STAGING/PROD: não comprovada porque staging não existe/foi identificado.
