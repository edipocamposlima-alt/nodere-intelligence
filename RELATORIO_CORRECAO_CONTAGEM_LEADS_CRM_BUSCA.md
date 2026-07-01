# Relatorio - Correcao da contagem falsa de leads no CRM / Busca NODERE

## Status

APROVADO TECNICAMENTE.

Nao houve commit, push, deploy ou alteracao manual de banco nesta etapa.

## Causa raiz encontrada

A busca de empresas estava persistindo automaticamente resultados temporarios na mesma camada usada pelo CRM.

No backend, `searchCompaniesWithMeta` em `apps/api/src/services/companyStore.ts` chamava gravacao em memoria e Supabase durante a propria pesquisa. Como `Dashboard`, `CRM` e `Relatorios` usam `listCompaniesAsync`, esses resultados pesquisados passavam a inflar metricas como CRM ativo, score medio e indicadores comerciais antes de qualquer acao de "Salvar lead".

Tambem havia um acoplamento no frontend: o botao "Salvar lead" usava anotacao em empresa existente, o que pressupunha que o resultado de busca ja estava salvo como lead.

## Regra antiga

- Pesquisa gerava empresas.
- Empresas eram gravadas automaticamente na store/tabela de CRM.
- Dashboard, CRM e Relatorios contavam esses registros como leads.
- "Salvar lead" apenas adicionava sinal/anotacao sobre um registro que ja existia.
- Duplicidade nao era bloqueada no ponto central antes de salvar resultado de busca.

## Regra nova implementada

- Resultado de busca e temporario.
- Resultado de busca nao e persistido automaticamente.
- Dashboard, CRM, Relatorios e score medio usam somente leads salvos no CRM.
- O lead so passa a existir no CRM quando o usuario clica em "Salvar lead" ou "Salvar selecionadas".
- Antes de salvar, a API valida duplicidade na ordem:
  - `place_id`;
  - CNPJ;
  - telefone normalizado;
  - nome + cidade/estado;
  - site/dominio.
- Se ja existir, a API bloqueia a criacao duplicada e retorna:
  - `Lead já consta no banco de dados NODERE.`
- Buscas futuras filtram leads ja salvos e nao os exibem como novo resultado salvavel.
- Busca por CNPJ retorna o registro existente com a mensagem obrigatoria quando ja houver lead salvo.

## Arquivos alterados nesta correcao

- `apps/api/src/services/companyStore.ts`
- `apps/api/src/routes/searches.ts`
- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/discovery.ts`
- `apps/web/lib/api.ts`
- `apps/web/components/CompanyTable.tsx`
- `apps/web/components/SearchPanel.tsx`
- `RELATORIO_CORRECAO_CONTAGEM_LEADS_CRM_BUSCA.md`

Observacao: o worktree ja continha outros arquivos modificados de tarefas anteriores. Eles nao foram revertidos.

## Backend

- `searchCompaniesWithMeta` deixou de persistir resultados de busca.
- `listCompaniesAsync` e `getCompanyAsync` passaram a retornar somente registros classificados como leads reais do CRM.
- `saveCompanies` passou a marcar explicitamente itens salvos como lead de CRM e aplicar deduplicacao.
- Novo fluxo `saveSearchResultAsCrmLead` centraliza o salvamento de resultado temporario no CRM.
- Novo fluxo `filterUnsavedSearchResults` remove da listagem principal os resultados que ja existem como CRM lead.
- `POST /companies/save-from-search` salva resultado temporario como lead real, com bloqueio de duplicidade.
- `POST /searches` e `POST /searches/:id/rerun` retornam apenas resultados temporarios ainda nao salvos e informam duplicidades.
- `GET /searches/cnpj` identifica lead existente antes de retornar novo resultado salvavel.
- `POST /discovery/search` e `POST /discovery/add-to-crm` usam a mesma regra de deduplicacao.

## Frontend

- `saveSearchResultAsLead` foi adicionado em `apps/web/lib/api.ts`.
- `CompanyTable` passou a salvar leads usando a rota correta de CRM, em vez de depender de anotacao em registro ja persistido.
- "Salvar selecionadas" reutiliza o mesmo fluxo seguro de salvamento individual.
- Erro `409` de duplicidade exibe a mensagem obrigatoria.
- `SearchPanel` limpa resultados anteriores no inicio de nova busca e exibe contadores/textos como resultados temporarios da busca atual.
- Busca por CNPJ exibe aviso quando o lead ja existe no banco NODERE.

## Evidencias tecnicas

Comandos executados:

- `npm run typecheck` em `apps/api`
- `npm run build` em `apps/api`
- `npm run lint` em `apps/web`
- `npm run typecheck` em `apps/web`
- `npm run build` em `apps/web`
- `npm run build` na raiz
- `git diff --check`

Resultados:

- API typecheck: aprovado.
- API build: aprovado.
- Web lint: aprovado.
- Web typecheck: aprovado.
- Web build: aprovado.
- Build raiz: aprovado.
- `git diff --check`: sem erro de whitespace; apenas avisos de conversao LF/CRLF ja existentes no ambiente Windows.

## Validacao dos cenarios obrigatorios

- Cenario 1, busca nova nao aumenta CRM ativo: aprovado por correcao de arquitetura. A busca nao executa mais `dbUpsert` nem `syncToMem` para resultados temporarios.
- Cenario 2, salvar apenas 1 lead aumenta CRM em +1: aprovado por fluxo. Apenas `POST /companies/save-from-search`/`saveCompanies` grava como CRM lead.
- Cenario 3, resultados temporarios anteriores descartados: aprovado no frontend; `SearchPanel` limpa resultados ao iniciar nova busca e nao ha persistencia automatica.
- Cenario 4, lead salvo nao aparece como novo resultado: aprovado no backend; `filterUnsavedSearchResults` remove duplicados da listagem.
- Cenario 5, tentativa de salvar duplicado bloqueada: aprovado no backend; retorno `409` com mensagem obrigatoria.
- Cenario 6, Dashboard/Relatorios/CRM consideram apenas leads salvos: aprovado por uso central de `listCompaniesAsync` filtrando CRM leads.

## Pendencias

- Homologacao visual/autenticada em staging/producao ainda deve ser executada com usuario real para confirmar os numeros antes/depois em tela.
- Nao foi executado teste que grave dados reais no Supabase nesta etapa para evitar criacao de registros de teste sem instrucao explicita.

## Recomendacao

Liberado tecnicamente para homologacao funcional autenticada.

Nao liberar deploy apenas com este relatorio se a exigencia for evidencia visual em ambiente real; nesse caso, executar smoke test com usuario real validando Dashboard, Busca, CRM e Relatorios antes da publicacao.
