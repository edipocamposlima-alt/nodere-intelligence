# NODERE — Integração Anthropic

Data: 2026-07-19  
Estado de produção: **NÃO CONFIGURADA**

O health agora executa probe autenticado real do endpoint de modelos, com timeout de 8 segundos, resultado em cache por 5 minutos e erro sanitizado. Configuração presente e operação aprovada são estados separados.

Na verificação final, `ANTHROPIC_API_KEY` não está disponível no Render; o provedor aparece como `down/not configured`. Nenhuma chamada de geração foi simulada e nenhum status verde foi fabricado.

## Para ativar

1. decidir se Anthropic faz parte do produto contratado;
2. criar chave com escopo e billing adequados;
3. armazenar somente no Render;
4. definir `AI_PROVIDER`/modelo conforme a decisão;
5. validar `/api/health/providers` e uma geração controlada;
6. registrar custo, rate limit, tratamento de erro e fallback;
7. rotacionar a chave após qualquer exposição suspeita.

Não inserir a chave na Vercel, frontend, arquivo `.env` versionado, documentação ou logs.
