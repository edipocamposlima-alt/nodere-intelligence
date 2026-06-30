# Homologacao - Produtos/Servicos e Composicao Comercial

## Resultado executivo

**NAO LIBERADO PARA DEPLOY.**

A implementacao de codigo passou nas validacoes locais e a migracao SQL foi aplicada no Supabase autorizado. A conclusao operacional, porem, ainda nao pode ser marcada como aprovada porque a homologacao com sessao real no backend de producao falhou na autenticacao dos usuarios de teste criados no Supabase autorizado.

## SQL aplicado

**Aplicado com sucesso.**

Arquivo pendente:

`packages/database/block_produtos_servicos_composicao_comercial.sql`

Execucao:

- Backup logico criado antes do SQL: `BACKUP_LOGICO_COMERCIAL_PRE_MIGRACAO.md`.
- Script executado: `scripts/apply-commercial-migration.mjs`.
- Migração aplicada: `packages/database/block_produtos_servicos_composicao_comercial.sql`.
- Schema validado apos aplicacao.

Observacao: a aplicacao foi feita somente apos autorizacao explicita para usar `qhopjggnbzewuuktqntp.supabase.co` como ambiente valido do NODERE para homologacao/publicacao.

## Ambiente usado

- Workspace local: `C:\Users\edipo\OneDrive\Documentos\Google ADS`
- Branch/worktree atual: nao alterado por commit nesta etapa.
- Ambiente de banco: Supabase `qhopjggnbzewuuktqntp.supabase.co`, autorizado explicitamente para esta etapa.
- Ambiente frontend usado para build: variaveis Vercel Production carregadas temporariamente em memoria/arquivo temporario fora do repositorio para executar `next build`.

Variaveis usadas no build web com Vercel env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_KEY` estava vazia em Production.

Nenhuma credencial foi gravada em arquivo do repositorio.

## Usuario/perfil testado

Tentativa executada com usuarios de teste criados no Supabase autorizado:

- `smoke+SMOKE_TEST_DELETE_*_owner@nodere.com.br`
- `smoke+SMOKE_TEST_DELETE_*_admin@nodere.com.br`
- `smoke+SMOKE_TEST_DELETE_*_operator@nodere.com.br`
- `smoke+SMOKE_TEST_DELETE_*_viewer@nodere.com.br`

Resultado: bloqueado. O backend real `https://nodere-api.onrender.com` retornou `401 Login ou senha invalidos` para login legado. O fallback via Supabase Auth tambem falhou:

- tentativa com insercao direta no schema Auth: `Database error querying schema`;
- tentativa pelo fluxo publico `signup` + confirmacao via Postgres autorizado: o signup nao criou usuario consultavel no banco para o e-mail smoke.

Tambem foi verificado o Chrome do usuario:

- havia aba `https://nodere.com.br/catalog` visualmente logada como `Édipo Lima`;
- a pagina nao expunha `nodere_admin_token` em `localStorage`;
- `document.cookie` estava vazio para a leitura no contexto da pagina;
- portanto a aba nao forneceu uma sessao API reutilizavel para homologacao automatica.

