# RELATORIO_CORRECAO_FICHA360_RECURSO_NAO_ENCONTRADO

Data: 2026-07-12
Branch: main

## Retrabalho v4 - reforco de ID externo e URL canonica

### Motivo da reabertura

Foi identificado novo cenario em que a interface ainda podia receber identificadores externos (`ChIJ...` ou `discovery-*`) e manter a rota `/companies/{id_externo}` em desktop/mobile. Mesmo com o backend capaz de resolver registros ja salvos, a URL nao era canonizada para o ID interno e alguns caminhos ainda nao tratavam `discovery-*` como ID temporario.

### Causa complementar encontrada

- A regra de persistencia previa da Ficha cobria `ChIJ`, `search-*`, `apollo-company-*` e `econodata-*`, mas nao cobria `discovery-*`.
- A pagina da Ficha 360 carregava o registro retornado pela API, mas nao redirecionava para `/companies/{id_interno}` quando o backend resolvia um ID externo para uma empresa ja persistida.
- O lookup por `place_id/google_place_id` usava filtro `.or(...)`, menos robusto para IDs externos especiais. Foi trocado por consultas `eq` sequenciais.

### Correcoes adicionais implementadas

- `apps/web/components/CompanyTable.tsx`: `discovery-*` agora tambem obriga salvar/resolver antes de navegar para Ficha.
- `apps/web/app/companies/[id]/page.tsx`: se a API retornar empresa com `company.id` diferente do ID solicitado, a pagina redireciona para o ID interno canonico.
- `apps/api/src/services/companyStore.ts`: lookup por identificador externo reforcado com consultas sequenciais em `place_id` e `google_place_id`, evitando fragilidade de parsing no `.or(...)`.

### Resultado esperado

- Ficha aberta por busca, listagem, desktop, mobile ou URL antiga passa a usar registro persistido.
- Registros validos deixam de exibir "Recurso nao encontrado" por uso indevido de ID externo.
- URLs antigas continuam compatíveis, mas sao normalizadas para o registro interno quando houver correspondencia.

---

## Problema

Ao abrir a Ficha 360 a partir de uma empresa/cliente, a interface exibida no mobile mostrava:

- "Não foi possível abrir a Ficha 360º"
- "A empresa foi encontrada, mas a ficha não carregou todos os dados neste momento."
- "Detalhe: Recurso não encontrado."

O ID exibido no print tinha formato `ChIJ...`, caracteristico de `place_id` do Google Places.

## Causa raiz

A ação **Ficha** na tabela de resultados da Busca de empresas apontava diretamente para:

`/companies/{company.id}`

Nos resultados de busca, `company.id` pode ser um identificador externo temporario do Google Places, Apollo, Econodata ou busca, e nao necessariamente um registro persistido em `nodere_companies`.

Quando o usuario clicava em **Ficha** antes de salvar o lead no CRM, o frontend navegava para `/companies/ChIJ...`. O backend tentava carregar esse ID em `nodere_companies`, nao encontrava registro CRM salvo e retornava 404. A pagina capturava o erro e mostrava a tela estavel de falha.

## Correcoes implementadas

1. Resolucao da Ficha a partir da Busca
- `apps/web/components/CompanyTable.tsx`
- Em tabelas embutidas na busca (`embedded`), o clique em **Ficha** agora chama `saveSearchResultAsLead`.
- Se o lead for novo, navega para `/companies/{id_persistido}`.
- Se o backend detectar duplicidade e retornar `409 DUPLICATE_LEAD`, o frontend usa `payload.company.id` e navega para o registro existente.
- O mesmo fluxo foi aplicado ao clique no nome da empresa em resultados de busca.
- A interface mostra "Preparando Ficha 360°..." e "Abrindo..." enquanto resolve o registro.

2. Fallback de identificador externo no backend
- `apps/api/src/services/companyStore.ts`
- Se `/companies/:id` receber um ID externo como `ChIJ...`, `search-*`, `apollo-company-*` ou `econodata-*` e nao encontrar por `id`, o backend tenta localizar um lead CRM existente pelos sinais de deduplicacao, incluindo `placeId` salvo em `digital_signals`.
- Isso cobre links antigos, cache local ou URLs compartilhadas com identificadores externos.

