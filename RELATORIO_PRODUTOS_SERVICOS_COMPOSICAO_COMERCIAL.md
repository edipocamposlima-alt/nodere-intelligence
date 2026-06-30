# Relatorio - Produtos/Servicos e Composicao Comercial

## Objetivo executado

Fortalecer a aba Produtos/Servicos como fonte oficial dos itens comerciais usados em propostas, contratos, snapshots, descontos, auditoria e PDFs.

## Estado implementado

- Catalogo de produtos/servicos permanece em `catalog_items`.
- Apenas `owner` e `admin` podem criar, editar e inativar itens via API.
- `operator` e `viewer` mantem leitura do catalogo.
- Inativacao do catalogo e logica, via `status = inactive`, com usuario/data de remocao logica.
- Propostas passam a aceitar somente itens ativos do catalogo.
- Cadastro manual/livre de itens na proposta foi removido da tela autenticada.
- A API grava snapshot comercial dos itens selecionados dentro de `nodere_proposals.items`.
- Desconto e aplicado por item, por percentual OU valor.
- Motivo do desconto e obrigatorio quando houver desconto.
- PDF de proposta e contrato usa o snapshot salvo.
- Observacoes internas, motivo interno de desconto e auditoria nao sao renderizados no PDF.
- Auditoria de criacao/alteracao/PDF registra itens, valores e desconto em `nodere_audit_logs`.

## Arquivos principais alterados

- `apps/api/src/routes/catalog.ts`
- `apps/api/src/routes/proposals.ts`
- `apps/web/app/catalog/CatalogClient.tsx`
- `apps/web/app/app/proposals/page.tsx`
- `apps/web/lib/api.ts`
- `packages/database/block_produtos_servicos_composicao_comercial.sql`

## Migracao criada

Arquivo:

`packages/database/block_produtos_servicos_composicao_comercial.sql`

Conteudo tecnico:

- adiciona campos comerciais complementares ao catalogo;
- adiciona controle de criacao/edicao/inativacao logica;
- garante `billing_unit`;
- adiciona check idempotente para unidade de cobranca;
- garante colunas comerciais em `nodere_proposals`;
- cria indices para catalogo ativo, snapshot JSONB e auditoria de propostas;
- recarrega schema do PostgREST.

## Regras preservadas

- Nenhuma tabela existente foi recriada.
- Nenhuma API comercial foi duplicada.
- Nenhuma regra de CRM, Discovery, Dashboard, Supabase ou autenticacao foi alterada fora do fluxo comercial.
- Fluxo autenticado segue dependendo de workspace/session existente.
- Propostas antigas continuam legiveis porque o PDF ainda considera fallback para itens legados, quando necessario.

## Pendencias operacionais

- Aplicar manualmente a migracao em staging/Supabase antes de homologar dados reais.
- Validar em ambiente autenticado real:
  - owner/admin cria, edita e inativa catalogo;
  - operator/viewer nao cria nem edita;
  - proposta aceita apenas item ativo;
  - desconto percentual/valor e motivo obrigatorio;
  - snapshot permanece apos alteracao futura do catalogo;
  - PDF usa snapshot e oculta dados internos.

## Validacoes executadas

- `apps/api`: `npm run typecheck`
- `apps/api`: `npm run build`
- `apps/web`: `npm run typecheck`
- `apps/web`: `npm run lint`
- `apps/web`: `npm run build`
- raiz: `npm run build`

Observacao: o primeiro build web sem variaveis de ambiente falhou em `/admin/blog` por `supabaseUrl is required`. O build foi repetido com variaveis de producao carregadas apenas em memoria/arquivo temporario fora do repositorio e foi aprovado.