O dashboard Render foi aberto em `https://dashboard.render.com/`, mas apareceu a tela `Sign In to Render`. Sem login no Render, nao foi possivel auditar diretamente `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `DATABASE_URL` ou ajustes Auth/JWT do servico.

## Testes funcionais obrigatorios

| Teste | Resultado |
| --- | --- |
| owner/admin cria produto/servico | Bloqueado - backend real nao autenticou usuarios smoke do Supabase autorizado |
| owner/admin edita produto/servico | Bloqueado - backend real nao autenticou usuarios smoke do Supabase autorizado |
| owner/admin inativa produto/servico | Bloqueado - backend real nao autenticou usuarios smoke do Supabase autorizado |
| operator/viewer apenas visualizam catalogo | Bloqueado - backend real nao autenticou usuarios smoke do Supabase autorizado |
| proposta so permite item ativo do catalogo | Bloqueado - requer sessao real no backend |
| proposta nao aceita item manual/livre | Validado por codigo/tela; pendente validacao real |
| desconto percentual funciona | Bloqueado - requer sessao real no backend |
| desconto em valor funciona | Bloqueado - requer sessao real no backend |
| percentual e valor juntos sao bloqueados | Validado por codigo/API; pendente validacao real |
| motivo obrigatorio quando houver desconto | Validado por codigo/API; pendente validacao real |
| snapshot comercial salvo corretamente | Bloqueado - requer sessao real no backend |
| alteracao posterior no catalogo nao altera proposta | Bloqueado - requer sessao real no backend |
| auditoria registra criacao/alteracao/PDF | Bloqueado - requer sessao real no backend |
| PDF usa snapshot salvo | Validado por codigo; pendente geracao real |
| PDF nao expoe observacoes internas | Validado por codigo; pendente geracao real |
| PDF nao expoe motivo interno do desconto | Validado por codigo; pendente geracao real |

## Erros encontrados

1. Backend real `https://nodere-api.onrender.com` nao autenticou usuarios criados em `qhopjggnbzewuuktqntp.supabase.co`.
2. Supabase Auth retornou `Database error querying schema` ao tentar emitir token para usuarios Auth smoke criados via Postgres.
3. Fluxo publico Supabase Auth `signup` nao criou usuario smoke consultavel para posterior confirmacao.
4. Render dashboard requer login; variaveis secretas nao puderam ser auditadas diretamente nesta sessao.
5. Banco real nao possui coluna `status` em `nodere_platform_users`; limpeza smoke foi feita usando `active=false`, respeitando o schema real.
6. Build web sem env local falha em `/admin/blog` com `supabaseUrl is required`; isso e resolvido quando as variaveis Vercel sao carregadas temporariamente.

## Correcoes feitas

Nesta etapa foram adicionados scripts seguros de apoio operacional:

- `scripts/apply-commercial-migration.mjs`
- `scripts/homologate-commercial-flow.mjs`

As alteracoes ja presentes no worktree antes desta homologacao permanecem:

- API de catalogo com permissao `owner/admin`.
- API de propostas com snapshot de catalogo, desconto por item, auditoria e PDF por snapshot.
- Tela de catalogo com leitura para operator/viewer e edicao para owner/admin.
- Tela de propostas usando somente itens ativos do catalogo.
- Tipos/client API ajustados.
- SQL complementar criado.

## Arquivos alterados

- `apps/api/src/routes/catalog.ts`
- `apps/api/src/routes/proposals.ts`
- `apps/web/app/catalog/CatalogClient.tsx`
- `apps/web/app/app/proposals/page.tsx`
- `apps/web/lib/api.ts`
- `packages/database/block_produtos_servicos_composicao_comercial.sql`
- `RELATORIO_PRODUTOS_SERVICOS_COMPOSICAO_COMERCIAL.md`
- `HOMOLOGACAO_PRODUTOS_SERVICOS_COMPOSICAO_COMERCIAL.md`
- `BACKUP_LOGICO_COMERCIAL_PRE_MIGRACAO.md`
- `scripts/apply-commercial-migration.mjs`
- `scripts/homologate-commercial-flow.mjs`

## Comandos executados

- `git status --short`
- `Get-Content RELATORIO_PRODUTOS_SERVICOS_COMPOSICAO_COMERCIAL.md`
- `rg ... DATABASE_URL|SUPABASE|SERVICE_ROLE ...`
- `vercel env ls`
- `vercel env pull --environment=production`
- `vercel env pull --environment=development`
- `node scripts/apply-commercial-migration.mjs`
- `node scripts/homologate-commercial-flow.mjs`
- `npm run build` em `apps/api`
- `npm run typecheck` em `apps/api`
- `npm run lint` em `apps/web`
- `npm run typecheck` em `apps/web`
- `npm run build` em `apps/web` com env Vercel temporario
- `npm run build` na raiz

## Commit criado

Nenhum commit criado.

Motivo: a regra do pedido exige commit somente se tudo passar. Como a homologacao real autenticada falhou no backend, nao ha commit nesta etapa.

