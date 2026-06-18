# NODERE - Release v0.7

Data da release: 12/06/2026

## Checkpoint oficial

Release oficial para registrar o fechamento do BLOCO 04 de Billing/Stripe/SMTP em modo preparado, sem configuracao real de Stripe ou SMTP em producao.

## Referencias

- Commit BLOCO 04: `ecd70ccfb74025d1418ce62ffb9e9342c2e50063`
- Deploy: `dpl_CCN5nBVEAC5aBz3NuGdwY9hRVakc`
- URL producao: https://nodere.com.br
- Tag: `v0.7-stable`

## Funcionalidades homologadas

- BLOCO 01: autenticacao e compatibilidade Supabase Auth concluida
- BLOCO 02: configuracoes, integracoes, masked values e permissoes concluido
- BLOCO 03: site publico e catalogo concluido
- BLOCO 04: billing persistente preparado
- BLOCO 05/06: Discovery e CRM concluidos
- Health check da API em producao validado
- Planos `demo`, `starter`, `pro` e `agency` expostos em `/api/billing/plans`
- Endpoint `/api/contact` preservado
- SMTP sem configuracao retorna erro controlado
- Checkout sem autenticacao retorna `401`
- Webhook Stripe sem configuracao nao quebra a API
- Builds de `apps/api` e `apps/web` validados

## Pendencias controladas

- SMTP nao configurado
- Stripe nao configurado
- Teste checkout autenticado nao executado por ausencia de credenciais reais

## Observacoes

- Nenhum deploy adicional foi executado durante este checkpoint.
- Nenhuma alteracao de banco foi executada durante este checkpoint.
- Nenhuma alteracao em frontend ou backend foi feita alem desta documentacao de release.
