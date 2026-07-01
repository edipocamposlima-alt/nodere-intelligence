# RELATORIO_SCHEMA_PUBLICACAO_NODERE

## Status

Validacao de schema bloqueada por credencial local inadequada para homologacao real.

## Evidencia

Comando executado:

```text
node scripts\validate-commercial-schema.mjs
```

Resultado:

```text
MODULE_NOT_FOUND: scripts\validate-commercial-schema.mjs
```

Comando substituto de diagnostico sanitizado:

```text
DATABASE_URL_PRESENT true
DB_HOST localhost
DB_PROTOCOL postgresql:
DB_CONNECT_ERROR ECONNREFUSED AggregateError
```

## Tabelas e objetos esperados pela aplicacao

- `nodere_workspaces`
- `nodere_platform_users`
- `nodere_companies`
- `nodere_company_notes`
- `nodere_searches`
- `nodere_app_settings`
- `catalog_items`
- `nodere_proposals`
- `nodere_audit_logs`
- `inbox_messages`
- `schedules`
- `user_metrics`
- `nodere_discovery_runs`
- `nodere_ai_usage_log`

## Migracoes presentes no repositorio

- `packages/database/block_admin_cms.sql`
- `packages/database/block_produtos_servicos_composicao_comercial.sql`
- `packages/database/block02_interface_settings.sql`
- `packages/database/block03_catalog_items.sql`
- `packages/database/block03_crm_inteligente_existing_schema.sql`
- `packages/database/block04_billing.sql`
- `packages/database/block04_discovery_score_ia_existing_schema.sql`
- `packages/database/block05_06_discovery_crm_existing_schema.sql`
- `packages/database/block05_propostas_billing_admin_existing_schema.sql`
- `packages/database/block08_commercial_calendar.sql`
- `packages/database/schema.sql`

## Alteracoes SQL nesta etapa

Nenhuma. Nao foi executado SQL, nao houve alteracao de banco e nao houve migração aplicada.

## Riscos

- Sem conexao com o Supabase real, nao e possivel confirmar colunas, indices, constraints, RLS e policies antes da publicacao.
- O script de schema citado em etapas anteriores nao esta presente.
- O `DATABASE_URL` local aponta para `localhost`; o banco oficial de producao/homologacao nao foi validado nesta execucao.

## Acao necessaria

Disponibilizar `DATABASE_URL` correto do Supabase apenas em memoria da sessao, ou restaurar um mecanismo seguro de validacao de schema conectado ao ambiente oficial. Depois executar a validacao real antes de qualquer deploy.

## Conclusao

Schema NAO VALIDADO para publicacao nesta etapa.

---

## Atualizacao 2026-07-01 - schema validado no Supabase autorizado

### Script recriado

Foi criado `scripts/validate-commercial-schema.mjs` para validar o schema real de forma segura:

- usa `DATABASE_URL` remoto quando disponivel;
- recusa conexao Postgres local para homologacao real;
- usa REST do Supabase como fallback somente para validar existencia de campos;
- nao imprime credenciais.

### Migracao complementar aplicada

Arquivo:

```text
packages/database/block_publicacao_campos_comerciais.sql
```

Objetivo:

- completar campos comerciais obrigatorios em `nodere_companies`;
- adicionar `nodere_searches.results_count`;
- adicionar `nodere_app_settings.settings`;
- criar indices auxiliares idempotentes.

### Resultado da validacao Postgres

Ambiente validado:

```text
qhopjggnbzewuuktqntp.supabase.co
```

Resultado:

```text
Schema validation approved.
```

Objetos confirmados:

- `nodere_companies`: segmento, empresa, cidade, estado, CNPJ, telefone, email, site, avaliacao, avaliacoes, score, maps, resumo, place_id, workspace/status/timestamps.
- `nodere_searches`: workspace, filtros e `results_count`.
- `catalog_items`: catalogo comercial.
- `nodere_proposals`: propostas, itens/snapshot, subtotal/desconto/total.
- `nodere_audit_logs`: auditoria comercial.
- `nodere_app_settings`: settings por workspace.
- Indices: `idx_companies_workspace`, `idx_companies_city_state`, `idx_companies_score`, `idx_searches_workspace`, `idx_catalog_items_commercial_active`, `idx_nodere_proposals_commercial_snapshot`, `idx_nodere_audit_logs_proposal_actions`.
- RLS: habilitado em `nodere_companies`, `catalog_items`, `nodere_proposals`, `nodere_audit_logs`.

### Status atualizado

Schema APROVADO tecnicamente para os modulos comerciais e de publicacao.

Bloqueio remanescente fora do schema: autenticacao de producao entre Render API e Supabase Auth.

## Atualizacao final 2026-07-01 - schema e runtime aprovados

O bloqueio fora do schema foi resolvido apos configuracao da `DATABASE_URL` oficial do Supabase Transaction Pooler IPv4 no Render e redeploy completo do servico `nodere-api`.

Resultado final:

- Supabase autorizado: `qhopjggnbzewuuktqntp.supabase.co`.
- Pooler IPv4 usado em runtime pelo Render.
- `GET /health`: aprovado.
- `GET /api/health`: aprovado.
- `GET /api/health/supabase`: aprovado.
- `node scripts/validate-commercial-schema.mjs`: aprovado.
- `node scripts/homologate-commercial-flow.mjs`: aprovado.
- Erros eliminados: `password authentication failed`, `ENETUNREACH IPv6`, `Database error querying schema` e `HTTP 401` indevido no fluxo owner/admin validado.

Status final:

- PLATAFORMA PUBLICADA: SIM
- FUNCIONALIDADES PRESERVADAS: SIM
- INTEGRACOES PRESERVADAS: SIM
- LIBERADA PARA USO REAL: SIM
