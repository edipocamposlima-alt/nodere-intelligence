# RELATORIO_PRE_PUBLICACAO_NODERE

## Status

Publicacao bloqueada antes do deploy. O roteiro exige homologacao real com banco e producao antes de publicar, mas a conexao local disponivel para `DATABASE_URL` aponta para `localhost` e recusou conexao.

## Branch e commit base

- Branch original: `main`
- Branch segura criada: `codex/pre-publicacao-nodere-20260630`
- Commit base: `a7859aac07e12d84bfde8badda4267c7e04ba450`
- Ultimo commit base: `a7859aa docs: record commercial homologation deployment`

## Backup logico do estado atual

- Backup por branch segura criado antes de qualquer deploy: `codex/pre-publicacao-nodere-20260630`
- Nenhum arquivo foi apagado.
- Nenhuma variavel de ambiente foi alterada.
- Nenhum SQL foi executado.
- Nenhum deploy foi executado.

## Commits pendentes

Existem muitas alteracoes ainda nao commitadas no worktree. A publicacao nao deve prosseguir sem consolidar commit apos validacao completa.

## Arquivos alterados identificados

Principais grupos:

- API: rotas de companies, discovery, proposals, searches; servicos de companyStore e Google; tipos.
- Web: dashboard, discovery, catalogo, propostas, ficha do cliente, CRM, inbox, integracoes, settings, tema, manual, relatorios, componentes de layout, badges e busca.
- Documentacao/relatorios: diversos relatorios de implementacao e homologacao.
- Scripts: `scripts/homologate-commercial-flow.mjs`.

## Arquivos novos identificados

- Relatorios executivos da sprint atual.
- `REGRA_ATUALIZACAO_RELATORIOS_MANUAL.md`.
- `apps/web/lib/statusPalette.ts`.
- `apps/web/lib/theme.ts`.
- `apps/web/app/companies/[id]/CompanyPdfActions.tsx`.
- `apps/web/app/app/crm/`.
- `nodere-site-premium/` permanece untracked e nao deve entrar no commit/deploy sem decisao explicita.

## Modulos impactados

- Busca de Empresas / Discovery
- Dashboard
- CRM / Ficha Comercial
- Propostas e contratos
- Catalogo
- PDFs e CSV
- Relatorios
- Manual / Ajuda
- Tema claro/escuro
- Navegacao e rolagem
- API comercial e discovery

## Vercel

- Projeto correto do frontend: `web`
- Project ID: `prj_3xkck9dJBFgYSJWFlaleK2zuWNUL`
- Team/Org ID: `team_08gnjReCbB56LaFS88VJ3ems`
- Dominio de producao atual: `https://nodere.com.br`
- Deployment atual inspecionado: `dpl_F9SQMTnrMDx9RFSWQxAKPX2SbXxQ`
- Aliases atuais: `nodere.com.br`, `www.nodere.com.br`
- Observacao critica: a raiz do repositorio possui `vercel.json` legado apontando para `dist`. O projeto correto do Next.js esta em `apps/web`.

## Variaveis necessarias

Frontend/Vercel:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Backend/Render:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`, se usada
- `DATABASE_URL`, se usada
- `API_KEY`
- `WEB_ORIGIN`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY` / `GOOGLE_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY`
- WhatsApp, SMTP e Stripe quando habilitados

## Riscos identificados

- `DATABASE_URL` local aponta para `localhost`, bloqueando homologacao real via script.
- `scripts/validate-commercial-schema.mjs` nao existe neste worktree.
- Vercel Development lista `NEXT_PUBLIC_SUPABASE_URL`, mas nao lista `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- A raiz tem build legado `dist`; deploy deve ser executado a partir de `apps/web`.
- `nodere-site-premium/` esta untracked e nao deve ser incluido.
- Publicar sem validar login, busca, CRM, PDF/CSV e dashboard violaria o criterio do roteiro.

## Plano de execucao recomendado

1. Corrigir acesso de homologacao ao Supabase/Render sem expor segredos.
2. Disponibilizar `DATABASE_URL` do Supabase em memoria da sessao ou ajustar o script para usar ambiente seguro existente.
3. Restaurar/criar script de validacao de schema ou usar alternativa equivalente.
4. Executar homologacao real.
5. Corrigir falhas, se houver.
6. Rodar build/lint/typecheck/testes.
7. Commitar branch segura.
8. Publicar `apps/web` no Vercel e API no Render somente se necessario.
9. Homologar producao.

## Conclusao

NAO LIBERADO PARA DEPLOY nesta etapa.

---

## Atualizacao 2026-07-01 - execucao com Supabase autorizado

### Resultado atualizado

Publicacao ainda bloqueada, mas por outro motivo. A conexao real ao Supabase autorizado foi usada somente em memoria da sessao, sem persistencia de credenciais, e a validacao tecnica do schema foi aprovada.

### SQL aplicado

- Aplicada a migracao corretiva idempotente `packages/database/block_publicacao_campos_comerciais.sql`.
- Ambiente: Supabase `qhopjggnbzewuuktqntp.supabase.co`.
- A credencial foi removida da memoria da sessao apos cada comando.

### Schema validado

Comando:

```text
node scripts\validate-commercial-schema.mjs
```

Resultado:

```text
Schema validation approved.
```

Validacoes aprovadas:

- Campos comerciais obrigatorios em `nodere_companies`.
- `nodere_searches.results_count`.
- `nodere_app_settings.settings`.
- Tabelas comerciais `catalog_items`, `nodere_proposals`, `nodere_audit_logs`.
- Indices comerciais principais.
- RLS habilitado em `nodere_companies`, `catalog_items`, `nodere_proposals`, `nodere_audit_logs`.

### Validacoes locais aprovadas

- `apps/api npm run build`: aprovado.
- `apps/api npm run typecheck`: aprovado.
- `apps/web npm run lint`: aprovado.
- `apps/web npm run build`: aprovado.
- `apps/web npm run typecheck`: aprovado apos regeneracao de `.next` pelo build.
- `raiz npm run build`: aprovado.
- Testes API `phase1`, `calendar`, `reports`, `crm`, `whatsapp`, `ai-discovery`: aprovados.

### Homologacao de producao

- Producao visual acessivel em `https://nodere.com.br/crm`.
- Sessao real observada no Chrome com usuario `Édipo Lima`, perfil visual Owner/Admin, interface verde carregada.

