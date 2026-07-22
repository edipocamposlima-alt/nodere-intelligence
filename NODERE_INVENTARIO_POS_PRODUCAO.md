# NODERE — Inventário Pós-Produção

Data: 2026-07-19  
Referência: `v1.1.0` / `098ef844...`

## Topologia oficial

| Camada | Origem | Produção | Estado |
|---|---|---|---|
| Web Next.js | `apps/web` | Vercel / `nodere.com.br` | READY |
| API Express/TypeScript | `apps/api` | Render / `nodere-api.onrender.com` | live |
| PostgreSQL/Auth | Supabase `qhopjggnbzewuuktqntp` | `sa-east-1`, PostgreSQL 17.6 | operacional; hardening pendente |
| Banco compartilhado | `packages/database` | scripts SQL versionados | migração preparada, não aplicada |

## Superfície funcional validada

- autenticação, renovação de sessão e logout;
- Dashboard executivo e onboarding orientado por dados;
- Busca/Discovery, Google Places e salvamento no CRM;
- Empresas, Ficha 360, observações, agenda e histórico;
- CRM em pipeline/lista, etapas e filtros;
- propostas, contratos, produtos/serviços e PDFs;
- Caixa de Entrada, WhatsApp manual/webhook e templates;
- Automações, IA, relatórios, marketing, faturamento e operadores;
- Integrações, configurações, Admin/CMS, Manual e PWA.

## Dados observados no Supabase

| Métrica | Quantidade |
|---|---:|
| Empresas | 827 |
| Notas | 520 |
| Perfis de plataforma | 162 |
| Perfis ativos | 1 |
| Perfis inativos | 161 |
| Workspaces | 1 |
| Contas Supabase Auth | 2 |
| Tabelas com RLS | 49 |

## Inventário de integrações

Quinze provedores são representados no health: Supabase, Google Places, Google Maps, Google Business Profile, PageSpeed, WhatsApp Cloud, OpenAI, Anthropic, Econodata, Apollo, Bling, RD Station, Stripe, SMTP e Meta. Na produção final, 5/15 têm configuração detectada; somente Supabase e OpenAI possuem probe real aprovado. Places, Maps e Apollo estão configurados, mas aguardam certificação específica de ida e volta.

## Configuração crítica

- presentes e validadas por probe: Supabase e OpenAI;
- presentes, sem probe genérico conclusivo: Google Places, Google Maps e Apollo;
- ausentes na leitura final: Anthropic e PageSpeed;
- webhooks Meta falham fechados enquanto `META_APP_SECRET` não estiver configurado;
- CORS aceita apenas origens oficiais/explicitamente declaradas.

## Artefatos operacionais

- migração: `packages/database/audit_final_security_hardening.sql`;
- rollback: `packages/database/audit_final_security_hardening_rollback.sql`;
- reconciliação: `scripts/reconcile-auth-users.mjs`;
- agregado: `NODERE_RECONCILIACAO_AUTH_RESULTADO.csv`;
- smoke E2E: testes Playwright do workspace;
- manual oficial: `docs/manual-nodere.md`.
