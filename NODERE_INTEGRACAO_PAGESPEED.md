# NODERE — Integração PageSpeed

Data: 2026-07-19  
Estado de produção: **NÃO CONFIGURADA**

## Implementação concluída

- análise real em estratégias mobile e desktop;
- coleta de Performance, SEO, Acessibilidade e Boas Práticas;
- retry limitado, timeout e resposta nula/502 em falha;
- nenhuma conversão de indisponibilidade em score zero ou “conectado”;
- proteção do scanner contra SSRF, DNS privado, localhost, credenciais na URL, portas fora de 80/443, redirects inseguros e corpo acima de 2 MB.

## Evidência final

O health de produção indica `pageSpeedConfigured: false`. Portanto a chamada real ao Google PageSpeed não foi executável e não é certificada. Uma tentativa pelo navegador também foi bloqueada localmente pelo cliente, mas isso não altera o diagnóstico principal: falta a chave de servidor.

## Para certificar

1. habilitar a API PageSpeed no projeto Google correto;
2. criar/restringir a chave para a API e ambiente de servidor;
3. definir `GOOGLE_PAGESPEED_API_KEY` no Render;
4. testar um domínio público controlado em mobile e desktop;
5. confirmar as quatro categorias e tratamento de quota/timeout;
6. monitorar custo/quota e nunca expor a chave no frontend.