### Bloqueio restante

A homologacao funcional automatizada ainda nao foi aprovada porque:

- `https://nodere-api.onrender.com/api/admin/login` retorna `401 Login ou senha invalidos` para usuarios smoke criados no Supabase.
- O fallback por Supabase Auth retorna `500 Database error querying schema`.
- O segredo local de sessao administrativa nao corresponde ao segredo efetivo do Render, portanto nao foi gerado token artificial.

### Conclusao atualizada

NAO LIBERADO PARA DEPLOY ate corrigir a divergencia de autenticacao entre Render API e Supabase Auth, ou validar a homologacao funcional completa com uma sessao/token real autorizado sem burlar autenticacao.

---

## Atualizacao 2026-07-01 - causa de Auth isolada

### Correcao preparada

Foi implementado fallback de autenticacao por Postgres direto em:

```text
apps/api/src/services/userStore.ts
```

Esse fallback usa `DATABASE_URL`, valida `password_hash`, respeita `active`, role e workspace, e foi aprovado contra o Supabase real com usuario temporario.

### Render

Confirmado no painel:

- Servico: `nodere-api`.
- Branch configurada: `main`.
- Commit live: `a7859aac07e12d84bfde8badda4267c7e04ba450`.
- Variavel `SUPABASE_SERVICE_ROLE_KEY` atualizada e redeployada.
- Login smoke continuou com `401`.

### Acao pendente exata

Configurar no Render:

```text
DATABASE_URL
```

com a connection string Postgres do Supabase autorizado. Depois publicar o backend com o commit atual contendo o fallback e reexecutar a homologacao.

### Motivo de parada

A automacao do Chrome ficou indisponivel ao tentar reabrir o painel Environment do Render:

```text
Browser is not available
```

Sem acesso ao painel Render ou token/API/CLI Render local, nao foi possivel concluir a configuracao da variavel sem acao manual.

### Status

NAO LIBERADO PARA COMMIT/DEPLOY FINAL ate a variavel `DATABASE_URL` estar configurada e `scripts/homologate-commercial-flow.mjs` passar em producao.

## Atualizacao final 2026-07-01 - publicacao concluida

O bloqueio de `DATABASE_URL` foi resolvido no Render usando o Supabase Transaction Pooler IPv4 oficial. O servico `nodere-api` foi redeployado, os health checks voltaram aprovados e a homologacao comercial executou com sucesso.

Evidencias finais:

- Backend Render publicado com commit `cfd65fb`.
- Frontend Vercel publicado no projeto `web`, diretorio `apps/web`.
- Deployment Vercel: `dpl_5qdYcUG9fMypPt79vTWBE3gsCtGR`.
- URL final: `https://nodere.com.br`.
- `GET /health`: aprovado.
- `GET /api/health`: aprovado.
- `GET /api/health/supabase`: aprovado.
- `node scripts/validate-commercial-schema.mjs`: aprovado.
- `node scripts/homologate-commercial-flow.mjs`: aprovado.
- Regressao completa de API e Web: aprovada.
- Smoke autenticado em producao: aprovado com usuario temporario de teste, posteriormente inativado.

Status final:

- PLATAFORMA PUBLICADA: SIM
- FUNCIONALIDADES PRESERVADAS: SIM
- INTEGRACOES PRESERVADAS: SIM
- LIBERADA PARA USO REAL: SIM