## nodere-site-premium

`nodere-site-premium/` continua untracked. Nao foi alterado e nao deve ser incluido no commit deste fluxo comercial sem decisao explicita.

## Pendencias restantes

1. Confirmar/corrigir no Render se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apontam para `qhopjggnbzewuuktqntp.supabase.co`.
2. Fazer login no dashboard Render aberto no Chrome e confirmar as variaveis secretas do servico `nodere-api`/`nodere-ts-api`.
3. Corrigir o erro de Supabase Auth `Database error querying schema` para usuarios smoke, ou fornecer credencial real de owner/admin para smoke test.
4. Executar homologacao autenticada real com perfis `owner/admin/operator/viewer`.
5. Gerar PDF real e validar conteudo.
6. Confirmar auditoria em `nodere_audit_logs`.
7. Criar commit somente depois da homologacao real aprovada.

## Atualizacao operacional - 2026-06-30

Após acesso ao Render, foi confirmado que o serviço da API é `nodere-api`, em `https://nodere-api.onrender.com`, vinculado ao repositório GitHub `edipocamposlima-alt/nodere-intelligence` na branch `main`.

O painel Render confirmou `SUPABASE_URL=https://qhopjggnbzewuuktqntp.supabase.co` e `SUPABASE_SERVICE_ROLE_KEY` configurada. A chave não foi gravada em arquivo do repositório e não deve ser exposta em logs.

Com a service role correta em memória de sessão, o script `scripts/homologate-commercial-flow.mjs` conseguiu autenticar usuários smoke reais dos perfis `owner`, `admin`, `operator` e `viewer`.

Resultado mais recente da homologação:

| Teste | Resultado |
| --- | --- |
| login real por perfil owner/admin/operator/viewer | Aprovado |
| owner cria produto/servico | Aprovado |
| admin edita produto/servico | Aprovado |
| operator nao cria catalogo | Reprovado - API publicada retornou HTTP 201 |
| viewer nao edita catalogo | Aprovado |
| viewer visualiza catalogo | Aprovado |
| proposta nao aceita item manual/livre | Reprovado - API publicada retornou HTTP 201 |
| motivo obrigatorio quando houver desconto | Reprovado - API publicada retornou HTTP 400 com contrato antigo |
| percentual e valor juntos sao bloqueados | Reprovado - API publicada retornou HTTP 400 com contrato antigo |
| desconto percentual | Reprovado - API publicada retornou HTTP 400 com contrato antigo |

Causa tecnica atual: o Render ainda esta servindo o commit `5b60a95`, enquanto as correcoes de API/catalogo/propostas existem apenas no worktree local. Portanto, a falha atual nao e mais de conectividade/autenticacao Supabase, e sim de divergencia entre o codigo local homologado por build e o codigo efetivamente publicado na API Render.

Validacoes locais executadas apos esta constatacao:

- `apps/api`: `npm run build` aprovado.
- `apps/api`: `npm run typecheck` aprovado.
- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run build` aprovado com variaveis de producao Vercel carregadas em `.env.local` local ignorado.
- `apps/web`: `npm run typecheck` aprovado apos geracao dos tipos Next.
- raiz: `npm run build` aprovado.

Artefatos ignorados confirmados fora do commit:

- `.env`
- `apps/web/.env.local`
- `apps/web/.vercel/`
- `apps/web/.next/`
- `apps/api/dist/`
- `apps/api/node_modules/`
- `apps/web/node_modules/`
- `dist/`
- logs locais

`nodere-site-premium/` permanece untracked, nao foi alterado e nao deve entrar neste commit/deploy.

## Recomendacao objetiva

**NAO LIBERADO PARA DEPLOY FINAL ATE A API RENDER RODAR O CODIGO NOVO E A HOMOLOGACAO REAL PASSAR.**

Proximo passo tecnico: versionar as correcoes comerciais, publicar a API Render com o commit novo, reexecutar `scripts/homologate-commercial-flow.mjs` contra `https://nodere-api.onrender.com` e somente entao publicar o frontend na Vercel.