3. ID interno para novos leads da busca
- `apps/api/src/routes/companies.ts`
- Novos leads salvos a partir da busca deixam de usar `ChIJ...`, `search-*`, `apollo-company-*`, `econodata-*` ou `discovery-*` como chave primaria.
- O backend gera `company-{uuid}` como ID persistido e grava o identificador externo em `placeId/googlePlaceId`.
- Duplicidades continuam sendo resolvidas por `placeId`, CNPJ, telefone, dominio ou nome+cidade+estado.

4. Persistencia real de place_id/google_place_id
- `apps/api/src/services/companyStore.ts`
- `toRow` agora grava `place_id` e `google_place_id` quando as colunas existem.
- `fromRow` agora retorna `placeId` e `googlePlaceId` no payload da API.
- `dbGet` tenta lookup por `id`, depois por `place_id/google_place_id`, e por fim pela deduplicacao compativel com dados antigos.

5. Contrato tipado
- `apps/api/src/types.ts`
- `apps/web/lib/types.ts`
- `Company` agora declara `placeId` e `googlePlaceId`.
- `apps/api/src/routes/discovery.ts` normaliza esses valores como string.

6. Mensagem de fallback corrigida
- `apps/web/app/companies/[id]/page.tsx`
- A mensagem nao afirma mais que "a empresa foi encontrada" quando o erro pode ser justamente identificador externo nao persistido.

7. Documentacao
- `apps/web/app/manual/page.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`

## Fluxo corrigido

1. Usuario pesquisa uma empresa.
2. Usuario clica em **Ficha** no resultado.
3. Frontend envia o resultado para `/api/companies/save-from-search`.
4. Backend cria lead ou retorna duplicidade com registro existente.
5. Frontend navega para `/companies/{id_real_salvo}`.
6. Ficha 360 carrega a partir do registro persistido.

## Cenários cobertos

- Empresa nova vinda da busca: salva antes de abrir.
- Empresa duplicada: abre o registro CRM existente.
- Link antigo com `place_id`: backend tenta resolver para lead persistido.
- Empresa salva na lista oficial: navegação direta preservada.
- Dados parciais: ficha continua usando estados vazios e fallbacks já existentes.

## Arquivos alterados

- `apps/web/components/CompanyTable.tsx`
- `apps/web/app/companies/[id]/page.tsx`
- `apps/api/src/routes/companies.ts`
- `apps/api/src/routes/discovery.ts`
- `apps/api/src/services/companyStore.ts`
- `apps/api/src/types.ts`
- `apps/web/lib/types.ts`
- `apps/web/app/manual/page.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`
- `RELATORIO_CORRECAO_FICHA360_RECURSO_NAO_ENCONTRADO.md`

## Validações executadas

- `apps/web npm run lint`: aprovado.
- `apps/web npm run typecheck`: aprovado.
- `apps/web npm run build`: aprovado.
- `apps/api npm run typecheck`: aprovado.
- `apps/api npm run build`: aprovado.
- `apps/api npm run test:phase1`: aprovado, 11 testes.
- `apps/api npm run test:crm`: aprovado, 2 testes.
- `node scripts/validate-commercial-schema.mjs`: aprovado, incluindo `place_id`.
- `npm run build` na raiz: aprovado.
- `git diff --check`: aprovado, apenas avisos LF/CRLF.

## Pendências

- Executar validação visual real com sessão owner/admin em mobile e desktop.
- Testar em produção após deploy autorizado.
- Se houver URLs antigas já abertas em cache, o fallback backend cobre casos em que o lead já exista. Se o lead nunca foi salvo, a URL externa isolada ainda deve orientar o usuario a voltar para empresas/busca e salvar o lead.

## Status

- Causa raiz identificada: SIM
- Correção de navegação implementada: SIM
- Fallback backend implementado: SIM
- Manual atualizado: SIM
- Testes técnicos aprovados: SIM
- Funcionalidades preservadas: SIM
